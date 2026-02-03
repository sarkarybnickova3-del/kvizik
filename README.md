# Kvízík – opravená rescue verze

✅ Opraveno tak, aby to **fakt fungovalo**:
- více testů (přepínání nahoře)
- testování:
  - **choice** (výběr z možností) – může mít i **více správných**
  - **text** (otevřená odpověď) – více variant přes `;`
- vyhodnocení:
  - správně = zeleně
  - špatně = červeně + ukáže se správné
- špatné otázky se opakují, dokud nejsou správně
- auto přepnutí na další otázku po odpovědi
- přepínač světlý/tmavý režim

## Nasazení na GitHub Pages
1. Nahraj soubory do rootu repozitáře
2. Settings → Pages → Deploy from a branch → `main` + `/ (root)`
3. Web:
   - Test: `/`
   - Správa: `/admin.html`

## Uložení dat
Data jsou v LocalStorage (na zařízení/prohlížeči).
Pro přenos použij: **Uložit test (JSON)** a na jiném zařízení **Načíst test (JSON)**.
