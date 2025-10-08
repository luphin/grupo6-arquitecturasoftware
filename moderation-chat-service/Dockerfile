# Dockerfile para moderation-chat-service
FROM python:3.13-slim

# Evita que Python escriba archivos .pyc y habilita output sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /code

# Instalar dependencias del sistema si son necesarias
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 80

# Comando para ejecutar la aplicación con uvicorn
# NOTA: --reload se quita en produccion para mejor rendimiento
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]
