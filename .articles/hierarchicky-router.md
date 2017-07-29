Tento článek volně navazuje na [předchozí](dynamicke-routovani-url-adres). Zde jsem ukázal, jak vytvořit routy tak, aby bylo možné mít zcela libovolnou adresu a routovat ji na jakoukoliv akci v aplikaci. Dnes to trošku vylepšíme. Přidáme totiž další dva požadavky s tím, že první je ten důležitější:

1. Když se změní adresa (například článku), musí se stará přesměrovat na novou. To se může dít opakovaně a nechceme mít mnohonásobný redirect. Redirect může být maximálně jeden a to pro jakoukoliv starou (i původní) adresu.
2. Bude možné vytvořit jakoukoliv adresu, která bude přesměrovávat na jakoukoliv jinou.

Druhý požadavek je vlastně jen speciální (zjednodušený) případ toho prvního. Co to znamená? Podívejte se na následující ASCII art. Obsahuje pět obrázků znázorňujících postupné změny přesměrování při přidávání dalších přesměrování. Nebudeme již řešit routování na akce v presenterech, ale práci se samotným URL a jak se bude chovat, když se přesměruje aktuální cílové URL jinam.

```
URL-1


URL-1 ----> URL-2


URL-1 -------.
             v
URL-2 ----> URL-3


URL-1 -------.
             v
URL-2 ----> URL-4 <---- URL-3


URL-1 -------.
             v
URL-2 ----> URL-5 <---- URL-3
             ^
             '----------URL-4
```

Slovy řečeno, nesmí se **nikdy** stát, aby byla cesta od staré adresy k nové delší, než je jeden skok. Je zřejmé, že původně byla pouze URL-1. Ta byla přesměrována na URL-2. V okamžik, kdy se přesměruje URL-2 na URL-3, původní propojení mezi URL-1 a URL-2 se musí úplně zrušit a naměrovat URL-1 až na URL-3. A tak to pokračuje dále. Z toho je zřejmé, že nazývat tento router hierarchickým je poněkud zavádějící, protože ve skutečnosti se udržuje takový obrácený les. S troškou režie na začátku je to však vhodnější, protože se tím hezky mění průběžně struktura redirectů a je to lepší, než například takto, to je asi všem jasné:

```
URL-1
 '--> URL-2
       '--> URL-3
             '--> URL-4
                   '--> URL-5
```

Přepočet odkazů
===============
V tom to vlastně celé vězí. Je nutné při vytváření redirectu najít všechny staré odkazy a změnit je na nové. Vrátíme se však k předchozímu článku a trošku vylepšíme cache. Tedy cache zůstane stejná, ale vylepšíme její invalidaci následovně:

```php
$destination = $this->cache->load($path, function (& $dependencies) use ($path) {
    $destination = $this->em->getRepository(Url::class)->findOneBy(['fakePath' => $path]);
    if ($destination === NULL) {
        $this->monolog->addError(sprintf('Cannot find route for path %s', $path));
        return NULL;
    }
    $dependencies = [Nette\Caching\Cache::TAGS => ['route/' . $destination->getId()]];
    return $destination;
});
```

