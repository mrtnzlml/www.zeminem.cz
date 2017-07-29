A když říkám dynamické, tak tím myslím opravdu kompletně. Jinými slovy to znamená, že chceme jakoukoliv cestu za doménou přeložit na jakýkoliv interní požadavek ([Application\Request](http://api.nette.org/2.3.3/Nette.Application.Request.html)). Kousek routovací tabulky tedy může vypadat následovně:

```
/						=> 	Front:Homepage:default
/neco.html				=> 	Front:Page:default
/neco-jineho-8			=> 	Front:Page:default(id=56)
/neco/treba/takoveho	=> 	Front:Page:default(id=96)
/a/b/c/d/e/f 			=> 	Admin:Dashboard:new
...
```

Tím jsem doufám dostatečně přesně nastínil zadání a od toho se odvíjející požadavky na router. V URL může přijít jakákoliv cesta a aplikace ji musí umět správně naroutovat.

Jak funguje routování v Nette
=============================
Pokusím se to vysvětlit trošku jinak než je to vysvětlováno jinde. Většinou se totiž dočtete, jak pracovat s [třídou Route](http://api.nette.org/2.3.3/Nette.Application.Routers.Route.html). To je samozřejmě správně, protože takto se routování v Nette aplikacích naprosto běžně dělá. Nicméně pro tento účel mi přijde vhodnější napsat si router vlastní - o něco hloupější, ale pasující na toto zadání lépe. Proto opustíme tuto třídu a budeme se raději zajímat o [IRouter interface](http://api.nette.org/2.3.3/Nette.Application.IRouter.html).

Tento interface má dvě metody - `match` a `constructUrl`. Metoda `match` má za úkol přeložit HTTP request na již zmíněný [Application\Request](http://api.nette.org/2.3.3/Nette.Application.Request.html). Jedná se tedy o překlad ve směru šipky viz zadání. Podívejte se, jak to řeší třída Route, v tomto konkrétním prípadě však bude potřeba pracovat s databází a napsat si jinou logiku. Oproti tomu metoda `constructUrl` má přesně opačný úkol. Překládá příchozí Application request na (absolutní) URL adresu.

[* 9ab04acb-febc-4901-aaad-5b554f77e529/vystrizek.png 610x? <]

Zatímco Route dokáže tyto překlady sestavit pouze z masky routy a namapovat je na interní odkazy v aplikaci, v tomto případě bude nutná databáze. Po chvíli laborování a asi pěti variantách jsem nakonec udělal ústupek a zvolil tu nejjednodušší (ale dostatečnou) variantu viz obrázek. Stačí si tedy uchovávat cestu, interní odkaz a interní ID. To je vše, co by mělo být potřeba.

Konkrétní řešení
================
Nechci sem dávat celé zdrojáky (jen útržky), protože je tento článek hlavně o teorii. Proto se podívejte na nějakou jinou již hotovou implementaci IRouteru, třeba na [StaticRouter](https://github.com/nextras/static-router/blob/master/src/StaticRouter.php). Ostatně s dobrým nápadem je samotná implementace jednoduchá. V `match` si stačí podle cesty vytáhnout interní odkaz třeba nějak takto:

```php
$destination = $this->em->getRepository(Url::class)->findOneBy(['fakePath' => $path]);
if ($destination === NULL) {
	$this->monolog->addError(sprintf('Cannot find route for path %s', $path));
	return NULL;
}
```

Samozřejmě je fajn si tu cestu ještě před dotazem nějak upravit, podle toho jak jí máte v databázi. Já je tam mám třeba bez úvodního lomítka. Tato cesta odkazu směrem do aplikace je velmi jednoduchá, protože pouze na základě cesty v URL si natáhnete vše, co je potřeba a už vlastně jen sestavíme Application request:

```php
$params = $httpRequest->getQuery();
$params['action'] = $action;
if ($destination[$internalDestination]) {
	$params['id'] = $destination[$internalDestination];
}
return new Application\Request(
	$presenter,
	$httpRequest->getMethod(),
	$params,
	$httpRequest->getPost(),
	$httpRequest->getFiles(),
	[Application\Request::SECURED => $httpRequest->isSecured()]
);
```

Nedělá se zde nic zvláštního, prostě postavím request a přibalím do něj cílový presenter (ten jsem si vytáhl z databáze), do parametrů je třeba přidat action a volitelně ještě to interní ID. Stanovil jsem si takovou konvenci, že aplikace bude používat interně pouze ID. Proč? Prvně je to velmi jednoduché a neřeším žádné hovadiny. Nepotřebuji něco jako je slug, protože jsou adresy konstruovány jinak. Takové je zadání. No a potom práce s ID je i z hlediska Doctrine [velmi přirozené](http://forum.nette.org/cs/23681-kdyby-doctrine-use-cases-best-practices-a-jak-vam-to-dava-smysl#p159096). Jeden příklad za všechny. Mám aplikaci rozsekanou na komponenty co nejvíce to šlo. Je jich fakt hodně - stránku vlastně jen skládám z komponent. To považuji za skvělý návrh, ale vede k tomu, že se jednolivé komponenty od sebe aplikačně trošku vzdalují. No a když bych chtěl třeba v každé komponentě vytáhnout něco stejného, tak při nevhodném dotazu by Doctrine položila dva stejné dotazy na databázi. Je však možné využít ID a zeptat se jinak. Porovnejte následující dotazy:

```php
$this->em->getRepository(File::class)->findOneBy(['id' => 930]);
$this->em->getRepository(File::class)->find(930);
```

Nejsou stejné. Ten druhý můžete použít kolikrát chcete, ale pokud již Doctrine zná odpověď, tak se nezeptá databáze znova. Obdobně (ještě lépe) to funguje s `getPartialReference`. Takže bod pro práci pouze s ID.

Je třeba zajistit i obrácený překlad. Ten mi vždy přijde náročnější a měl jsem vymyšlený fakt pěkný nápad, ale neuměl jsem ho zrealizovat. Ale díky tomu, že se využívá interně jen ID, mohu jej uložit jako třetí sloupec do databáze a je možné jednoduše patřičnou cestu dohledat. Je však třeba uvědomit si, že existují čtyři možné stavy:

1. Odkaz nemá žádné ID, hledáme cestu pouze podle destination (např. Front:Homepage:default - ID je volitelné)
2. Odkaz má ID, hledáme cestu podle destination a ID
3. Odkaz sice má ID, ale v databázi takový záznam není, v tom případě použít první bod a parametry pověsit do query odkazu (fallback)
4. Odkaz se nepodařilo najít ani odhadnout v dalších bodech, routa vrací NULL

Proč vrací v posledním bodě routa NULL? Určitě víte, že při definování klasického routeru záleží na pořadí rout. Je to právě kvůli tomuto. Když první routa nedokáže příchozí požadavek sestavit, vrací NULL a na řadě je další routa, která se o to pokusí. Požadavek propadne dále. Tak to jde až do okamžiku, kdy už není žádná jiná možnost a to je chybový stav (404). Vzhledem k tomu, že používám pouze tento vlastní router, tak NULL je ekvivalent právě k chybě 404. Ale napsal jsem si to tak, aby routa byla hodně žravá a pokusila se za každou cenu nějaký odkaz postavit. Třetí bod je navíc stav, který se loguje.

Ještě je důležitá poslední věc. Jak jsem psal dříve, tak se v `match` metodě přidává do Application requestu action a volitelně ID. V metodě `constructUrl` je potřeba zvolit opačný přístup a zase je zrušit. Nedostanou se tak do URL. V tom je celé kouzlo takto volně definovaných adres. Na vstupu přidám nějaké informace navíc (action, ID), s nima aplikace pracuje a na výstupu je zase z adresy odstraním.

Bez cache ani ránu
==================
Zatím je to docela fajn. By default mám v databázi nějaké základní odkazy a například při ukládání článku vytvořím odkazy nové, které se pak naroutují. Výhoda je jednak v tom, že mohu mít úplně libovolné adresy. Mohu je ale také různě upravovat podle nastavení a pak co je asi nejdůležitější, adresy jsou unikátní a když ji u článku změním, mohu starou (automaticky) přesměrovat na novou. Po tomto musí SEO odborníci čvachtat blahem... :)

Problém je však v tom, že je to spousta práce a bez nějaké alespoň jednoduché cache by to bylo moc komplikované, skoro až nepoužitelné. Řešení je však jednoduché. Prostě cache použijeme:

```php
$destination = $this->cache->load($path, function (& $dependencies) use ($path) {
	$destination = $this->em->getRepository(Url::class)->findOneBy(['fakePath' => $path]);
	if ($destination === NULL) {
		$this->monolog->addError(sprintf('Cannot find route for path %s', $path));
		return NULL;
	}
	return [$destination->destination => $destination->internalId];
});
if ($destination === NULL) {
	return NULL;
}
```

Je to vlastně stejný kód jako v první ukázce, ale výsledek si uloží do cache a příště už ví jaký odkaz použít. Trošku nevýhoda je, že to vygeneruje cache soubůrek pro každý individuální odkaz. Myslím si však, že je to správně, protože skutečně každý odkaz může být úplně jiný. Takže jsem si alespoň pro dobrý pocit vyrobil ještě upravený [FileStorage](http://api.nette.org/2.3.3/Nette.Caching.Storages.FileStorage.html), který cache zanořuje ještě o úroveň níže podle prvních dvou znaků (resp. podle druhého a třetího). No a celá ta sranda se chová tak, že při načtení stránky vyřeší ty dotazy, které je potřeba vyřešit a při dalším načtení již nic nedělá, pouze je přečte z cache. Při průchodu stránkou pouze dochází k řešení dalších - ještě nevyřešených odkazů. Pak to se postupně vyřeší všechny a už se na to nikdy nebude sahat (není to moc žádoucí).

Pár důležitých poznámek
=======================
Vzhledem k tomu, že v tomto konkrétním případě chci používat pouze tuto routu, tak je možné všechny ostatní úplně vyhodit pryč. Fakticky stačí z rozšíření vyhodit definici původní nativní routy:

```php
$containerBuilder->removeDefinition('routing.router');
```

Udělal jsem to teď, takže to ještě nemám pořádně vyzkoušené a doufám, že jsem tím nic nerozbil. Ale neměl bych. Po zaregistrování této vlastní routy v configu vše začne krásně fungovat. Stačí, že implementuje IRouter a tato implementace je jediná v celém projektu (což je po této úpravě pravda).

No a na závěr ještě úvaha, kterou jsem sice ještě neimplementoval, ale asi bych to tak rád udělal. Jedná se o jazykové mutace. Jednak je mohu ovlivňovat přidáním nějakého `/en/` do cesty (což se tento router jednoduše naučí), ale pak může přijít složitější požadavek. Máme dvě domény směřující na jednu aplikaci a každá doména představuje jinou jazykovou mutaci. To je docela naprd, ale vzhledem k tomu, že do `match` metody v argumentu vstupuje HTTP request, mohu tuto jazykovou mutaci nastavit pouze na základě adresy zase velmi jednoduše. Jediná modifikace bude v tom, že začnu v Application requestu posílat i locale proměnnou pro translátor.

Poslední nejdůležitější upozornění
==================================
Možná si již někdo všiml, že jsem změnil doménu. Nová doména je `zlml.cz`. Vzhledem k tomu, že původní byla pouze dočasná (i když na několik let) a nepodařilo se mi získat tu co jsem moc chtěl, zvolil jsem tuto. Jak si jí snadno zapamatovat? Je to jednoduché. Prostě moje příjmení bez samohlásek. Původní doména je přesměrována 1:1 a ještě ji budu docela dlouhou dobu držet. Ale až uvidím, že to nemá takový smysl, tak bych jí třeba za pár let zrušil. Pokud tedy chcete mít jistotu, že se k vám vždy nové články dostanou, změňte si prosím ve svých RSS čtečkách adresu na [http://zlml.cz/rss](rss).