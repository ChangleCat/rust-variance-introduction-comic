# 在装有 IndexTTS 2.5 的机器上批量生成配音（模型只加载一次）。
#
# 1. 本机导出任务：node tools/gen-voice.mjs --export-jobs jobs.json --ref claude=examples/voice_09.wav ...
# 2. 在 IndexTTS 的 src 目录下运行（需要 IndexTTS 的 Python 环境）：
#      python indextts_batch.py --model_dir ../models/IndexTeam_IndexTTS-2.5 --jobs jobs.json --out wavs --fp16
# 3. 把 wavs 目录拷回本机：node tools/gen-voice.mjs --from-wavs wavs
import argparse
import json
import os
import sys
import time

for k, v in {"HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "HF_HUB_DISABLE_TELEMETRY": "1", "HF_HUB_DISABLE_PROGRESS_BARS": "1"}.items():
    os.environ.setdefault(k, v)

parser = argparse.ArgumentParser(description="IndexTTS 2.5 batch voice generation")
parser.add_argument("--model_dir", required=True)
parser.add_argument("--jobs", required=True, help="gen-voice.mjs --export-jobs 导出的 JSON")
parser.add_argument("--out", required=True)
parser.add_argument("--fp16", action="store_true")
parser.add_argument("--force", action="store_true", help="覆盖已存在的 wav")
parser.add_argument("--only", default="", help="只生成这些 id，逗号分隔")
args = parser.parse_args()

sys.path.insert(0, os.getcwd())
from indextts.infer_v2_5 import IndexTTS2  # noqa: E402

with open(args.jobs, encoding="utf-8") as f:
    jobs = json.load(f)
only = set(filter(None, args.only.split(",")))
os.makedirs(args.out, exist_ok=True)

tts = IndexTTS2(model_dir=args.model_dir, cfg_path=os.path.join(args.model_dir, "config.yaml"), use_bf16=args.fp16)
lines = [l for l in jobs["lines"] if not only or l["id"] in only]
t0 = time.time()
for i, line in enumerate(lines):
    out = os.path.join(args.out, line["id"] + ".wav")
    if os.path.exists(out) and not args.force:
        continue
    ref = jobs["refs"][line["who"]]
    tts.infer(spk_audio_prompt=ref, text=line["text"], output_path=out, lang=jobs.get("lang", "ZH"), verbose=False)
    print(f"[{i + 1}/{len(lines)}] {line['id']}  {time.time() - t0:.0f}s", flush=True)
print("done", flush=True)
