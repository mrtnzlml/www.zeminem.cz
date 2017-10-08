---
id: fc390f36-af8a-43af-a34c-619f305e288c
timestamp: 1414243893000
title: Heatmapy ve Wolfram Mathematica
slug: heatmapy-ve-wolfram-mathematica
---
![](https://zlmlcz-media.s3-eu-west-1.amazonaws.com/1bb55605-d567-4fe0-b1d1-69e921940e0d/heatmap1.png)

Právě teď jsem řešil jak vizualizovat nějaká data, která jsou v maticovém formátu. Pro mé účely jsou prakticky dva grafy. Prvním grafem je heatmapa (viz obrázek) a druhým klasický 3D graf, který data reprezentuje stejně dobře (možná lépe), ale v určitých případech je špatně čitelný. Zejména pak když není možnost s grafem otáčet. V mém případě bylo zapotřebí poměrně velké množství grafů, které jsem nakonec minimalizoval na počet 40, takže bylo nemožné je vykreslovat ručně. Zvlášť pokud jsem zajistit, že budou všechny grafy stejné.

K tomu jak jsem postupoval se dostanu v další části. Teď však ještě pár úvodních slov k tomu, co jsem to vlastně měřil. Cílem měření bylo změřit s využitím jasoměrů hodnoty jasů *L [cd/m^2]* určitých objektů a jejich okolí v pravidelné síti kontrolních bodů při různém osvětlení (denní, sdružené a umělé) a různé vzdálenosti a úhlu. Z těchto jasů je zapotřebí spočítat kontrast *C [-]* a tuto kontrastní mapu také vizualizovat. Je tedy zřejmé, že stačí změřit pár objektů a počet grafů rychle roste.

# Vizualizace dat

![](https://zlmlcz-media.s3-eu-west-1.amazonaws.com/40a97326-5410-4385-821c-62dc8542387a/3d2.png)
Tato část se sice jmenuje vizualizace dat, ale aby bylo co vizualizovat, je zapotřebí data připravit. Já jsem zvolil JSON formát vstupu, protože se velmi jednoduše parsuje a matici v něm mohu zapsat také jednoduše. Z měření jednoho objektu mi tedy stačí data v tomto formátu:

```javascript
{
	"Tabule - umělé osvětlení": {
		"up": "STROP",
		"down": "PODLAHA",
		"left": "OKNA",
		"right": "DVEŘE",
		"values": [
			[121.3, 146, 74.2, 39.5, 27.6, 53.9, 66.7],
			[96.5, 86.1, 80.2, 54.8, 47.3, 65.8, 79.5],
			[82.6, 78, 71.8, 65.3, 58.7, 62.3, 79.5],
			[63.8, 71.5, 66.7, 63, 59.4, 63.2, 77.5],
			[62.4, 61, 63.9, 62.4, 62.7, 63.4, 70.5]
		]
	}
}
```

Takových dat je již možné se chytit a vykreslit celou řadu průběhů. Samotný parser se však postupem času poměrně zkomplikoval. Prohlédnout si ho však můžete [na GitHub Gistu](https://gist.github.com/mrtnzlml/9ec02541555e419a8df9#file-parser7-php) a to včetně kompletního vstupu a výsledného výstupu pro Wolfram Mathematica. Tento výstup je v zásadě jednoduchý. Například graf, který je v úvodu vykreslíme pomocí následujícího výstřižku:

```php
Show[MatrixPlot[{
	{-0.063, -0.753, -0.706, -0.788, -0.443, 0.311, 0.327},
	{0.619, 0.613, 0.671, -0.013, -0.162, 0.295, 0.344},
	{0.297, 0.441, 0.351, 0.178, 0.087, 0.166, 0.339},
	{-0.085, 0.27, 0.225, 0.155, 0.118, 0.163, 0.317},
	{-0.033, 0.017, -0.015, 0.03, 0.019, 0.077, 0.198}
}, PlotTheme -> "Detailed", Mesh -> Automatic, MeshStyle -> Directive[GrayLevel[0], Opacity[0.5], Dashing[{0, Small}]]],
FrameLabel -> {{HoldForm[OKNA], HoldForm[DVEŘE]}, {HoldForm[PODLAHA], HoldForm[STROP]}},
PlotLabel -> RawBoxes["Tabule - umělé osvětlení, zezadu (kontrast, Lp = 59.7)"], LabelStyle -> {GrayLevel[0]}]
```

![](https://zlmlcz-media.s3-eu-west-1.amazonaws.com/79b1a8e3-1efc-42b0-bb79-3409b9acd49d/3d.png)

Kromě nastavování popisek a záhlaví, tak je důležitý hlavně blok kde jsou data. V tomto grafu není žádná zrada. Malá zrada číhá až v 3D grafech. Zde je háček v tom, že občas relativně malá plocha grafu ustřelí mimo průměrnou hodnotu všech bodů a na grafu dojde k oříznutí. Aby se tomuto efektu předešlo, je bezpodmínečně nutné nastavit grafu `PlotRange -> All`. Tím se vykreslí celý graf nezávisle na tom, jaké obsahuje extrémní hodnoty. Je však otázka jestli je to žádoucí. V mém případě ano, ale umím si přestavit případy, kdy by velká špička totálně zničila celý graf a bylo by výhodnější spičku oříznout.

```php
ListPlot3D[{
	{62.4, 61, 63.9, 62.4, 62.7, 63.4, 70.5},
	{63.8, 71.5, 66.7, 63, 59.4, 63.2, 77.5},
	{82.6, 78, 71.8, 65.3, 58.7, 62.3, 79.5},
	{96.5, 86.1, 80.2, 54.8, 47.3, 65.8, 79.5},
	{121.3, 146, 74.2, 39.5, 27.6, 53.9, 66.7}
}, ColorFunction -> "DarkRainbow", PlotRange -> All, PlotTheme -> "Business"]
```

Pro vykreslení horního pohledu stačí přidat další atribut `ViewPoint -> Above`, čímž získáme teplotní mapu v trošku jiném zobrazení a díky Business tématu budou na grafu vidět i vrstevnice, což ulehčí představu o tom jak je graf tvarově rozložen. <span style="color:green">Také pozor na to, že do funkcí `MatrixPlot` a `ListPlot3D` se zadávají matice v obráceném pořadí z hlediska řádek matice! Dojde tak ke vykreslení stejných map.</span>