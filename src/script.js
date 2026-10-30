// 配音文案 —— 整部动画唯一的文案来源。
// 字幕、浏览器朗读、tools/gen-voice.mjs 生成的配音、docs/script.md 都从这里读取。
//
// 每一句: [说话人, 字幕文本, 朗读文本(可选，用于把代码符号读成人话)]
// 说话人: claude | ferris | rustc
(function (root) {
  const SCRIPT = [
    {
      id: 'ch0', title: '开场', subtitle: '一个怪现象',
      scenes: [
        {
          id: 'op_hook', title: '螃蟹的困惑',
          lines: [
            ['ferris', '嘿，Claude！我写 Rust 的时候遇到一件怪事。'],
            ['ferris', "把 &'static str 传给要 &'a str 的函数，畅通无阻；", '把 static 字符串引用，传给要求 a 生命周期的函数，畅通无阻；'],
            ['ferris', '可一换成 &mut，编译器立刻翻脸。', '可一换成可变引用，编译器立刻翻脸。'],
            ['claude', '好问题！这背后藏着类型系统里一个古老的概念——型变。'],
            ['claude', '今天我们把协变、逆变、不变、双变，一次讲清楚。'],
            ['claude', '故事，要从几十年前的一只猫说起。'],
          ],
        },
      ],
    },
    {
      id: 'ch1', title: '第一章 · 起源', subtitle: '一笼猫，是不是一笼动物？',
      scenes: [
        {
          id: 'origin_subtype', title: '子类型与替换原则',
          lines: [
            ['claude', '1967 年，Simula 语言带来了“类”和“继承”。'],
            ['claude', '猫是一种动物。在类型系统里，我们说 Cat 是 Animal 的子类型。'],
            ['claude', '1987 年，Barbara Liskov 把它总结成一条原则：'],
            ['claude', '需要动物的地方，递过去一只猫，程序也应该照常工作。'],
            ['ferris', '懂了，子类型就是“能顶替”。'],
          ],
        },
        {
          id: 'origin_question', title: '类型构造器',
          lines: [
            ['claude', '可新问题马上来了：一只猫是动物，那一笼猫，算不算一笼动物？'],
            ['claude', '笼子、列表、函数，这些“装着别的类型的类型”，叫作类型构造器。'],
            ['claude', '型变要回答的就是：里面的子类型关系，会怎样传到外面。'],
          ],
        },
        {
          id: 'origin_java', title: 'Java 数组的教训',
          lines: [
            ['claude', '1996 年的 Java 1.0 给出了一个很大方的答案：猫的数组，可以直接当动物数组用。'],
            ['claude', '读出来的每一只都是动物，看起来天衣无缝。'],
            ['ferris', '等等……那我往这个“动物数组”里塞一只狗呢？'],
            ['claude', '编译器拦不住。只能等到运行时，虚拟机抛出 ArrayStoreException。'],
            ['claude', '问题在于：这个笼子既能读，又能写。读和写，需要的恰好是相反的规则。'],
          ],
        },
        {
          id: 'origin_function', title: '函数的子类型',
          lines: [
            ['claude', '八十年代，Luca Cardelli 研究函数的子类型时，把这条规律讲清楚了。'],
            ['claude', '一个函数要顶替另一个：返回值可以更具体，参数却要更宽容。'],
            ['claude', '返回值和子类型同向变化，叫协变；参数反向变化，叫逆变。'],
            ['claude', '这两个词借自数学，说的就是“方向”被保持，还是被翻转。'],
          ],
        },
      ],
    },
    {
      id: 'ch2', title: '第二章 · 发展', subtitle: '各门语言的驯服之路',
      scenes: [
        {
          id: 'dev_langs', title: '使用处与声明处',
          lines: [
            ['claude', '之后的几十年，各门语言都在想办法驯服型变。'],
            ['claude', '2004 年，Java 5 的泛型选择了谨慎：List<Cat> 和 List<Animal> 毫无关系。这叫不变。', '2004 年，Java 5 的泛型选择了谨慎：猫的列表和动物的列表毫无关系。这叫不变。'],
            ['claude', '需要灵活时，在使用处写通配符：? extends 只管读，? super 只管写。', '需要灵活时，在使用处写通配符：extends 只管读，super 只管写。'],
            ['claude', 'C# 和 Kotlin 用 out 和 in，Scala 用加号和减号，直接在声明处标注。'],
            ['ferris', 'out 只往外拿，in 只往里放，好形象！'],
          ],
        },
        {
          id: 'dev_bivariant', title: '第四种：双变',
          lines: [
            ['claude', '还有第四种，叫双变：两个方向都放行。'],
            ['claude', 'TypeScript 的方法参数就是双变的。用起来方便，代价是漏掉一些类型错误。'],
          ],
        },
        {
          id: 'dev_summary', title: '四种态度',
          lines: [
            ['claude', '总结一下：型变，就是外层类型对待内层子类型关系的四种态度。'],
            ['claude', '协变，方向保持；逆变，方向翻转；不变，互不相认；双变，来者不拒。'],
          ],
        },
      ],
    },
    {
      id: 'ch3', title: '第三章 · Rust 登场', subtitle: '生命周期，也是一种关系',
      scenes: [
        {
          id: 'rust_noinherit', title: '没有继承的 Rust',
          lines: [
            ['ferris', '轮到我们 Rust 了！不过……Rust 根本没有继承啊？'],
            ['claude', '没错，Rust 没有类继承。但它有一种更隐蔽的关系：生命周期。'],
          ],
        },
        {
          id: 'rust_lifetimes', title: '活得久，就能顶替',
          lines: [
            ['claude', '每个引用都带着生命周期，代表它保证有效的那一段区间。'],
            ['claude', "如果 'long 覆盖了 'short，就写作 'long: 'short，读作 long 比 short 活得久。", '如果 long 覆盖了 short，就写作 long 冒号 short，读作 long 比 short 活得久。'],
            ['claude', "活得久的引用，当然能当活得短的用。所以 &'long T 是 &'short T 的子类型。", '活得久的引用，当然能当活得短的用。所以 long 引用是 short 引用的子类型。'],
            ['claude', "其中最长寿的是 'static，它一直活到程序结束。", '其中最长寿的是 static，它一直活到程序结束。'],
            ['ferris', '原来生命周期也是子类型！长寿的像“猫”，短命的像“动物”。'],
            ['claude', '正是如此。Rust 里的型变，几乎都围绕生命周期展开。'],
          ],
        },
      ],
    },
    {
      id: 'ch4', title: '第四章 · 四种型变', subtitle: '在代码里看见它们',
      scenes: [
        {
          id: 'v_covariant', title: '协变：&T',
          lines: [
            ['claude', "第一种，协变。共享引用 &'a T，对 'a 和 T 都是协变的。", '第一种，协变。共享引用，对生命周期 a 和类型 T 都是协变的。'],
            ['claude', "函数要一个 &'a str，我们递给它 &'static str，编译器欣然接受。", '函数要一个 a 生命周期的字符串引用，我们递给它 static 的，编译器欣然接受。'],
            ['claude', 'Box、Vec、Option 也都是协变的：一箱长寿引用，可以当作一箱短寿引用。'],
            ['ferris', '只读不写，就不会出乱子。'],
          ],
        },
        {
          id: 'v_invariant', title: '不变：&mut T',
          lines: [
            ['claude', "第二种，不变。可变引用 &'a mut T，对 T 是不变的。", '第二种，不变。可变引用，对 T 是不变的。'],
            ['claude', '看这个 assign 函数：它把 val 写进 input 指向的地方。'],
            ['claude', "假如 &mut 是协变的，&mut &'static str 就能被当作 &mut &'world str。", '假如可变引用是协变的，指向 static 引用的可变引用，就能被当作指向 world 引用的。'],
            ['claude', '于是，短命的 world 引用，被写进了要求永生的 hello。'],
            ['ferris', '然后 world 一死，hello 就指向了一片废墟！'],
            ['claude', '这和 Java 数组里塞进狗，是同一个问题。Java 在运行时报错，Rust 在编译期就说不。'],
            ['rustc', 'error E0597：world 活得不够久。'],
            ['claude', '同理，Cell、RefCell、*mut T 这些能写入的类型，对 T 也都是不变的。', '同理，Cell、RefCell、裸可变指针这些能写入的类型，对 T 也都是不变的。'],
          ],
        },
        {
          id: 'v_contravariant', title: '逆变：fn(T)',
          lines: [
            ['claude', '第三种，逆变。在 Rust 里，它只出现在函数参数上。'],
            ['claude', 'fn(T) 对 T 是逆变的。能处理任何短命字符串的函数，当然也能处理永生的字符串。', '函数指针对参数类型 T 是逆变的。能处理任何短命字符串的函数，当然也能处理永生的字符串。'],
            ['claude', "所以 fn(&'short str) 可以当作 fn(&'static str) 用，方向恰好反过来。", '所以接收 short 引用的函数，可以当作接收 static 引用的函数用，方向恰好反过来。'],
            ['ferris', "反过来可不行：只敢收 'static 的函数，没法交给短命的引用！", '反过来可不行：只敢收 static 的函数，没法交给短命的引用！'],
            ['rustc', 'error：lifetime may not live long enough。'],
          ],
        },
        {
          id: 'v_bivariant', title: '双变与 PhantomData',
          lines: [
            ['claude', '第四种，双变。在 Rust 的代码里，你几乎见不到它。'],
            ['claude', '一个泛型参数如果完全没被用到，它对子类型关系就毫无约束，这就是双变。'],
            ['claude', '但 Rust 不允许这样的参数存在：它会报 E0392，让你用 PhantomData 讲清楚。'],
            ['claude', 'PhantomData<T> 是协变，PhantomData<fn(T)> 是逆变，PhantomData<fn(T) -> T> 是不变。', 'PhantomData T 是协变，PhantomData 函数 T 是逆变，PhantomData 函数 T 返回 T 是不变。'],
            ['ferris', '原来 PhantomData 是写给编译器看的型变说明书！'],
          ],
        },
        {
          id: 'v_cheatsheet', title: '口诀与速查表',
          lines: [
            ['claude', '记住一句口诀：只读可协变，只写可逆变，又读又写必不变，从未使用是双变。'],
            ['claude', '这张速查表，值得截图保存。'],
          ],
        },
      ],
    },
    {
      id: 'ch5', title: '第五章 · 走进 rustc', subtitle: '编译器如何判断型变',
      scenes: [
        {
          id: 'c_intro', title: '推断，而不是标注',
          lines: [
            ['ferris', '可是，编译器怎么知道我自己写的结构体是哪种型变？我从来没标注过。'],
            ['claude', '因为 Rust 的型变是推断出来的。我们走进 rustc 看看。'],
            ['rustc', '欢迎来到型变推断车间。'],
          ],
        },
        {
          id: 'c_lattice', title: '型变之格',
          lines: [
            ['claude', '首先，四种型变构成一个“格”：双变在最底，协变和逆变在中间，不变在最顶。'],
            ['claude', '往上走，约束越来越强。两个结论合并时，就取它们在格上的上界。'],
            ['claude', '每个泛型参数，一开始都被假定为双变，也就是还没有任何约束。'],
          ],
        },
        {
          id: 'c_walk', title: '逐个字段收集约束',
          lines: [
            ['claude', '然后，编译器逐个检查字段，看每个参数出现在什么位置。'],
            ['claude', "字段 a 是 &'a T：'a 协变，T 协变。", '字段 a 是共享引用：a 协变，T 协变。'],
            ['claude', "字段 b 是 &'b mut U：'b 协变，U 不变。", '字段 b 是可变引用：b 协变，U 不变。'],
            ['claude', '字段 f 是 fn(T)：T 出现在参数位置，是逆变。', '字段 f 是函数指针：T 出现在参数位置，是逆变。'],
            ['claude', 'T 既协变又逆变，取上界，只能是不变。'],
          ],
        },
        {
          id: 'c_xform', title: '位置的乘法',
          lines: [
            ['claude', '嵌套的类型怎么办？位置的型变，会像正负号相乘一样组合。'],
            ['claude', '协变乘任何东西都不改变它；逆变乘逆变，负负得正；碰到不变，结果就是不变。'],
            ['claude', '比如 fn(fn(T)) 里的 T，被翻转了两次，反而是协变的。', '比如函数参数里再套一个函数参数，T 被翻转了两次，反而是协变的。'],
          ],
        },
        {
          id: 'c_fixpoint', title: '不动点',
          lines: [
            ['claude', '遇到递归类型，比如链表里引用自己，编译器就反复迭代，直到结果不再变化。'],
            ['claude', '这个结果叫不动点。最后还停在双变的参数，说明它没有被真正用到，编译器会直接报错。'],
          ],
        },
        {
          id: 'c_use', title: '型变表的用途',
          lines: [
            ['claude', '推断出的型变表，会在每次比较两个类型时派上用场。'],
            ['claude', '协变参数要求同向子类型，逆变要求反向，不变要求两边完全相等。'],
            ['claude', '生命周期之间的要求，最后交给借用检查器求解。解不出来，就是我们见过的那些错误。'],
            ['rustc', '想亲眼看看？在 nightly 上给结构体加 #[rustc_variance]，我会把推断结果打印出来。', '想亲眼看看？在 nightly 上给结构体加上 rustc variance 属性，我会把推断结果打印出来。'],
          ],
        },
      ],
    },
    {
      id: 'ch6', title: '尾声', subtitle: '编译器的一份温柔',
      scenes: [
        {
          id: 'end_recap', title: '回顾',
          lines: [
            ['claude', '回顾一下：型变诞生于“一笼猫是不是一笼动物”的追问。'],
            ['claude', 'Java 为此付出了运行时的代价，后来的语言学会了区分读和写。'],
            ['claude', 'Rust 把子类型藏进生命周期，再用型变规则，在编译期挡住悬垂引用。'],
            ['ferris', '下次编译器说 invariant，我就知道它在保护我了！'],
            ['claude', '没错。读懂型变，就读懂了编译器的一份温柔。谢谢收看！'],
          ],
        },
      ],
    },
  ];

  // 估算朗读时长（秒）。只在没有真实配音时使用；有配音时播放器按 voice/manifest.js 的实测时长排时间轴。
  function estimateDuration(text) {
    let d = 0.45;
    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) d += 0.215;
      else if (/[，、；：]/.test(ch)) d += 0.22;
      else if (/[。！？…]/.test(ch)) d += 0.3;
      else if (/[A-Za-z0-9]/.test(ch)) d += 0.085;
      else d += 0.03;
    }
    return Math.max(1.8, d);
  }

  const SPEAKERS = {
    claude: { name: 'Claude', color: '#D97757' },
    ferris: { name: 'Ferris', color: '#F74C00' },
    rustc: { name: 'rustc', color: '#5B8DEF' },
  };

  function flatten() {
    const out = [];
    for (const ch of SCRIPT) {
      for (const sc of ch.scenes) {
        sc.lines.forEach((l, i) => {
          out.push({ id: `${sc.id}_${i}`, chapter: ch.id, scene: sc.id, who: l[0], text: l[1], speak: l[2] || l[1] });
        });
      }
    }
    return out;
  }

  const api = { SCRIPT, SPEAKERS, estimateDuration, flatten };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VARIANCE = api;
})(typeof window !== 'undefined' ? window : globalThis);
