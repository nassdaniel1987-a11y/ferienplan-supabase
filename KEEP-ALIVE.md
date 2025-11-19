# Supabase Keep-Alive System

## Problem
Supabase Free Tier pausiert Projekte nach **7 Tagen Inaktivität**. Um das zu verhindern, muss regelmäßig eine Datenbankabfrage gemacht werden.

## Lösung
Wir nutzen **Netlify Scheduled Functions**, die automatisch alle 6 Stunden eine einfache Query zur Datenbank machen.

## Komponenten

### 1. Automatischer Keep-Alive (alle 6 Stunden)
**Datei:** `netlify/functions/keep-alive.mjs`

- Läuft automatisch alle 6 Stunden (00:00, 06:00, 12:00, 18:00 Uhr)
- Macht eine einfache SELECT-Query zur `angebote` Tabelle
- Verhindert dass Supabase das Projekt pausiert

### 2. Manueller Test-Endpoint
**Datei:** `netlify/functions/ping.mjs`

- Kann jederzeit manuell aufgerufen werden
- URL: `https://deine-app.netlify.app/.netlify/functions/ping`
- Zeigt Antwortzeit und Beispieldaten
- Gut zum Testen der Verbindung

## Aktivierung

### Nach dem Deploy:

1. **Netlify Dashboard öffnen**: https://app.netlify.com
2. **Site auswählen**
3. **Functions → Scheduled** prüfen
4. Die `keep-alive` Funktion sollte dort erscheinen

### Logs überprüfen:

1. **Netlify Dashboard → Functions**
2. **keep-alive** Function auswählen
3. Logs zeigen jeden automatischen Aufruf

## Manueller Test

Teste die Verbindung mit:
```bash
curl https://deine-app.netlify.app/.netlify/functions/ping
```

Erwartete Antwort:
```json
{
  "success": true,
  "message": "Supabase ist erreichbar und aktiv",
  "timestamp": "2025-01-19T...",
  "responseTime": "234ms",
  "recordsFound": 5,
  "sampleData": [...]
}
```

## Alternative: Externe Cron-Services

Falls Netlify Scheduled Functions nicht verfügbar sind (nur auf bestimmten Plänen), kannst du auch externe Services nutzen:

### Option 1: UptimeRobot (kostenlos)
1. Account erstellen: https://uptimerobot.com
2. Neuen Monitor hinzufügen
3. URL: `https://deine-app.netlify.app/.netlify/functions/ping`
4. Intervall: 5 Minuten (kostenlos verfügbar)

### Option 2: Cron-job.org (kostenlos)
1. Account erstellen: https://cron-job.org
2. Neuen Cronjob hinzufügen
3. URL: `https://deine-app.netlify.app/.netlify/functions/ping`
4. Intervall: Alle 6 Stunden

## Monitoring

Du kannst die Funktion überwachen:

1. **Netlify Logs**: Zeigen jeden automatischen Aufruf
2. **Supabase Dashboard**: Zeigt letzte Aktivität des Projekts
3. **Ping-Endpoint**: Manueller Test jederzeit möglich

## Kosten

- **Netlify Scheduled Functions**: Auf Starter/Pro-Plan enthalten
- **Netlify Function Calls**: 125.000 kostenlose Aufrufe/Monat
- Bei 4 Aufrufen/Tag = ~120 Aufrufe/Monat = weit unter Limit

## Troubleshooting

### Funktion wird nicht ausgeführt?

1. Prüfe Netlify Dashboard → Functions
2. Schaue in die Function Logs
3. Teste den `/ping` Endpoint manuell
4. Prüfe ob Umgebungsvariablen gesetzt sind:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

### Supabase trotzdem pausiert?

- Prüfe ob die Funktion wirklich alle 6 Stunden läuft
- Nutze zusätzlich einen externen Cron-Service
- Kontaktiere Supabase Support

## Nächste Schritte

1. ✅ Code ist deployed
2. ⏳ Warte auf nächsten automatischen Aufruf (max. 6 Stunden)
3. ✅ Prüfe Netlify Function Logs
4. ✅ Teste `/ping` Endpoint manuell
