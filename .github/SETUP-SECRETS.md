# GitHub Secrets Setup für Keep-Alive

Um die automatische Keep-Alive Funktion zu aktivieren, müssen folgende Secrets in GitHub hinterlegt werden:

## Benötigte Secrets

### 1. SUPABASE_URL
**Wo finden:**
1. Öffne https://app.supabase.com
2. Wähle dein Projekt aus
3. Settings → API
4. Kopiere die **Project URL**

**Beispiel:** `https://abcdefghijklmnop.supabase.co`

### 2. SUPABASE_ANON_KEY
**Wo finden:**
1. Öffne https://app.supabase.com
2. Wähle dein Projekt aus
3. Settings → API
4. Kopiere den **anon / public** Key

**Beispiel:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. NETLIFY_URL
**Wo finden:**
1. Öffne https://app.netlify.com
2. Wähle deine Site aus
3. Kopiere die URL von "Site overview"

**Beispiel:** `https://deine-app.netlify.app`

## Secrets hinzufügen

1. Öffne dein GitHub Repository
2. Gehe zu **Settings** (oben rechts)
3. In der linken Sidebar: **Secrets and variables → Actions**
4. Klicke auf **New repository secret**
5. Füge jedes Secret einzeln hinzu:
   - Name: `SUPABASE_URL`, Value: [deine URL]
   - Name: `SUPABASE_ANON_KEY`, Value: [dein Key]
   - Name: `NETLIFY_URL`, Value: [deine Netlify URL]

## Workflow testen

Nach dem Hinzufügen der Secrets:

1. Gehe zu **Actions** Tab
2. Wähle **Supabase Keep-Alive** Workflow
3. Klicke auf **Run workflow** → **Run workflow**
4. Warte ca. 10-20 Sekunden
5. Refresh die Seite
6. Der Workflow sollte grün (✅) sein wenn erfolgreich

## Zeitplan

Der Workflow läuft automatisch:
- **00:00 UTC** (01:00 oder 02:00 MEZ, je nach Sommer-/Winterzeit)
- **06:00 UTC** (07:00 oder 08:00 MEZ)
- **12:00 UTC** (13:00 oder 14:00 MEZ)
- **18:00 UTC** (19:00 oder 20:00 MEZ)

Du kannst den Workflow jederzeit manuell triggern mit "Run workflow".
