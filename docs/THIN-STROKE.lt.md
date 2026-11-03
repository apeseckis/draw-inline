# Plonesnis Draw Inline brūkšnys

## Pakeitimai

- `webview-src/src/smallStrokeWidth.ts`: `S` bazinis plotis valdomas nustatymu, numatyta `0.5`. Pakeitus plotį atnaujinamas tldraw podėlis nekeičiant figūrų duomenų ar atšaukimo istorijos. Stebimi esamų standartinių klasių renderinimo metodai; papildomos figūrų klasės neregistruojamos, nes tldraw 3.5.1 jas pridėtų prie standartinių ir dubliuotų tipus. Kiti dydžiai lieka `M=3.5`, `L=5`, `XL=10`.
- `webview-src/src/App.tsx`: gauna nustatymą iš VS Code. `S` parenkamas redaktoriaus paleidimo metu ir po kiekvieno SVG momentinės kopijos įkėlimo. Vėliau dydį galima keisti įprastais valdikliais.
- `src/extension.js`: perduoda nustatymą atidarius redaktorių ir pasikeitus VS Code konfigūracijai. Netinkama reikšmė pakeičiama numatytąja `0.5`.
- `webview-src/package.json`: pašalinta Unix komanda `rm -rf`; `vite build --emptyOutDir` išvalo generuojamą `board` aplanką ir veikia Windows.
- `webview-src/local_replace.js`: vietiniai tldraw ištekliai kopijuojami sinchroniškai; jei išteklių nėra arba URL pakeitimas nepavyksta, kūrimas sustabdomas su klaida.
- `package.json`: bendros kūrimo ir pakavimo komandos, šios saugyklos adresai. Plėtinio ID lieka `zhaouv.vscode-markdown-tldraw-inline`, versija `0.1.0`.
- `package-lock.json`: tik du nebegaliojančio sertifikato `registry.npm.taobao.org` adresai pakeisti į `registry.npmjs.org`. Versijos ir vientisumo reikšmės nepakeistos. Frontend užrakinimo failas nepakeistas; tldraw lieka `3.5.1`.
- `scripts/verify-package.ps1`: VSIX turinio, sugeneruoto brūkšnio pakeitimo ir vietinių išteklių vientisumo patikra.

SVG saugojimo formatas, suspausta tldraw momentinė kopija, esamos komandos, klavišų kombinacijos ir ankstesni nustatymai nepakeisti.

## Pločio reikšmė ir seni piešiniai

`0.5` yra tldraw bazinė `S` reikšmė. Laisvo piešimo kodas prideda `1`, todėl esant masteliui `1` bazinis renderinimo plotis yra `1.5`, anksčiau buvo `3`. Galutinis laisvo brūkšnio kontūras taip pat priklauso nuo spaudimo ir piešimo parametrų. Tai nėra visada tiksliai `0.5 px` pločio linija.

Tas pats objektas naudojamas drobėje ir SVG eksporte, todėl pakeitimas patenka į eksportuojamo SVG geometriją. `STROKE_SIZES` yra bendras: plonėja ir kitos `S` dydį naudojančios figūros. Anksčiau sukurtos `S` figūros atidarius redaktoriuje taip pat bus plonesnės. Jau išsaugoto SVG išvaizda išoriniame žiūriklyje pasikeis tik jį pakartotinai eksportavus. Atidarius originaliu plėtiniu momentinę kopiją, `S` vėl bus interpretuojamas originaliu pločiu.

## Kūrimas Windows aplinkoje

Reikalingi Git, Node.js (pakavimui Node 22.12+ arba 24+), npm ir VS Code. Šis variantas sukurtas su Node `26.13.0`, npm `11.20.0`, tldraw `3.5.1`, Vite `4.5.5` ir `@vscode/vsce 4.1.0`.

PowerShell, projekto šaknyje:

```powershell
npm.cmd ci
npm.cmd --prefix webview-src ci
npm.cmd test
npm.cmd run package
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-package.ps1
```

`npm run package` automatiškai sukuria frontend per `vscode:prepublish`. Rezultatas: `vscode-markdown-tldraw-inline-thin-stroke-0.1.0.vsix` šakniniame aplanke. Pakavimo įrankis atsisiunčiamas pagal tikslią versiją, jo nereikia diegti globaliai. Tik frontend sukurti: `npm.cmd run build`.

Vite gali perspėti dėl didesnio nei 500 kB JS failo; tai nesustabdo kūrimo. Pradinio projekto priklausomybės šioje užduotyje neatnaujinamos.

## Diegimas, atnaujinimas ir grįžimas prie originalo

Patikrinus šios aplinkos VS Code plėtinių sąrašą originalus Draw Inline nebuvo aptiktas. Diegimas automatiškai neatliktas.

