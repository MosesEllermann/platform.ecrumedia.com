#!/bin/bash

# Local Development Setup Script
# Startet MySQL via Docker und richtet die Entwicklungsumgebung ein

echo "🚀 Starte lokale Entwicklungsumgebung..."

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker läuft nicht! Bitte Docker Desktop starten."
  exit 1
fi

# Prüfe ob docker-compose verfügbar ist
if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose nicht gefunden! Bitte installieren."
  exit 1
fi

# Starte MySQL Container
echo "📦 Starte MySQL Container..."
docker-compose -f docker-compose.dev.yml up -d

# Warte bis MySQL bereit ist
echo "⏳ Warte bis MySQL bereit ist..."
sleep 5

# Prüfe MySQL Status
echo "🔍 Prüfe MySQL Status..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
  echo "✅ MySQL läuft!"
else
  echo "❌ MySQL konnte nicht gestartet werden!"
  docker-compose -f docker-compose.dev.yml logs mysql
  exit 1
fi

# Wechsle ins Backend-Verzeichnis
cd backend

# Kopiere .env.local zu .env falls .env nicht existiert
if [ ! -f .env ]; then
  echo "📝 Erstelle .env aus .env.local..."
  cp .env.local .env
fi

# Installiere Dependencies falls node_modules nicht existiert
if [ ! -d "node_modules" ]; then
  echo "📦 Installiere Backend Dependencies..."
  npm install
fi

# Generiere Prisma Client
echo "🔧 Generiere Prisma Client..."
npm run prisma:generate

# Führe Migrationen aus
echo "🗄️  Führe Datenbank-Migrationen aus..."
npm run prisma:migrate

# Erstelle/Update Admin User
echo "👤 Erstelle/Update Admin User..."
npm run update-admin

echo ""
echo "✅ Lokale Entwicklungsumgebung ist bereit!"
echo ""
echo "📌 Nächste Schritte:"
echo "   1. Backend starten:  cd backend && npm run start:dev"
echo "   2. Frontend starten: npm run dev"
echo ""
echo "📊 MySQL verwalten:"
echo "   - Status:    docker-compose -f docker-compose.dev.yml ps"
echo "   - Logs:      docker-compose -f docker-compose.dev.yml logs -f mysql"
echo "   - Stoppen:   docker-compose -f docker-compose.dev.yml down"
echo "   - Studio:    cd backend && npm run prisma:studio"
echo ""
