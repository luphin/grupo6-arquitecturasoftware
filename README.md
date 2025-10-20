# Moderation Chat Service

Microservicio de moderación multilenguaje con detección automática de contenido inapropiado usando **Detoxify** y listas negras personalizables.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Endpoints de API](#-endpoints-de-api)
- [Eventos Publicados](#-eventos-publicados)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Mantenimiento](#-mantenimiento)
- [Troubleshooting](#-troubleshooting)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🚀 Características

### Core
- ✅ **Detección de toxicidad multilenguaje** usando Detoxify (6 categorías)
- ✅ **Lista negra personalizable** con soporte para expresiones regulares
- ✅ **Sistema de strikes** con reset automático temporal
- ✅ **Baneos temporales y permanentes** por canal
- ✅ **Cache distribuido** con Redis para alto rendimiento
- ✅ **Publicación de eventos** vía RabbitMQ para otros microservicios

### Idiomas Soportados
- 🇪🇸 Español
- 🇬🇧 Inglés

### Funcionalidades Avanzadas
- Detección automática de idioma
- Análisis de severidad (low, medium, high)
- Historial completo de violaciones
- Estadísticas por canal y usuario
- API administrativa para gestión
- Rate limiting configurable
- Health checks y métricas

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                   │
├─────────────────────────────────────────────────────────┤
│                  Service Layer                           │
│              (Orquestación de lógica)                    │
├─────────────────────────────────────────────────────────┤
│                    Core Logic                            │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐    │
│  │ Moderation   │ │  Blacklist   │ │   Strike    │    │
│  │   Engine     │ │   Manager    │ │  Manager    │    │
│  │  (Detoxify)  │ │   (Redis)    │ │ (MongoDB)   │    │
│  └──────────────┘ └──────────────┘ └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│                 Repository Layer                         │
│              (Acceso a datos - MongoDB)                  │
├─────────────────────────────────────────────────────────┤
│              Infrastructure Layer                        │
│     MongoDB  │  Redis  │  RabbitMQ  │  Detoxify        │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Moderación

```mermaid
graph TD
    A[Mensaje llega] --> B[Detectar idioma]
    B --> C[Analizar con Detoxify]
    B --> D[Verificar lista negra Redis]
    C --> E[Combinar resultados]
    D --> E
    E --> F{¿Es tóxico?}
    F -->|No| G[Aprobar mensaje]
    F -->|Sí| H[Registrar violación]
    H --> I[Aplicar strike]
    I --> J{¿Excede límite?}
    J -->|No| K[Advertencia]
    J -->|Sí - 3 strikes| L[Ban temporal 24h]
    J -->|Sí - 5 strikes| M[Ban permanente]
    K --> N[Publicar evento]
    L --> N
    M --> N
    N --> O[Retornar respuesta]
```

---

## 🛠️ Tecnologías

### Backend
- **FastAPI** 0.104+ - Framework web async
- **Python** 3.11 - Lenguaje de programación
- **Pydantic** 2.5+ - Validación de datos
- **Uvicorn** - ASGI server

### NLP
- **Detoxify** 0.5.2 - Detección de toxicidad multilenguaje
- **LangDetect** 1.0.9 - Detección de idioma

### Bases de Datos
- **MongoDB** 7.0 - Base de datos principal (NoSQL)
- **Redis** 7 - Cache y rate limiting

### Messaging
- **RabbitMQ** 3 - Event bus para comunicación entre microservicios

### DevOps
- **Docker** & **Docker Compose** - Containerización
- **Loguru** - Logging avanzado
- **Prometheus** (opcional) - Métricas

---

## 📦 Requisitos Previos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Python** 3.11+ (solo para desarrollo local)
- **Git**

### Recursos Recomendados
- **RAM**: 2GB mínimo, 4GB recomendado
- **Disco**: 2GB espacio libre
- **CPU**: 2 cores mínimo

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd moderation-chat-service
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus configuraciones
vim .env
```

### 3. Levantar los Servicios con Docker Compose

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f moderation-service
```

### 4. Verificar que Todo Está Funcionando

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Documentación Swagger
open http://localhost:8000/api/v1/docs
```

### 5. (Opcional) Seed de Datos Iniciales

```bash
# Ejecutar script de seed para lista negra inicial
docker-compose exec moderation-service python scripts/seed_database.py
```

---

## ⚙️ Configuración

### Variables de Entorno Principales

Ver `.env.example` para todas las variables disponibles.

---

## 💻 Uso

### Moderar un Mensaje

```bash
curl -X POST "http://localhost:8000/api/v1/moderation/check" \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "msg_123",
    "user_id": "user_456",
    "channel_id": "channel_789",
    "content": "Tu mensaje aquí"
  }'
```

**Respuesta:**
```json
{
  "is_approved": false,
  "action": "warning",
  "severity": "medium",
  "toxicity_score": 0.75,
  "strike_count": 2,
  "message": "Advertencia. Strike 2/3",
  "detected_words": ["idiota"],
  "language": "es",
  "ban_info": null
}
```

### Analizar Texto (Sin Aplicar Strikes)

```bash
curl -X POST "http://localhost:8000/api/v1/moderation/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Texto a analizar"
  }'
```

### Obtener Estado de Usuario

```bash
curl "http://localhost:8000/api/v1/moderation/status/user_456/channel_789"
```

### Endpoints Administrativos (Requieren API Key)

```bash
# Listar usuarios baneados
curl -H "X-API-Key: your-api-key" \
  "http://localhost:8000/api/v1/admin/banned-users"

# Desbanear usuario
curl -X PUT -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  "http://localhost:8000/api/v1/admin/users/user_456/unban" \
  -d '{
    "channel_id": "channel_789",
    "reason": "Apelación aceptada",
    "reset_strikes": false
  }'
