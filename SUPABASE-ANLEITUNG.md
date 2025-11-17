# 🚀 SUPER-DETAILLIERTE SUPABASE ANLEITUNG

## Komplette Einrichtung von A bis Z mit Supabase

Diese Anleitung führt dich durch JEDEN EINZELNEN KLICK!

---

# 📋 TEIL 0: VORBEREITUNG (5 Minuten)

## Schritt 0.1: Software installieren

### Node.js installieren

1. Öffne deinen Browser
2. Gehe zu: `https://nodejs.org/`
3. Klicke auf den **linken Button** (LTS Version - z.B. "20.10.0 LTS")
4. Installiere die heruntergeladene Datei
5. Folge dem Installationsassistenten (immer "Next" klicken)

### Node.js testen

1. **Terminal/CMD öffnen:**
   - Windows: `Windows + R` → `cmd` → Enter
   - Mac: `CMD + Leertaste` → `terminal` → Enter

2. Tippe:
   ```bash
   node --version
   ```
3. Du solltest eine Versionsnummer sehen (z.B. v20.10.0)

### Git installieren

1. Gehe zu: `https://git-scm.com/downloads`
2. Downloade und installiere Git
3. **Neues Terminal öffnen**
4. Teste:
   ```bash
   git --version
   ```

### Projekt entpacken

