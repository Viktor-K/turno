#!/bin/bash

# Script per avviare il database PostgreSQL locale con Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Turno - Database Development Setup ===${NC}"

# Verifica che Docker sia installato
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Errore: Docker non è installato.${NC}"
    echo "Installa Docker da https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verifica che Docker Compose sia disponibile
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Errore: Docker Compose non è disponibile.${NC}"
    exit 1
fi

# Crea directory per i dati se non esiste
mkdir -p docker-data/postgres

# Crea .env.local se non esiste
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creazione file .env.local...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}File .env.local creato. Modifica se necessario.${NC}"
fi

case "${1:-start}" in
    start)
        echo -e "${GREEN}Avvio PostgreSQL...${NC}"
        docker compose up -d

        echo -e "${YELLOW}Attendo che PostgreSQL sia pronto...${NC}"
        sleep 3

        # Verifica che il container sia in esecuzione
        if docker compose ps | grep -q "running"; then
            echo -e "${GREEN}PostgreSQL avviato con successo!${NC}"
            echo ""
            echo "Connessione database:"
            echo "  Host: localhost"
            echo "  Port: 5432"
            echo "  Database: turno_db"
            echo "  User: turno_user"
            echo "  Password: turno_password"
            echo ""
            echo -e "${YELLOW}Per inizializzare il database, esegui:${NC}"
            echo "  npm run dev"
            echo "  # Poi in un browser vai a: POST /api/db/migrate"
            echo ""
            echo -e "${YELLOW}Oppure usa curl:${NC}"
            echo "  curl -X POST http://localhost:5173/api/db/migrate"
        else
            echo -e "${RED}Errore nell'avvio di PostgreSQL${NC}"
            docker compose logs
            exit 1
        fi
        ;;
    stop)
        echo -e "${YELLOW}Arresto PostgreSQL...${NC}"
        docker compose down
        echo -e "${GREEN}PostgreSQL arrestato.${NC}"
        ;;
    restart)
        echo -e "${YELLOW}Riavvio PostgreSQL...${NC}"
        docker compose restart
        echo -e "${GREEN}PostgreSQL riavviato.${NC}"
        ;;
    logs)
        docker compose logs -f
        ;;
    status)
        docker compose ps
        ;;
    reset)
        echo -e "${RED}ATTENZIONE: Questo cancellerà tutti i dati del database!${NC}"
        read -p "Sei sicuro? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose down -v
            rm -rf docker-data/postgres
            echo -e "${GREEN}Database resettato.${NC}"
        fi
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|logs|status|reset}"
        echo ""
        echo "Comandi:"
        echo "  start   - Avvia il database PostgreSQL"
        echo "  stop    - Arresta il database"
        echo "  restart - Riavvia il database"
        echo "  logs    - Mostra i log del database"
        echo "  status  - Mostra lo stato del container"
        echo "  reset   - Cancella tutti i dati e ricrea il database"
        exit 1
        ;;
esac