```

---

## 📡 Endpoints de API

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

### Lista Completa de Endpoints

#### Health & Status
- `GET /api/v1/health` - Health check completo
- `GET /api/v1/ping` - Ping simple

#### Moderación
- `POST /api/v1/moderation/check` - Moderar mensaje
- `POST /api/v1/moderation/analyze` - Analizar texto
- `GET /api/v1/moderation/status/{user_id}/{channel_id}` - Estado de usuario

#### Lista Negra (Blacklist)
- `POST /api/v1/blacklist/words` 🔒 - Agregar palabra
- `GET /api/v1/blacklist/words` - Listar palabras
- `DELETE /api/v1/blacklist/words/{word_id}` 🔒 - Eliminar palabra
- `GET /api/v1/blacklist/stats` - Estadísticas
- `POST /api/v1/blacklist/refresh-cache` 🔒 - Refrescar cache

#### Administración
- `GET /api/v1/admin/banned-users` 🔒 - Lista de baneados
- `GET /api/v1/admin/users/{user_id}/violations` 🔒 - Historial de violaciones
- `PUT /api/v1/admin/users/{user_id}/unban` 🔒 - Desbanear usuario
- `GET /api/v1/admin/users/{user_id}/status` 🔒 - Estado completo
- `POST /api/v1/admin/users/{user_id}/reset-strikes` 🔒 - Resetear strikes
- `GET /api/v1/admin/channels/{channel_id}/stats` 🔒 - Estadísticas de canal
- `POST /api/v1/admin/maintenance/expire-bans` 🔒 - Expirar bans

**🔒 = Requiere API Key en header `X-API-Key`**

---

## 📤 Eventos Publicados

El servicio publica eventos a RabbitMQ que otros microservicios pueden consumir:

### `moderation.warning`
```json
{
  "event_type": "moderation.warning",
  "timestamp": "2025-10-13T10:30:00Z",
  "data": {
    "user_id": "user_456",
    "channel_id": "channel_789",
    "strike_count": 2,
    "message_id": "msg_123",
    "severity": "medium"
  }
}
```

### `moderation.user_banned`
```json
{
  "event_type": "moderation.user_banned",
  "timestamp": "2025-10-13T10:30:00Z",
  "data": {
    "user_id": "user_456",
    "channel_id": "channel_789",
    "ban_type": "temporary",
    "banned_until": "2025-10-14T10:30:00Z",
    "reason": "Excedió 3 strikes"
  }
}
```

### `moderation.user_unbanned`
```json
{
  "event_type": "moderation.user_unbanned",
  "timestamp": "2025-10-13T10:30:00Z",
  "data": {
    "user_id": "user_456",
    "channel_id": "channel_789",
    "unbanned_by": "admin_123",
    "reason": "Apelación aceptada"
  }
}
```

### `moderation.message_blocked`
```json
{
  "event_type": "moderation.message_blocked",
  "timestamp": "2025-10-13T10:30:00Z",
  "data": {
    "user_id": "user_456",
    "channel_id": "channel_789",
    "message_id": "msg_123",
    "reason": "Contenido inapropiado detectado",
    "toxicity_score": 0.85
  }
}
```

**Exchange**: `moderation_events` (tipo: topic)  
**Routing Key**: `moderation.<event_type>`

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests unitarios
docker-compose exec moderation-service pytest tests/unit -v

# Tests de integración
docker-compose exec moderation-service pytest tests/integration -v

# Todos los tests con coverage
docker-compose exec moderation-service pytest --cov=app --cov-report=html

# Ver reporte de coverage
open htmlcov/index.html
```

### Tests Manuales con Swagger

1. Ir a http://localhost:8000/api/v1/docs
2. Expandir el endpoint deseado
3. Hacer clic en "Try it out"
4. Completar los parámetros
5. Ejecutar y ver la respuesta

---

## 🚢 Deployment

### Docker Compose (Producción)

