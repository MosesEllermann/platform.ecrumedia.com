# Lokale Entwicklungsumgebung Setup

## Problem
Nach dem Deployment-Setup für den sPanel-Server mit MySQL kann die lokale Entwicklung nicht mehr funktionieren, da MySQL lokal nicht installiert ist.

## Lösung: Docker für lokale MySQL-Datenbank

### Voraussetzungen
- Docker Desktop muss installiert sein ([Download](https://www.docker.com/products/docker-desktop))

### Setup-Schritte

1. **Docker starten**
   ```bash
   # Docker Desktop öffnen und sicherstellen, dass es läuft
   ```

2. **MySQL Container starten**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   
   Dies startet einen MySQL-Container im Hintergrund mit:
   - Port: 3306
   - Database: ecrumedia_portal
   - User: ecrumedia
   - Password: ecrumedia

3. **Backend-Umgebungsvariablen setzen**
   ```bash
   cd backend
   cp .env.local .env
   ```

4. **Datenbank-Migrationen ausführen**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

5. **Admin-User erstellen** (falls noch nicht vorhanden)
   ```bash
   cd backend
   npm run update-admin
   ```

6. **Backend starten**
   ```bash
   cd backend
   npm run start:dev
   ```

7. **Frontend starten** (in neuem Terminal)
   ```bash
   npm run dev
   ```

### MySQL Container verwalten

**Container stoppen:**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Container stoppen und Daten löschen:**
```bash
docker-compose -f docker-compose.dev.yml down -v
```

**Container-Status prüfen:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

**Container-Logs anzeigen:**
```bash
docker-compose -f docker-compose.dev.yml logs -f mysql
```

### MySQL-Datenbank direkt zugreifen

Mit einem MySQL-Client können Sie sich verbinden:
- Host: localhost
- Port: 3306
- User: ecrumedia
- Password: ecrumedia
- Database: ecrumedia_portal

Oder via Docker:
```bash
docker exec -it ecrumedia_mysql_dev mysql -u ecrumedia -pecrumedia ecrumedia_portal
```

## Alternative: MySQL direkt auf macOS installieren

Falls Sie MySQL lieber direkt installieren möchten:

```bash
# MySQL via Homebrew installieren
brew install mysql

# MySQL starten
brew services start mysql

# Root-Password setzen
mysql_secure_installation

# Datenbank und User erstellen
mysql -u root -p <<EOF
CREATE DATABASE ecrumedia_portal;
CREATE USER 'ecrumedia'@'localhost' IDENTIFIED BY 'ecrumedia';
GRANT ALL PRIVILEGES ON ecrumedia_portal.* TO 'ecrumedia'@'localhost';
FLUSH PRIVILEGES;
EOF
```

## Troubleshooting

### Backend startet nicht
```bash
# Prüfen ob MySQL läuft
docker-compose -f docker-compose.dev.yml ps

# MySQL neu starten
docker-compose -f docker-compose.dev.yml restart mysql
```

### Port 3306 bereits belegt
```bash
# Prüfen welcher Prozess Port 3306 verwendet
lsof -i :3306

# Falls ein anderer MySQL läuft, diesen stoppen
brew services stop mysql
```

### Datenbankverbindung schlägt fehl
```bash
# Verbindung testen
docker exec -it ecrumedia_mysql_dev mysqladmin ping -u ecrumedia -pecrumedia

# Container-Logs prüfen
docker-compose -f docker-compose.dev.yml logs mysql
```

### Migration schlägt fehl
```bash
cd backend

# Prisma Client neu generieren
npm run prisma:generate

# Migration zurücksetzen und neu ausführen
npm run prisma:migrate:reset
```

## Quick Start Script

Für schnellen Start können Sie auch diesen Befehl verwenden:

```bash
# Alles in einem Befehl starten
docker-compose -f docker-compose.dev.yml up -d && \
cd backend && \
npm run prisma:migrate && \
npm run start:dev
```