1. Downloade `ferienplan-supabase.zip`
2. Entpacke den Ordner
3. Verschiebe ihn an einen guten Ort (z.B. `C:\Projekte\` oder `~/Projekte/`)

✅ **Vorbereitung abgeschlossen!**

---

# 🎯 TEIL 1: SUPABASE EINRICHTEN (15 Minuten)

## Schritt 1.1: Supabase-Konto erstellen

1. Öffne Browser
2. Gehe zu: `https://supabase.com`
3. Klicke **"Start your project"** (oben rechts)

4. **Anmeldung:**
   - Klicke **"Sign in with GitHub"** (empfohlen!)
   - Oder: "Sign in with Google"
   - Oder: Email/Passwort

5. **GitHub Autorisierung** (falls GitHub gewählt):
   - Popup öffnet sich
   - Klicke **"Authorize Supabase"**
   - Eventuell GitHub-Passwort eingeben

6. **Willkommen bei Supabase!**
   - Du siehst das Dashboard

✅ **Supabase-Konto ist erstellt!**

---

## Schritt 1.2: Neues Projekt erstellen

1. Du bist im Supabase-Dashboard
2. Klicke **"New Project"** (grüner Button)

3. **Projekt-Formular:**
   
   **Organization:**
   - Falls noch keine: Klicke "New organization"
   - Name: `Meine Schule` (oder ähnlich)
   - Klicke "Create organization"
   
   **Project Name:**
   - Tippe: `ferienplan-dashboard`
   
   **Database Password:**
   - Klicke **"Generate a password"** (Button mit Symbol)
   - Ein starkes Passwort wird generiert
   - **WICHTIG**: Klicke auf das **Kopier-Symbol** neben dem Passwort
   - Öffne einen **Texteditor** (Notepad/TextEdit)
   - Füge das Passwort ein
   - Speichere die Datei als `supabase-passwort.txt` auf dem Desktop
   - **Du brauchst dieses Passwort später nicht mehr direkt, aber bewahre es sicher auf!**
   
   **Region:**
   - Dropdown öffnen
   - Wähle: `Europe (Frankfurt) eu-central-1` oder `Europe West (Ireland) eu-west-1`
   
   **Pricing Plan:**
   - Lasse **"Free"** ausgewählt (ist kostenlos!)

4. Klicke **"Create new project"**

5. **Warte 1-2 Minuten**
   - "Setting up project..."
   - Ein Ladebalken erscheint

6. **Projekt ist fertig!**
   - Du siehst das Projekt-Dashboard

✅ **Supabase-Projekt ist erstellt!**

---

## Schritt 1.3: Projekt-URL und API-Keys finden

1. Im Projekt-Dashboard
2. **Linke Sidebar** → Klicke auf **⚙️ Project Settings** (ganz unten)
3. Im Settings-Menü → Klicke **"API"**

4. **Du siehst jetzt wichtige Informationen:**
   
   **Project URL:**
   ```
   https://abcdefghijklmnop.supabase.co
   ```
   
   **API Keys:**
   - `anon` `public` (das ist der öffentliche Key)
   - `service_role` (NICHT verwenden!)

5. **Diese Daten jetzt kopieren:**
   
   Öffne **Texteditor** (Notepad/TextEdit)
   
   Kopiere:
   ```
   Project URL: https://abcdefghijklmnop.supabase.co
   anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
   ```
   
   Speichere als `supabase-config.txt` auf dem Desktop

✅ **API-Keys sind gespeichert!**

---

## Schritt 1.4: Datenbank-Tabelle erstellen

1. **Linke Sidebar** → Klicke auf **"Table Editor"** (Tabellen-Symbol)
2. Klicke **"Create a new table"** oder **"New table"** (grüner Button)

3. **Tabelle konfigurieren:**
   
   **Name:**
   ```
   angebote
   ```
   
   **Description (optional):**
   ```
   Ferienangebote mit allen Details
   ```
   
   **Enable Row Level Security (RLS):**
   - ❌ **AUS** (nicht ankreuzen für jetzt - vereinfacht das Setup)
   - (Später kannst du das aktivieren für mehr Sicherheit)

4. **Spalten definieren:**

   Die Tabelle hat schon 2 Spalten:
   - `id` (int8, primary key) ✅ BEHALTEN
   - `created_at` (timestampz) ✅ BEHALTEN

   **Jetzt weitere Spalten hinzufügen:**

   Klicke **"Add column"** / **"+ New column"** für jede dieser Spalten:

   **Spalte 1:**
   - Name: `datum`
   - Type: `date`
   - Default value: (leer)
   - ✅ Primary: NEIN
   - ✅ Nullable: NEIN
   - Click "Save"

   **Spalte 2:**
   - Name: `titel`
   - Type: `text`
   - Default value: (leer)
   - Primary: NEIN
   - ✅ Nullable: NEIN
   - Click "Save"

   **Spalte 3:**
   - Name: `beschreibung`
   - Type: `text`
   - Default value: (leer)
   - Primary: NEIN
   - ✅ Nullable: JA (kann leer sein)
   - Click "Save"

   **Spalte 4:**
   - Name: `uhrzeit`
   - Type: `text`
   - Default value: (leer)
   - Primary: NEIN
   - ✅ Nullable: JA
   - Click "Save"

   **Spalte 5:**
   - Name: `ort`
   - Type: `text`
   - Default value: (leer)
   - Primary: NEIN
   - ✅ Nullable: JA
   - Click "Save"

   **Spalte 6:**
   - Name: `betreuer`
   - Type: `text`
   - Default value: (leer)
   - Primary: NEIN
   - ✅ Nullable: JA
   - Click "Save"

   **Spalte 7:**
   - Name: `bild_url`
   - Type: `text`
   - Default value: (leer)
   - Primary: NEIN
   - ✅ Nullable: JA
   - Click "Save"

   **Spalte 8:**
   - Name: `sichtbar`
   - Type: `bool`
   - Default value: `true`
   - Primary: NEIN
   - ✅ Nullable: NEIN
   - Click "Save"

5. **Überprüfung:**
   - Du solltest jetzt 10 Spalten haben:
     - id
     - created_at
     - datum
     - titel
     - beschreibung
     - uhrzeit
     - ort
     - betreuer
     - bild_url
     - sichtbar

6. Klicke **"Save"** (unten rechts, grüner Button)

7. **Warte ein paar Sekunden**
   - Tabelle wird erstellt
   - Du siehst dann die leere Tabelle

✅ **Datenbank-Tabelle ist erstellt!**

---

## Schritt 1.5: Storage Bucket erstellen

1. **Linke Sidebar** → Klicke auf **"Storage"** (Ordner-Symbol)
2. Klicke **"New bucket"** oder **"Create a new bucket"**

3. **Bucket konfigurieren:**
   
   **Name:**
   ```
   ferienplan-bilder
   ```
   
   **Public bucket:**
   - ✅ **JA** ankreuzen (damit Bilder öffentlich sichtbar sind)
   
   **File size limit:**
   - Lasse Standard (z.B. 50 MB ist OK)
   
   **Allowed MIME types:**
   - Lasse leer (erlaubt alle Dateitypen)

4. Klicke **"Create bucket"**

5. **Bucket ist erstellt!**
   - Du siehst jetzt `ferienplan-bilder` in der Liste

✅ **Storage ist eingerichtet!**

---

## Schritt 1.5.1: Storage Policies einrichten (WICHTIG!)

**Das ist wichtig, damit Bild-Upload funktioniert!**

1. **Im Storage-Bereich bleiben** (solltest du noch sein)
2. Klicke auf den Bucket **"ferienplan-bilder"**
3. **Oben im Menü** → Klicke auf **"Policies"** Tab
4. Du siehst: "No policies created yet"

### Policy 1: Upload erlauben

1. Klicke **"New Policy"**
2. Wähle Template: **"Allow public uploads"** oder **"Custom policy"**

3. **Wenn "Custom policy":**

   **Policy Name:**
   ```
   Public Upload
   ```

   **Allowed operation:**
   - ✅ INSERT

   **Target roles:**
   - `public` oder `anon`

   **Policy definition (WITH CHECK):**
   ```sql
   true
   ```

4. Klicke **"Review"** dann **"Save policy"**

### Policy 2: Download/Lesen erlauben

1. Klicke wieder **"New Policy"**
2. Wähle Template: **"Allow public access to files"** oder **"Custom policy"**

3. **Wenn "Custom policy":**

   **Policy Name:**
   ```
   Public Read
   ```

   **Allowed operation:**
   - ✅ SELECT

   **Target roles:**
   - `public` oder `anon`

   **Policy definition (USING expression):**
   ```sql
   true
   ```

4. Klicke **"Review"** dann **"Save policy"**

### Policy 3: Löschen erlauben (optional)

1. Klicke wieder **"New Policy"**

   **Policy Name:**
   ```
   Public Delete
   ```

   **Allowed operation:**
   - ✅ DELETE

   **Target roles:**
   - `public` oder `anon`

   **Policy definition:**
   ```sql
   true
   ```

4. Klicke **"Review"** dann **"Save policy"**

### Überprüfung:

Du solltest jetzt **3 Policies** sehen:
- ✅ Public Upload (INSERT)
- ✅ Public Read (SELECT)
- ✅ Public Delete (DELETE)

✅ **Storage Policies sind eingerichtet - Bild-Upload funktioniert jetzt!**

---

## Schritt 1.6: Realtime aktivieren (für Live-Updates)

1. **Linke Sidebar** → Klicke auf **"Database"**
2. Im Untermenü → Klicke **"Replication"**

3. Du siehst eine Liste der Tabellen

4. **Finde `angebote` in der Liste:**
   - Eventuell musst du scrollen
   - Oder nutze die Suche

5. **Neben `angebote`:**
   - Siehst du einen **Toggle-Switch**
   - Klicke darauf, damit er **GRÜN** wird
   - Text: "Replication enabled"

6. **Popup erscheint eventuell:**
   - "Enable Realtime for this table?"
   - Klicke **"Enable"**

✅ **Realtime ist aktiviert!**

---

# 💻 TEIL 2: LOKALES PROJEKT EINRICHTEN (10 Minuten)

## Schritt 2.1: Terminal im Projekt öffnen

### Windows:
1. Öffne Datei-Explorer
2. Navigiere zu: `C:\Projekte\ferienplan-supabase`
3. Oben in die Adressleiste klicken
4. Tippe: `cmd`
5. Enter
6. Terminal öffnet sich im Projekt-Ordner

### Mac:
1. Öffne Finder
2. Navigiere zum Projekt-Ordner
3. Rechtsklick auf Ordner
4. "Terminal im Ordner öffnen"

---

## Schritt 2.2: Dependencies installieren

1. Im Terminal (im Projekt-Ordner), tippe:
   ```bash
   npm install
   ```

2. Enter drücken

3. **Warte 1-3 Minuten**
   - Viel Text scrollt vorbei
   - "added X packages..."

4. **Wenn fertig:**
   - Cursor blinkt wieder
   - Neuer Ordner `node_modules` ist erstellt

✅ **Dependencies installiert!**

---

## Schritt 2.3: .env Datei erstellen

### Im Terminal:

```bash
cp .env.example .env
```

(Windows CMD: `copy .env.example .env`)

---

## Schritt 2.4: .env Datei bearbeiten

1. Öffne `.env` mit Texteditor (Notepad/TextEdit/VS Code)

2. Du siehst:
   ```
   VITE_SUPABASE_URL=your-supabase-url-here
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

3. **Öffne deine `supabase-config.txt`** vom Desktop

4. **Ersetze die Werte:**
   ```
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
   ```

5. **Speichern:** STRG+S (Windows) oder CMD+S (Mac)

6. **WICHTIG:** 
   - Keine Anführungszeichen `"` um die Werte!
   - Keine Leerzeichen!

✅ **Supabase-Config ist eingetragen!**

---

## Schritt 2.5: Entwicklungsserver starten

1. Im Terminal, tippe:
   ```bash
   npm run dev
   ```

2. Enter

3. **Du siehst:**
   ```
   VITE v5.0.0  ready in 234 ms
   ➜  Local:   http://localhost:5173/
   ```

4. **Server läuft!**

✅ **Entwicklungsserver läuft!**

---

## Schritt 2.6: Im Browser testen

1. Öffne Browser
2. Gehe zu: `http://localhost:5173/admin`
3. Siehst du das Admin-Panel? ✅
4. Gehe zu: `http://localhost:5173/display`
5. Siehst du die Display-Ansicht? ✅

### Ersten Test-Eintrag erstellen:

1. Im Admin (`/admin`):
   - Klicke **"+ Angebot hinzufügen"**
   - Titel: `Test-Angebot`
   - Beschreibung: `Das ist ein Test`
   - Uhrzeit: `14:00`
   - Ort: `Raum 1`
   - Betreuer: `Dein Name`
   - Klicke **"Speichern"**

2. **Prüfe in Supabase:**
   - Supabase Dashboard öffnen
   - Table Editor → `angebote`
   - Dein Eintrag sollte da sein!

3. **Prüfe Display:**
   - Wechsle zu `/display` Tab
   - Angebot sollte erscheinen!

✅ **Lokales Projekt funktioniert!**

---

# 🐙 TEIL 3: AUF GITHUB HOCHLADEN (10 Minuten)

## Schritt 3.1: GitHub-Konto erstellen

**Falls du schon ein GitHub-Konto hast → Schritt 3.2**

1. Gehe zu: `https://github.com`
2. Klicke **"Sign up"**
3. Email, Passwort, Username eingeben
4. Email bestätigen

✅ **GitHub-Konto erstellt!**

---

## Schritt 3.2: Neues Repository erstellen

1. Auf GitHub angemeldet
2. Klicke **"+" Symbol** (oben rechts)
3. Klicke **"New repository"**

4. **Formular:**
   - Repository name: `ferienplan-supabase`
   - Description: `Ferienplan Dashboard mit Supabase`
   - **Private** oder Public (egal)
   - ❌ KEINE README, .gitignore oder License hinzufügen!

5. Klicke **"Create repository"**

✅ **Repository erstellt!**

---

## Schritt 3.3: Git konfigurieren

**Nur beim ersten Mal:**

```bash
git config --global user.name "Dein Name"
git config --global user.email "deine@email.de"
```

---

## Schritt 3.4: Code hochladen

1. Terminal im Projekt-Ordner

2. **Git initialisieren:**
   ```bash
   git init
   ```

3. **Dateien hinzufügen:**
   ```bash
   git add .
   ```

4. **Commit:**
   ```bash
   git commit -m "Initial commit: Ferienplan mit Supabase"
   ```

5. **Branch umbenennen:**
   ```bash
   git branch -M main
   ```

6. **Remote verbinden:**
   ```bash
   git remote add origin https://github.com/DEIN-USERNAME/ferienplan-supabase.git
   ```
   (Ersetze DEIN-USERNAME!)

7. **Hochladen:**
   ```bash
   git push -u origin main
   ```

8. **Authentifizierung:**
   - Browser öffnet sich eventuell
   - Oder: Username/Token eingeben

✅ **Code ist auf GitHub!**

---

# 🚀 TEIL 4: AUF NETLIFY DEPLOYEN (10 Minuten)

## Schritt 4.1: Netlify-Konto erstellen

1. Gehe zu: `https://www.netlify.com`
2. Klicke **"Sign up"**
3. Wähle **"GitHub"**
4. Autorisiere Netlify

✅ **Netlify-Konto erstellt!**

---

## Schritt 4.2: Neue Site erstellen

1. Netlify-Dashboard
2. Klicke **"Add new site"**
3. Klicke **"Import an existing project"**
4. Wähle **"Deploy with GitHub"**
5. Wähle Repository: `ferienplan-supabase`

---

## Schritt 4.3: Build-Einstellungen

Sollte automatisch erkannt werden:
- Build command: `npm run build`
- Publish directory: `build`

**NOCH NICHT auf Deploy klicken!**

---

## Schritt 4.4: Environment Variables setzen

**WICHTIG - Scrolle zu "Environment variables"**

Füge hinzu (2 Variablen):

**Variable 1:**
```
Key: VITE_SUPABASE_URL
Value: https://abcdefghijklmnop.supabase.co
```

**Variable 2:**
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Kopiere aus deiner `.env` Datei!)

