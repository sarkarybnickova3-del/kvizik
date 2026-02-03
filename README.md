# Kvíz (více testů) — HTML/CSS/JS

✅ Funkce:
- Více testů (např. Čeština / ICT / POS) — přepínání v rozbalovacím menu
- 4 odpovědi A–D
- Správně = zeleně, špatně = červeně + vždy se ukáže správná
- Špatné otázky se opakují, dokud nejsou správně
- Otázky se po odpovědi automaticky přepnou na další
- Přepínač světlý / tmavý režim (ukládá se do prohlížeče)
- Export/Import pro jednotlivý test (Uložit/Načíst)

## Soubory
- `index.html` — testování
- `admin.html` — správa (tvorba více testů + otázky + uložit/načíst)
- `style.css` — styly + theme
- `app.js` — logika testu
- `admin.js` — logika správy

## GitHub Pages
1. Nahraj soubory do rootu repozitáře
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: main, Folder: / (root)
5. Save

Web:
- Test: `.../`
- Správa: `.../admin.html`

## Poznámka
Data jsou v LocalStorage — tedy v daném zařízení/prohlížeči. Pro přenos použij „Uložit test“ (export) a „Načíst test“ (import).
