# Ferienplan Dashboard 🌞 (Supabase Edition)

Moderne Web-App zur Anzeige des Ferienplans auf einem TV mit iPad-Verwaltung - **powered by Supabase**!

## ⚡ Warum Supabase?

- ✅ **Einfacher** - Nur 2 statt 6 Environment Variables
- ✅ **Schneller** - PostgreSQL-Datenbank
- ✅ **Kostenlos** - Großzügiger Free Tier
- ✅ **Realtime** - Automatische Live-Updates
- ✅ **Open Source** - Selbst-hosting möglich

## 🎯 Features

### Display-Ansicht (`/display`)
- Zeigt heutigen + morgigen Tag
- Große, TV-optimierte Schrift
- Moderne Farbverläufe
- **Echtzeit-Updates** via Supabase Realtime
- Bilder für jedes Angebot

### Admin-Panel (`/admin`)
- iPad-optimiert
- Datum auswählen (14 Tage voraus)
- Angebote erstellen/bearbeiten/löschen
- Bilder hochladen zu Supabase Storage
- Sichtbarkeit togglen
- Sofortige Synchronisation mit Display

## 📋 Voraussetzungen

- Node.js (Version 18 oder höher)
- Ein Supabase-Account (kostenlos!)
- Ein GitHub-Account
- Ein Netlify-Account

## 🚀 Quick Start

### 1. Supabase einrichten

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Erstelle Tabelle `angebote` mit folgenden Spalten:
   - `id` (int8, primary key, auto)
   - `created_at` (timestampz, default now())
   - `datum` (date, required)
   - `titel` (text, required)
   - `beschreibung` (text, nullable)
   - `uhrzeit` (text, nullable)
   - `ort` (text, nullable)
   - `betreuer` (text, nullable)
   - `bild_url` (text, nullable)
   - `sichtbar` (bool, default true)
4. Erstelle Storage Bucket `ferienplan-bilder` (public)
5. Aktiviere Realtime für Tabelle `angebote`
6. Kopiere Project URL und anon key

**📖 Detaillierte Anleitung:** Siehe [SUPABASE-ANLEITUNG.md](SUPABASE-ANLEITUNG.md)

### 2. Lokale Installation

```bash
# Dependencies installieren
npm install

# .env erstellen
cp .env.example .env

# .env bearbeiten - Supabase-Daten eintragen
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Entwicklungsserver starten
npm run dev
```

Öffne:
- Admin: `http://localhost:5173/admin`
- Display: `http://localhost:5173/display`

### 3. Auf GitHub hochladen

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DEIN-USERNAME/ferienplan-supabase.git
git push -u origin main
```

### 4. Auf Netlify deployen

1. Verbinde GitHub-Repository mit Netlify
2. **Setze Environment Variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

---

## 📁 Projektstruktur

```
ferienplan-supabase/
├── src/
│   ├── lib/
│   │   ├── supabase.js              # Supabase Client
│   │   └── stores/
│   │       └── ferienplan.js        # Svelte Store + DB-Funktionen
│   ├── routes/
│   │   ├── admin/
│   │   │   └── +page.svelte         # Admin-Panel
│   │   └── display/
│   │       └── +page.svelte         # TV-Display
│   └── app.css
├── package.json
├── svelte.config.js
└── netlify.toml
```

## 🗄️ Datenbank-Schema

### Tabelle: `angebote`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | int8 | Primary Key (auto) |
| created_at | timestampz | Erstellungsdatum |
| datum | date | Datum des Angebots (YYYY-MM-DD) |
| titel | text | Titel des Angebots |
| beschreibung | text | Optionale Beschreibung |
| uhrzeit | text | Uhrzeit (z.B. "14:00") |
| ort | text | Ort des Angebots |
| betreuer | text | Name der Betreuerin |
| bild_url | text | URL zum Bild in Supabase Storage |
| sichtbar | bool | Anzeigen auf Display? |

### Storage Bucket: `ferienplan-bilder`

- Public Bucket
- Speichert alle hochgeladenen Bilder
- Automatische CDN-Distribution

---

## 🔧 Wichtige Funktionen

### `subscribeToFerienplan()`
Lädt Daten und aktiviert Realtime-Updates

### `addAngebot(datum, angebotData)`
Erstellt neues Angebot in der Datenbank

### `updateAngebot(angebotId, updates)`
Aktualisiert bestehendes Angebot

### `deleteAngebot(angebotId, bildUrl)`
Löscht Angebot und zugehöriges Bild

### `uploadBild(file, angebotId)`
Lädt Bild zu Supabase Storage hoch

### `toggleSichtbarkeit(angebotId, currentValue)`
Schaltet Sichtbarkeit um

---

## 🎨 Anpassungen

### Farben ändern

In `src/routes/display/+page.svelte`:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Anzahl Tage ändern

In `src/lib/stores/ferienplan.js`:

```javascript
export function getRelevantDates() {
  const heute = new Date();
  const morgen = new Date(heute);
  morgen.setDate(morgen.getDate() + 1);
  // Füge weitere Tage hinzu...
}
```

---

## 🆘 Troubleshooting

### "relation 'angebote' does not exist"
→ Tabelle in Supabase nochmal erstellen, Name korrekt?

### Keine Daten sichtbar
→ Environment Variables gesetzt? RLS deaktiviert für Tests?

### Bild-Upload schlägt fehl
→ Storage Bucket `ferienplan-bilder` existiert und ist public?

### Realtime funktioniert nicht
→ Replication für Tabelle `angebote` aktiviert?

---

## 📊 Supabase Free Tier Limits

- **Database**: 500 MB
- **Storage**: 1 GB
- **Bandwidth**: 5 GB/Monat
- **API Requests**: Unbegrenzt
- **Realtime Connections**: 200 gleichzeitig

→ Mehr als ausreichend für Schulen!

---

## 🔐 Sicherheit

**Aktuell:** Tabelle ist öffentlich (RLS deaktiviert)

**Für Produktion empfohlen:**
1. Row Level Security (RLS) aktivieren
2. Policies für Read/Write erstellen
3. Optional: Authentication hinzufügen

Siehe Supabase-Dokumentation für Details.

---

## 📝 Nächste Schritte

- [ ] Custom Domain einrichten
- [ ] RLS aktivieren für Sicherheit
- [ ] Backup-Strategie festlegen
- [ ] Weitere Features: Anmeldungen, Teilnehmerlisten, PDF-Export

---

## 💡 Tipps

- **Backup**: Regelmäßig SQL-Dumps von Supabase erstellen
- **Monitoring**: Supabase Dashboard zeigt alle Metrics
- **Performance**: PostgreSQL ist sehr schnell, keine Probleme bei vielen Einträgen
- **Migration**: Von Firebase zu Supabase migrieren ist einfach möglich

---

## 📚 Links

- [Supabase Dokumentation](https://supabase.com/docs)
- [SvelteKit Dokumentation](https://kit.svelte.dev/docs)
- [Netlify Dokumentation](https://docs.netlify.com/)

---

## 📄 Lizenz

Dieses Projekt ist für den internen Gebrauch erstellt.

---

**Viel Erfolg mit deinem Ferienplan-Dashboard!** 🎉

Bei Fragen: Siehe [SUPABASE-ANLEITUNG.md](SUPABASE-ANLEITUNG.md) für detaillierte Schritt-für-Schritt-Anweisungen.
