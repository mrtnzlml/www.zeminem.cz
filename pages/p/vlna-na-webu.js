// @flow

import WithPost from '../../components/WithPost';

export default WithPost({
  "attributes": {
    "timestamp": 1391288978000,
    "title": "Vlna na webu",
    "slug": "vlna-na-webu"
  },
  "body": "<p>Vlna je program <a href=\"http://ftp.linux.cz/pub/tex/local/cstug/olsak/vlna/\">Petra Olšáka</a>, který slouží k umístění nezalomitelné místo na místo v textu, kde by nemělo dojít k samovolnému zalomení řádku. Tento program slouží k dodatečné úpravě textů napsaných v LaTeXu. V tomto prostředí se nezalomitelná mezera nahrazuje znakem vlnovkou - tildou (~). U webového výstupu se používá zástupná entita <code>&amp;nbsp;</code>.</p>\n<h2 id=\"kde-by-m-la-b-t-ned-liteln-mezera\">Kde by měla být nedělitelná mezera <a href=\"#kde-by-m-la-b-t-ned-liteln-mezera\">#</a></h2><p>V základu program Vlna umístí tildu za znaky <code>KkSsVvZzOoUuAI</code>. Více toho pokud vím nedělá. Podle Ústavu pro jazyk český AV ČR by však toto pravidlo mělo platit mimo jiné pro znaky <code>KkSsVvZzAaIiOoUu</code>. Neuvažuji další pravidla, která určují další nevhodné výrazy na konci řádku. Mezi tyto pravidla patří například mezery uvnitř číslic, mezery mezi číslicí a značkou, atd. Některá pravidla jsou totiž natolik specifická, že by je bylo náročné (nebo nepraktické) podchytit programově.</p>\n<h2 id=\"implementace\">Implementace <a href=\"#implementace\">#</a></h2><p>O samotné nahrazování se stará následující regulární výraz:</p>\n<pre><code class=\"hljs lang-php\">preg_replace(<span class=\"hljs-string\">'&lt;([^a-zA-Z0-9])([ksvzaiou])\\s([a-zA-Z0-9]{1,})&gt;i'</span>, <span class=\"hljs-string\">\"$1$2\\xc2\\xa0$3\"</span>, $string); <span class=\"hljs-comment\">//&amp;nbsp; === \\xc2\\xa0</span>\n</code></pre>\n<p>Tento výraz říká, že nestojí-li bezprostředně před sadou znaků <code>KkSsVvZzAaIiOoUu</code> jiný alfanumerický znak a stojí-li za touto sadou jakýkoliv alfanumerický znak oddělený bílým znakem bude tento znak nahrazen entitou <code>&amp;nbsp;</code>. V konkrétní implementaci lze zaregistrovat Vlnu jako helper pro Latte šablony například takto (obsahuje i registraci Texy helperu):</p>\n<pre><code class=\"hljs lang-php\"><span class=\"hljs-comment\">/**\n * <span class=\"hljs-doctag\">@param</span> null $class\n * <span class=\"hljs-doctag\">@return</span> Nette\\Templating\\ITemplate\n */</span>\n<span class=\"hljs-keyword\">protected</span> <span class=\"hljs-function\"><span class=\"hljs-keyword\">function</span> <span class=\"hljs-title\">createTemplate</span><span class=\"hljs-params\">($class = NULL)</span> </span>{\n    $template = <span class=\"hljs-keyword\">parent</span>::createTemplate($class);\n    $texy = <span class=\"hljs-keyword\">new</span> \\Texy();\n    $template-&gt;registerHelper(<span class=\"hljs-string\">'texy'</span>, callback($texy, <span class=\"hljs-string\">'process'</span>));\n    $template-&gt;registerHelper(<span class=\"hljs-string\">'vlna'</span>, <span class=\"hljs-function\"><span class=\"hljs-keyword\">function</span> <span class=\"hljs-params\">($string)</span> </span>{\n        $string = preg_replace(<span class=\"hljs-string\">'&lt;([^a-zA-Z0-9])([ksvzaiou])\\s([a-zA-Z0-9]{1,})&gt;i'</span>, <span class=\"hljs-string\">\"$1$2\\xc2\\xa0$3\"</span>, $string); <span class=\"hljs-comment\">//&amp;nbsp; === \\xc2\\xa0</span>\n        <span class=\"hljs-keyword\">return</span> $string;\n    });\n    <span class=\"hljs-keyword\">return</span> $template;\n}\n</code></pre>\n<p>Vlna se pak v Latte šablonách používá jako jakýkoliv jiný helper:</p>\n<pre><code class=\"hljs\">{$post-&gt;title|vlna}\n</code></pre><p>Ještě by možná stálo za to vrátit se k tomu, jaké problémy by způsobovala implementace i dalších pravidel a jak by to bylo náročné. Ještě nad tím budu přemýšlet, každopádně již teď mě napadají určité problémy. Například u čísel. Jak přesně identifikovat, kdy se má použít nedělitelná mezera a kdy ne? Možná je toto právě ten důvod, proč takové rozšířené chování program Vlna nepodporuje...</p>\n"
});
