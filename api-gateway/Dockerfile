FROM node:18-alpine

WORKDIR /app

# Paso 1: Copiar e instalar dependencias
COPY package*.json ./
RUN npm install --production 

# 🚨 CAMBIO CRÍTICO: Copiar explícitamente el archivo de inicio
# Esto asegura que si el COPY . . falla, al menos server.js está presente.
COPY server.js ./ 

EXPOSE 8080
CMD ["node", "server.js"]