✅ **Environment Variables gesetzt!**

---

## Schritt 4.5: Deployen!

1. Scrolle runter
2. Klicke **"Deploy ferienplan-supabase"**
3. **Warte 1-2 Minuten**
4. **"Site is live!"** 🎉

---

## Schritt 4.6: Testen

1. Klicke auf deine URL (z.B. `https://amazing-site-12345.netlify.app`)
2. Gehe zu `/admin`
3. Gehe zu `/display`
4. Erstelle ein Test-Angebot!

✅ **ALLES FERTIG!** 🎉

---

# 🎯 VERWENDUNG

## Admin-Panel (iPad)

URL: `https://deine-url.netlify.app/admin`

- Datum auswählen
- "+ Angebot hinzufügen"
- Formular ausfüllen
- Bild hochladen (optional)
- "Speichern"

## Display (TV)

URL: `https://deine-url.netlify.app/display`

- Zeigt Heute + Morgen
- Auto-Update bei Änderungen
- F11 für Vollbild

---

# 🔄 ÄNDERUNGEN HOCHLADEN

**Wenn du Code änderst:**

```bash
git add .
git commit -m "Beschreibung"
git push
```

Netlify deployed automatisch!

---

# ✅ CHECKLISTE

**Supabase:**
- [✓] Konto erstellt
- [✓] Projekt erstellt
- [✓] URL & Keys gespeichert
- [✓] Tabelle `angebote` erstellt
- [✓] Storage Bucket erstellt
- [✓] Realtime aktiviert

