# Moderation Chat Service

## Setup

1. Clonar el repositorio
2. Copiar el archivo de configuración:

    ```bash
       cp .env.example .env
    ```

3. Editar `.env` y configurar dependencias
4. Levantar servicios

    ```bash
    # Construir y levantar los servicios
    docker-compose up --build

    # O en modo detached
    docker-compose up -d --build

    # Ver logs
    docker-compose logs -f moderation-chat-service

    # Detener servicios
    docker-compose down```

## Acceder a

fastapi: [http://localhost:8080]
documentación automática: [http://localhost:8080/docs]
Grafana: [http://localhost:3000]
MongoDB: [localhost:27017]

## Team 6

Grupo 6 – Servicio de Moderación

- Hernán Fuentes 202073614-6
- Jonathan Olivares 202073096-2
- Luis Zegarra 202073628-6