Prieš pakeičiant jau įdiegtą modifikaciją galima ją pašalinti ir įdiegti originalą iš Marketplace:

```powershell
code --uninstall-extension zhaouv.vscode-markdown-tldraw-inline
code --install-extension zhaouv.vscode-markdown-tldraw-inline
```

Nepašalinkite kitų plėtinių. Jeigu turite ankstesnį VSIX, jį taip pat galima įdiegti vietoje originalo.

Modifikuoto paketo diegimas arba atnaujinimas, projekto aplanke:

```powershell
code --install-extension .\vscode-markdown-tldraw-inline-thin-stroke-0.1.0.vsix --force
```

Alternatyva: VS Code → Extensions → `...` → **Install from VSIX...**, pasirinkite šį failą. Tada komandų paletėje paleiskite **Developer: Reload Window**. Kad Marketplace automatiškai nepakeistų modifikacijos, šiam vienam plėtiniui išjunkite automatinį atnaujinimą per jo meniu. Bendrų VS Code nustatymų keisti nereikia.

ID ir versija sutampa su originalu, todėl vien versijos numeris modifikacijos nepatvirtina. Ją patvirtina žemiau esantis piešimo bandymas.

## Rankinis priėmimo bandymas

1. VS Code atidarykite bandomąjį aplanką ir jame sukurkite bei išsaugokite Markdown failą.
2. Pasirinkę tuščią eilutę komandų paletėje paleiskite **Draw Inline**.
3. Pasirinkite laisvo piešimo įrankį. Pradinis dydis turi būti `S`; nubrėžkite liniją. Palyginkite su `M` linija arba originalaus plėtinio `S`, tuo pačiu masteliu.
4. Drobėje spauskite `F2` arba `Ctrl+S` – SVG turi atsirasti Markdown faile. Išsaugokite ir patį Markdown dokumentą.
5. Uždarykite piešimo skydelį, atsistokite ant SVG eilutės arba regiono pradžios ir vėl paleiskite **Draw Inline**. Piešinys turi išlikti, pradinis dydis turi būti `S`.
6. Papildykite piešinį, išsaugokite ir dar kartą atverkite.
7. Išbandykite `F3` arba `Ctrl+Shift+S`: turi atsirasti išorinis SVG ir Markdown nuoroda į jį. Atverkite piešinį per šią nuorodos eilutę, papildykite ir išsaugokite.
8. Patikrinkite ankstesnį SVG, `M/L/XL`, esamus nustatymus `draw-inline.directory` ir `draw-inline.auto-folding`.

Kūrimas ir paketo turinys tikrinami automatiškai. Šis rankinis VS Code bandymas dar neatliktas; automatinė paketo patikra nepatvirtina visos sąveikos su VS Code ar vaizdinio rezultato.

## Kaip pakeisti plotį per VS Code Settings

Vieną kartą įdiekite atnaujintą VSIX ir vykdykite **Developer: Reload Window**. Tada atverkite Settings (`Ctrl+,`) ir ieškokite `@id:draw-inline.smallStrokeWidth` arba **Draw Inline: Small Stroke Width**. Galite keisti User arba Workspace reikšmę. Numatyta `0.5`; priimami tik teigiami skaičiai.

Taip pat galite įrašyti į `settings.json`:

```json
"draw-inline.smallStrokeWidth": 0.75
```

Pakeitimas taikomas iškart, taip pat jau atidaryto piešinio `S` figūroms ir SVG eksportui. Perkompiliuoti ar perkrauti langą po kiekvieno nustatymo pakeitimo nereikia. Laisvam piešimui tldraw vis dar prideda `1`: reikšmė `0.75` reiškia bazinį `1.75` renderinimo plotį. `2` atkuria originalią `S` bazinę reikšmę.

Patikra: nenutraukę piešinio redagavimo pakeiskite reikšmę iš `0.5` į `2` ir atgal. Patikrinkite jau nupieštą ir naują `S` liniją, išsaugokite SVG, atverkite jį iš naujo ir išbandykite Undo. `M/L/XL` turi likti nepakitę.

`npm.cmd test` tikrina nustatymo perdavimą, pakeitimus, netinkamas reikšmes ir tikrą tldraw geometrijos podėlį. Visa VS Code vaizdinė sąveika lieka rankiniam bandymui.

## GitHub ir generuojami failai

Šaltiniai saugomi `https://github.com/apeseckis/draw-inline`. `board`, `node_modules` ir VSIX yra generuojami failai, todėl pagal projekto `.gitignore` į Git neįtraukiami. VSIX galima atkurti aukščiau pateiktomis komandomis.