Přidáme ke každému uložení cache tzv. tag, díky čemuž bude možné později tuto cache snadno najít a zrušit její platnost. V closure je nutné dělat to takto přes dependencies proměnnou. Jsou samozřejmě i jiné možnosti [jak cache zneplatnit](http://doc.nette.org/cs/2.3/caching#toc-expirace-a-invalidace), ale tento způsob považuji za dostatečný. Hodí se to proto, že až budeme upravovat staré odkazy, tak je (a pouze je) smažeme z cache, čímž zapříčiníme jejich opětovné vytvoření, tentokrát však s jiným přesměrováním.

Do entity URL adresy je třeba přidat další vlastnost - odkaz na sebe.

```php
/**
 * @ORM\ManyToOne(targetEntity="Url", cascade={"persist"})
 * @ORM\JoinColumn(referencedColumnName="id", onDelete="SET NULL")
 * @var Url
 */
protected $redirectTo = NULL;
```

Tento odkaz využijeme v routeru, který v případě existence tohoto odkazu bude pracovat právě s ním. V opačném případě router pracuje normálně viz předchozí článek. To už tu nebudu řešit. Spíše se podíváme na samotnou tvorbu redirectů. Tu mám umístěnou v `@RedirectFacade::createRedirect`. Tato metoda přijímá dvě čísla (ID) a to odkud se přesměrovává a kam se přesměrovává. Bohužel není možné předat si parciální entitu, protože není možné ji naplnit a odeslat do databáze (vlastnost Doctrine). No a předávat celé entity je zbytečné. Proto jen ID. Zjednodušeně vypadá tato metoda takto:

```php
public function createRedirect($from, $to)
{
    $this->em->transactional(function () use ($from, $to) {
        /** @var Url $oldLink */
        foreach ($this->em->getRepository(Url::class)->findBy([
            'redirectTo' => $from
        ]) as $oldLink) {
            $oldLink->setRedirectTo($this->em->getPartialReference(Url::class, $to));
            $this->cache->clean([Nette\Caching\Cache::TAGS => ['route/' . $oldLink->getId()]]);
        }

        /** @var Url $from */
        $from = $this->em->find(Url::class, $from);
        $from->setRedirectTo($this->em->getPartialReference(Url::class, $to));
        $this->em->flush();
        $this->cache->clean([Nette\Caching\Cache::TAGS => ['route/' . $from->getId()]]);
    });
}
```

Dalo by se to optimalizovat z hlediska databázových dotazů lépe, ale jednak to není (zatím nebylo) potřeba a pak se hodí tahat si jednotlivé záznamy postupně právě kvůli invalidace cache. Jak to funguje? V první části si vytáhnu všechny odkazy, které ukazují na odkaz ze kterého budu přesměrovávat. To jsou ty staré, které je třeba zrušit. Ty jsou nahrazeny odkazy na nové stránky a jejich cache je samozřejmě smazána. To je ta důležitější část. V druhé polovině dojde jen k uložení nového přesměrování a opět smazání cache pro tento odkaz. Za povšimnutí stojí funkce `getPartialReference` o které jsem psal už minule. Je to funkce, která nevrací celou entitu, ale pouze nenaplněnou entitu s ID (parciální). Nic víc totiž dost často není potřeba...

Druhá část řešení
=================
Druhá část řešení je již jednoduchá.

> Bude možné vytvořit jakoukoliv adresu, která bude přesměrovávat na jakoukoliv jinou.

Stačí entitě povolit, aby mohlo být NULL `destination` (tedy interní odkaz na presenter a akci) a `internalId`. To jsou totiž informace, které nejsou známé a pro tetno účel jsou i zbytečné. Důležitá je totiž jen cesta a odkaz na cílovou URL. A to je vlastně vše, protože vše ostatní už přirozeně umí dříve napsaný router.

Ještě jsem nedávno narazil na zajímavý router, který umožňoval smazat jakoukoliv část cesty a on si jí domyslel a přesměroval. Nekoukal jsem úplně do střev, ale asi tak, že vyhledá přesně znění cesty a když ji nemůže najít, tak položí nějaký LIKE% dotaz ve snaze alespoň ji odhadnout. To už ale považuji za zbytečné a nevyužitelné. Osobně se mi ještě více líbí routy, které jsou na ČSFD. Obsahují totiž přirozený zkracovač adres viz tyto dvě adresy, které jsou stejné:

```
http://www.csfd.cz/film/5911
http://www.csfd.cz/film/5911-tenkrat-na-zapade/
```

Vyzkoušejte [si](http://www.csfd.cz/film/5911) [to](http://www.csfd.cz/film/5911-tenkrat-na-zapade/). První přesměruje na druhou. Bohužel ne všem se čísla v adresách líbí (i když podle mého názoru bezdpůvodně).

Ačkoliv budu na routeru dále pracovat, tak k němu zatím nemám v plánu další komentáře. Pokud tedy něco není jasné, teď je ta správná chvíle zeptat se. Jo mimochodem. Předchozí router už není obyčejnou implementací `\Nette\Application\IRouter`, ale dědí od `\Nette\Application\Routers\RouteList`. Je to z toho důvodu, že se bez toho Kdyby\Console [nerozjede](https://github.com/Kdyby/Console/blob/master/src/Kdyby/Console/CliRouter.php#L124). Pokud bych tedy nepoužíval tuto knihovnu, tak by to nebyl problém. Samotná quick'n'dirty úprava spočívá v přidání tohoto kódu na začátek match metody:

```php
/** @var Application\IRouter $route */
foreach ($this as $route) {
    /** @var Application\Request $applicationRequest */
    $applicationRequest = $route->match($httpRequest);
    if ($applicationRequest !== NULL) {
        return $applicationRequest;
    }
}
```

A to je vše...