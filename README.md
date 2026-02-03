# Quiz App (HTML/CSS/JS)

Jednoduchý test:
- 4 odpovědi A–D
- správně = zelená a můžeš dál
- špatně = červená + zvýrazní se správná, otázka se zařadí na opakování
- špatné otázky se opakují, dokud nejsou správně
- `admin.html` slouží pro tvorbu testu (ukládá se do LocalStorage)

## Spuštění lokálně
Otevři `admin.html` a vytvoř otázky, potom `index.html`.

## GitHub Pages (zobrazení jako web)
1. Na GitHubu vytvoř nový repozitář (Public), např. `quiz-app`.
2. Nahraj do něj soubory z této složky.
3. Otevři **Settings → Pages**.
4. V části **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` a `/ (root)`
5. Uložit. GitHub ti zobrazí URL stránky.

Stránka bude typicky:
`https://TVUJ-UCET.github.io/quiz-app/`

## Poznámky
- Data jsou v prohlížeči (LocalStorage). Každý prohlížeč/zařízení má své vlastní.
- V adminu je export/import JSON pro snadný přenos otázek.
