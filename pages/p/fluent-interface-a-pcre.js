// @flow

import WithPost from '../../components/WithPost';

export default WithPost({
  "attributes": {
    "timestamp": 1376166681000,
    "title": "Fluent interface a PCRE",
    "slug": "fluent-interface-a-pcre"
  },
  "body": "<p>Na následujících řádcích předvedu dvě věci. První je úžasný nápad jak vytvářet regulární výrazy pomocí fluent zápisu (<a href=\"https://github.com/VerbalExpressions/PHPVerbalExpressions/blob/master/VerbalExpressions.php\">inspirace</a>), což je druhá věc o které bych se rád zmínil.</p>\n<h2 id=\"regul-rn-v-razy-jsou-peklo\">Regulární výrazy jsou peklo <a href=\"#regul-rn-v-razy-jsou-peklo\">#</a></h2><p>Ačkoliv znám pár lidí, které regulární výrazy umí, je jich opravdu pár. A nikdo z nich o sobě neřekne, že je umí. Následuje příklad velmi triviálního výrazu, který je ovšem dosti špatný, což je dobře, protože se k tomu vrátím později:</p>\n<pre><code class=\"hljs\">/^(http)(s)?(\\:\\/\\/)(www\\.)?([^ ]*)(\\.)([^ ]*)(\\/)?$/\n</code></pre><p>Tento výraz akceptuje přibližně tvar URL. Je však zřejmé, že je to zápis, který je nesmírně náročný na vymyšlení a extrémně náchylný ke tvoření chyb. Proto je vhodné si jeho tvorbu zjednodušit například nějakou třídou:</p>\n<pre><code class=\"hljs lang-php\"><span class=\"hljs-meta\">&lt;?php</span>\n\n<span class=\"hljs-class\"><span class=\"hljs-keyword\">class</span> <span class=\"hljs-title\">Regexp</span> </span>{\n\n    <span class=\"hljs-keyword\">private</span> $regexp = <span class=\"hljs-string\">''</span>;\n\n    <span class=\"hljs-keyword\">public</span> <span class=\"hljs-function\"><span class=\"hljs-keyword\">function</span> <span class=\"hljs-title\">has</span><span class=\"hljs-params\">($value)</span> </span>{\n        <span class=\"hljs-keyword\">$this</span>-&gt;regexp .= <span class=\"hljs-string\">\"(\"</span> . preg_quote($value, <span class=\"hljs-string\">'/'</span>) . <span class=\"hljs-string\">\")\"</span>;\n        <span class=\"hljs-comment\">//return $this;   -   potřebné pro fluent interface</span>\n    }\n\n    <span class=\"hljs-keyword\">public</span> <span class=\"hljs-function\"><span class=\"hljs-keyword\">function</span> <span class=\"hljs-title\">maybe</span><span class=\"hljs-params\">($value)</span> </span>{\n        <span class=\"hljs-keyword\">$this</span>-&gt;regexp .= <span class=\"hljs-string\">\"(\"</span> . preg_quote($value, <span class=\"hljs-string\">'/'</span>) . <span class=\"hljs-string\">\")?\"</span>;\n        <span class=\"hljs-comment\">//return $this;   -   potřebné pro fluent interface</span>\n    }\n\n    <span class=\"hljs-keyword\">public</span> <span class=\"hljs-function\"><span class=\"hljs-keyword\">function</span> <span class=\"hljs-title\">anythingBut</span><span class=\"hljs-params\">($value)</span> </span>{\n        <span class=\"hljs-keyword\">$this</span>-&gt;regexp .= <span class=\"hljs-string\">\"([^\"</span> . preg_quote($value, <span class=\"hljs-string\">'/'</span>) . <span class=\"hljs-string\">\"]*)\"</span>;\n        <span class=\"hljs-comment\">//return $this;   -   potřebné pro fluent interface</span>\n    }\n\n    <span class=\"hljs-keyword\">public</span> <span class=\"hljs-function\"><span class=\"hljs-keyword\">function</span> <span class=\"hljs-title\">__toString</span><span class=\"hljs-params\">()</span> </span>{\n        <span class=\"hljs-keyword\">return</span> <span class=\"hljs-string\">\"/^$this-&gt;regexp$/\"</span>;\n    }\n\n}\n</code></pre>\n<p>S tím, že její použití je prosté:</p>\n<pre><code class=\"hljs lang-php\">$regexp = <span class=\"hljs-keyword\">new</span> Regexp();\n$regexp-&gt;then(<span class=\"hljs-string\">'http'</span>);\n$regexp-&gt;maybe(<span class=\"hljs-string\">'s'</span>);\n$regexp-&gt;then(<span class=\"hljs-string\">'://'</span>);\n$regexp-&gt;maybe(<span class=\"hljs-string\">'www.'</span>);\n$regexp-&gt;anythingBut(<span class=\"hljs-string\">' '</span>);\n$regexp-&gt;then(<span class=\"hljs-string\">'.'</span>);\n$regexp-&gt;anythingBut(<span class=\"hljs-string\">' '</span>);\n$regexp-&gt;maybe(<span class=\"hljs-string\">'/'</span>);\n<span class=\"hljs-keyword\">echo</span> $regexp . <span class=\"hljs-string\">'&lt;br&gt;'</span>;\n<span class=\"hljs-keyword\">echo</span> preg_match($regexp, <span class=\"hljs-string\">'http://zlml.cz/'</span>) ? <span class=\"hljs-string\">'P'</span> : <span class=\"hljs-string\">'F'</span>;\n<span class=\"hljs-keyword\">echo</span> preg_match($regexp, <span class=\"hljs-string\">'https://zlml.cz/'</span>) ? <span class=\"hljs-string\">'P'</span> : <span class=\"hljs-string\">'F'</span>;\n</code></pre>\n<p>Nemusím však říkat, že to minimálně vypadá naprosto otřesně. Spousta psaní, až moc objektové chování. Elegantnější řešení přináší právě fluent interface.</p>\n<h2 id=\"fluent-interfaces-regul-rn-peklo-chladne\">Fluent interfaces, regulární peklo chladne <a href=\"#fluent-interfaces-regul-rn-peklo-chladne\">#</a></h2><p>Fluent interface je způsob jak řetězit metody za sebe. Používá se poměrně často, ušetří spoustu zbytečného psaní a velmi prospívá srozumitelnosti kódu. Nevýhodou je, že se musí v každé metodě vrátit objekt <code>return $this;</code>, na což se nesmí zapomenout. Každopádně výsledek je skvostný:</p>\n<pre><code class=\"hljs lang-php\">$regexp = <span class=\"hljs-keyword\">new</span> Regexp();\n$regexp-&gt;then(<span class=\"hljs-string\">'http'</span>)\n        -&gt;maybe(<span class=\"hljs-string\">'s'</span>)\n        -&gt;then(<span class=\"hljs-string\">'://'</span>)\n        -&gt;maybe(<span class=\"hljs-string\">'www.'</span>)\n        -&gt;anythingBut(<span class=\"hljs-string\">' '</span>)\n        -&gt;then(<span class=\"hljs-string\">'.'</span>)\n        -&gt;anythingBut(<span class=\"hljs-string\">' '</span>)\n        -&gt;maybe(<span class=\"hljs-string\">'/'</span>);\n<span class=\"hljs-keyword\">echo</span> $regexp . <span class=\"hljs-string\">'&lt;br&gt;'</span>;\n<span class=\"hljs-keyword\">echo</span> preg_match($regexp, <span class=\"hljs-string\">'http://zlml.cz/'</span>) ? <span class=\"hljs-string\">'P'</span> : <span class=\"hljs-string\">'F'</span>;\n<span class=\"hljs-keyword\">echo</span> preg_match($regexp, <span class=\"hljs-string\">'https://zlml.cz/'</span>) ? <span class=\"hljs-string\">'P'</span> : <span class=\"hljs-string\">'F'</span>;\n</code></pre>\n<p>Teprve zde vynikne to, jak je důležité správně (čti stručně a jasně) pojmenovávat metody. Díky fluent interfaces lze programovat téměř ve větách, které jsou naprosto srozumitelné.</p>\n<h2 id=\"ne-peklo-je-op-t-peklem\">Ne, peklo je opět peklem <a href=\"#ne-peklo-je-op-t-peklem\">#</a></h2><p>Ačkoliv by se mohlo zdát, že díky objektu, který pomáhá tvořit regulární výrazy je jejich kompozice jednoduchou záležitostí, není tomu tak. Vrátím se k původnímu výrazu, který není dobrý. Proč? V reálném světě je kontrola, resp. předpis, který musí daná adresa mít daleko složitější. Například <code>http</code> nemusí být vůbec přítomno, pokud však je, musí následovat možná <code>s</code> a zcela určitě <code>://</code>. To samé s doménou. Ta může být jen určitý počet znaků dlouhá, může obsahovat tečky (ale ne neomezené množství), samotná TLD má také určitá pravidla (minimálně co se týče délky) a to nemluvím o parametrech za adresou, které jsou téměř bez limitu.</p>\n<p>Zkuste si takový objekt napsat. Ve výsledku se i nadále budou regulární výrazy psát ručně, nebo se ve složitějších případech vůbec používat nebudou.</p>\n"
});