```bash
# Usar archivo docker-compose de producción
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de Entorno de Producción

```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Cambiar credenciales por defecto
ADMIN_API_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key-min-32-chars>

# URLs de producción
MONGODB_URL=mongodb://user:pass@mongo-prod:27017/moderation_db
REDIS_URL=redis://user:pass@redis-prod:6379/0
RABBITMQ_URL=amqp://user:pass@rabbitmq-prod:5672/
```

### Kubernetes (Proximamente)

Zona en desarrollo 🏗️ para próxima entrega

---

## 🔧 Mantenimiento

### Limpieza de Datos Antiguos

```bash
# Eliminar violaciones antiguas (más de 90 días)
docker-compose exec moderation-service python scripts/cleanup_old_data.py

# O vía API
curl -X POST -H "X-API-Key: your-api-key" \
  "http://localhost:8000/api/v1/admin/maintenance/cleanup?days=90"
```

### Backup de MongoDB

```bash
# Crear backup
docker-compose exec mongodb mongodump \
  --db=moderation_db \
  --out=/data/backup/$(date +%Y%m%d)

# Restaurar backup
docker-compose exec mongodb mongorestore \
  --db=moderation_db \
  /data/backup/20251013
```

### Monitoreo de Redis

```bash
# Acceder a Redis CLI
docker-compose exec redis redis-cli

# Ver estadísticas
> INFO
> KEYS blacklist:*
> TTL blacklist:es
```

### Ver Eventos en RabbitMQ

1. Ir a http://localhost:15672
2. Login: guest/guest
3. Navegar a "Queues" para ver eventos

---

## 🐛 Troubleshooting

### Problema: Servicio no inicia

```bash
# Ver logs detallados
docker-compose logs moderation-service

# Verificar estado de contenedores
docker-compose ps

# Reiniciar servicios
docker-compose restart
```

### Problema: MongoDB no se conecta

```bash
# Verificar que MongoDB esté corriendo
docker-compose ps mongodb

# Probar conexión manual
docker-compose exec mongodb mongosh
```

### Problema: Redis no cachea

```bash
# Verificar Redis
docker-compose exec redis redis-cli ping

# Limpiar cache manualmente
docker-compose exec redis redis-cli FLUSHDB
```

### Problema: Detoxify tarda mucho

- El primer análisis descarga el modelo (~300MB)
- Los siguientes son más rápidos
- Considerar aumentar RAM si es muy lento

### Problema: Rate limit muy restrictivo

Ajustar en `.env`:
```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=120
RATE_LIMIT_REQUESTS_PER_HOUR=2000
```

---

## 📊 Métricas y Monitoreo

### Health Check Endpoints

```bash
# Health check completo
curl http://localhost:8000/api/v1/health

# Ping simple
curl http://localhost:8000/api/v1/ping
```

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f moderation-service

# Logs dentro del contenedor
docker-compose exec moderation-service tail -f /app/logs/moderation_*.log
```

### Prometheus

Si `ENABLE_METRICS=true`, métricas disponibles en: `http://localhost:9090/metrics`

---

## 🤝 Contribución

### Estructura del Proyecto

```
moderation-chat-service/
├── app/
│   ├── api/              # Endpoints FastAPI
│   ├── core/             # Lógica de negocio
│   ├── models/           # Modelos MongoDB
│   ├── repositories/     # Acceso a datos
│   ├── schemas/          # DTOs Pydantic
│   ├── services/         # Orquestación
│   ├── config/           # Configuración
│   └── utils/            # Utilidades
├── tests/                # Tests
├── scripts/              # Scripts de utilidad
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

### Guía de Contribución

1. Fork el repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Coding Standards

- Python 3.11+
- PEP 8 style guide
- Type hints obligatorios
- Docstrings en funciones públicas
- Tests para nuevas features

---

## 📝 Roadmap

### v1.1 (Próximo Release)
- [ ] Dashboard web para administración
- [ ] Análisis de imágenes (OCR + moderación)
- [ ] API de apelaciones

### v1.2
- [ ] Integración con Discord/Slack
- [ ] Webhooks configurables
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Multi-tenancy

---

## 📞 Soporte

### Documentación
- **API Docs**: http://localhost:8000/api/v1/docs
- **GitHub Issues**: [repository-url]/issues

### Contacto
- Cualquiera de los colaboradores de este repositorio.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- **Detoxify** - Por el excelente modelo de detección de toxicidad
- **FastAPI** - Por el increíble framework
- **Comunidad Open Source** - Por las herramientas utilizadas

---

## 📚 Referencias

- [Detoxify Documentation](https://github.com/unitaryai/detoxify)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)

---

## Team 6

**Made with ❤️ by Grupo 6 - Arquitectura de Software USM**

- Hernán Fuentes 202073614-6
- Jonathan Olivares 202073096-2
- Luis Zegarra 202073628-6
