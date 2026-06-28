#!/bin/bash
echo "Stopping old Evolution API if it exists..."
docker rm -f evolution-api 2>/dev/null
echo "Starting Evolution API v1.8.3 (Lightweight version)..."
docker run -d -p 8080:8080 --name evolution-api --restart always -e AUTHENTICATION_API_KEY=QamarAlFayhaa2026 -e AUTHENTICATION_TYPE=apikey -e CORS_ORIGIN="*" atendai/evolution-api:v1.8.2
echo "Done! Evolution API is now running in the background."
