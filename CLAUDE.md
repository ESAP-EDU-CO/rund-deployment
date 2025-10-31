# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

RUND is a Docker-based microservices application consisting of:

- **rund-core** (OpenKM): Document repository/database (Java/Tomcat)
- **rund-api**: PHP backend API
- **rund-mgp**: Angular 20 SSR frontend
- **rund-ai**: AI service using Ollama with phi3:mini model
- **rund-ocr**: OCR service using PaddleOCR (Spanish/English)

All services communicate through a Docker bridge network (`rund-network`) and use internal container names for service-to-service communication.

## Deployment Commands

### Quick Deployment
```bash
# Development environment
./deploy.sh local

# Production environment
./deploy.sh prod
```

### Common Development Commands
```bash
# View service status
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs for specific service
docker compose logs -f rund-api
docker compose logs -f rund-ai
docker compose logs -f rund-ocr

# Restart specific service
docker compose restart rund-api

# Stop all services
docker compose down

# Update production images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Build and Deploy Images
```bash
# Build and push all components
./scripts/build-and-push.sh v1.2.3

# Build specific components only
./scripts/build-and-push.sh v1.2.3 api,ocr

# Build with latest tag
./scripts/build-and-push.sh
```

## Service Health Checks

```bash
# Check AI service
docker exec rund-ai ollama list
curl http://localhost:11434/api/tags

# Check OCR service
curl http://localhost:8000/health
curl http://localhost:8000/info

# Test OCR with file
curl -X POST -F 'file=@document.pdf' http://localhost:8000/extract-text

# Test AI generation
curl -X POST http://localhost:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"phi3:mini","prompt":"Hola","stream":false}'
```

## Configuration Files

- `docker-compose.yml`: Development configuration with source code mounting
- `docker-compose.prod.yml`: Production configuration using Docker Hub images
- `.env.main`: Development environment variables template
- `.env.prod.main`: Production environment variables template

## Environment Variables

### Development vs Production
- Development uses `localhost` URLs and live code mounting
- Production uses server IP `172.16.234.52` and pre-built images
- AI service uses phi3:mini model (auto-downloaded on first run)
- OCR service supports Spanish and English with 50MB file limit

## Backup Scripts

```bash
# Backup OpenKM data
./scripts/backup_openkm.sh

# Backup local environment
./scripts/backup_local.sh

# Restore OpenKM data
./scripts/restore_openkm.sh
```

## Development Setup

For local development, clone component repositories:
```bash
git clone [URL-REPO-API] rund-api
git clone [URL-REPO-MGP] rund-mgp
git clone [URL-REPO-OCR] rund-ocr
```

## Resource Requirements

- **Development**: 8GB RAM minimum, 20GB disk space
- **Production**: 16GB RAM minimum, 50GB disk space
- **AI/OCR services**: Require significant CPU/memory resources
- **First run**: AI model download may take 5-10 minutes

## Troubleshooting

- Services may take 1-2 minutes to be fully ready
- Check service health with: `docker stats`
- AI service requires time to download phi3:mini model
- OCR service has 60-second timeout for processing
- Use `./scripts/debug_network.sh` for network issues

## URLs (Development)
- Frontend: http://localhost:4000
- API: http://localhost:3000
- OpenKM: http://localhost:8080
- AI: http://localhost:11434
- OCR: http://localhost:8000