**Lokal:**
- [✓] Node.js installiert
- [✓] Git installiert
- [✓] npm install
- [✓] .env erstellt
- [✓] npm run dev getestet

**GitHub:**
- [✓] Repository erstellt
- [✓] Code gepusht

**Netlify:**
- [✓] Site erstellt
- [✓] Environment Variables gesetzt
- [✓] Deployed
- [✓] Getestet

---

# 🆘 HÄUFIGE PROBLEME

## Problem: "relation 'angebote' does not exist"
**Lösung:** Tabelle in Supabase nochmal überprüfen, richtig geschrieben?

## Problem: Keine Daten werden angezeigt
**Lösung:** 
1. Supabase Table Editor → Ist die Tabelle leer?
2. RLS aktiviert? → Falls ja, deaktivieren für Tests
3. Environment Variables auf Netlify gesetzt?

## Problem: Bild-Upload schlägt fehl - "new row violates row-level security policy"
**Lösung:**
1. Storage Bucket `ferienplan-bilder` existiert?
2. Ist er "Public"?
3. **WICHTIG: Storage Policies eingerichtet?**
   - Gehe zu: Storage → ferienplan-bilder → Policies Tab
   - Du brauchst mindestens 2 Policies:
     - Public Upload (INSERT) mit `true`
     - Public Read (SELECT) mit `true`
   - Siehe **Schritt 1.5.1** in dieser Anleitung!
4. Datei unter 5 MB?

---

# 💡 VORTEILE VON SUPABASE

✅ **Einfacher als Firebase**
- Nur 2 Environment Variables statt 6
- SQL-Datenbank (PostgreSQL)
- Bessere Performance

✅ **Kostenlos**
- 500 MB Storage
- 50 MB Datenbank
- Unbegrenzte API-Requests

✅ **Realtime**
- Automatische Updates
- WebSocket-Verbindung

✅ **Open Source**
- Selbst-hosting möglich
- Keine Vendor Lock-in

---

**Erstellt mit ❤️ für Daniel**
**Version: Supabase Edition**
