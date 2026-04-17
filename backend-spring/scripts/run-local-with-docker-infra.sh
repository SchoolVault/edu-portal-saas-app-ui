#!/usr/bin/env bash
# Start only MySQL + Redis + RabbitMQ from docker-compose, then print how to run the API on the host.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up -d mysql redis rabbitmq
echo ""
echo "Infra is up. Start the API with the ml profile (prod-shaped config; matches compose DB user/pass and ports):"
echo "  mvn spring-boot:run -Dspring-boot.run.profiles=ml"
echo "Or from your IDE: VM option -Dspring.profiles.active=ml"
echo "Health: http://localhost:8080/actuator/health"
