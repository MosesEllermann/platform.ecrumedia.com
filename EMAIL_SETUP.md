# Email-Konfiguration für Rechnungsversand

## Problem: "Rechnung wurde erstellt, aber E-Mail konnte nicht gesendet werden"

Dieser Fehler tritt auf, wenn die SMTP-Konfiguration im Backend nicht korrekt eingerichtet ist.

## Lösung: SMTP-Credentials konfigurieren

### Option 1: Gmail verwenden (empfohlen für Tests)

1. **App-Passwort erstellen** (nicht dein normales Gmail-Passwort!)
   - Gehe zu [Google Account Settings](https://myaccount.google.com/)
   - Klicke auf "Sicherheit"
   - Aktiviere "Bestätigung in zwei Schritten" (falls noch nicht aktiviert)
   - Suche nach "App-Passwörter" und erstelle ein neues für "Mail"
   - Kopiere das 16-stellige Passwort

2. **Backend .env Datei konfigurieren**
   
   Öffne `backend/.env` und füge folgende Zeilen hinzu:
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER="deine-email@gmail.com"
   SMTP_PASS="dein-16-stelliges-app-passwort"
   SMTP_FROM="deine-email@gmail.com"
   ```

3. **Backend neu starten**
   ```bash
   cd backend
   npm run start:dev
   ```

### Option 2: Andere SMTP-Provider

#### Outlook/Office365
```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="deine-email@outlook.com"
SMTP_PASS="dein-passwort"
```

#### Custom SMTP Server
```bash
SMTP_HOST="smtp.dein-provider.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="dein-username"
SMTP_PASS="dein-passwort"
```

## Entwicklungsmodus (ohne SMTP)

Wenn die SMTP-Konfiguration fehlt, läuft das System im Entwicklungsmodus:
- Rechnungen werden erfolgreich erstellt ✅
- Email-Versand wird simuliert (nur in den Backend-Logs sichtbar) ✅
- Status wird trotzdem auf "SENT" gesetzt ✅

**Backend-Logs zeigen:**
```
WARN [EmailService] SMTP credentials not configured. Email sending will be simulated.
LOG [EmailService] Would send email to: kunde@example.com
LOG [EmailService] Subject: Rechnung INV-2025-0001
LOG [EmailService] PDF size: 12345 bytes
```

## Fehlerbehandlung

Das System zeigt jetzt detaillierte Fehlermeldungen:
- ✅ "Rechnung wurde erstellt, aber Email konnte nicht gesendet werden" → SMTP-Problem
- ✅ Rechnung ist trotzdem in der Datenbank gespeichert
- ✅ Du kannst die Email später manuell versenden

## Produktions-Setup

Für die Produktion empfehlen wir:
1. **SendGrid** - Kostenlos bis 100 Emails/Tag
2. **Amazon SES** - Sehr günstig und zuverlässig
3. **Mailgun** - Gut für höhere Volumina

## Wichtige Hinweise

⚠️ **Sicherheit:**
- Niemals echte Passwörter in Git committen
- Verwende immer `.env` für sensitive Daten
- Verwende App-Passwörter statt echten Passwörtern bei Gmail

✅ **Best Practices:**
- Teste zuerst mit deiner eigenen Email-Adresse
- Überprüfe Spam-Ordner wenn Emails nicht ankommen
- Aktiviere "weniger sichere Apps" NICHT - verwende App-Passwörter

## Testing

Um zu testen, ob die SMTP-Konfiguration funktioniert:
1. Erstelle eine Test-Rechnung
2. Gib deine eigene Email-Adresse als Empfänger ein
3. Aktiviere "Kopie an mich senden"
4. Klicke auf "Senden"
5. Prüfe dein Postfach (und Spam-Ordner)
