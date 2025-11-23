#!/bin/bash

# Script para iniciar el entorno de desarrollo completo
# Frontend (Next.js) + API Gateway

echo "🚀 Iniciando entorno de desarrollo..."
echo ""

# Verificar si node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $GATEWAY_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verificar e instalar dependencias del API Gateway
echo "📦 Verificando dependencias del API Gateway..."
cd api-gateway
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del API Gateway..."
    pnpm install
fi

# Iniciar API Gateway
echo "🌐 Iniciando API Gateway en puerto 8080..."
node server.js &
GATEWAY_PID=$!
sleep 2

# Verificar que el gateway inició correctamente
if ! kill -0 $GATEWAY_PID 2>/dev/null; then
    echo "❌ Error al iniciar el API Gateway"
    exit 1
fi

echo "✅ API Gateway corriendo (PID: $GATEWAY_PID)"
echo ""

# Volver al directorio raíz y entrar al frontend
cd ..
cd chat-project

# Verificar e instalar dependencias del Frontend
echo "📦 Verificando dependencias del Frontend..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del Frontend..."
    pnpm install
fi

# Iniciar Frontend
echo "⚛️  Iniciando Frontend en puerto 3000..."
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servicios iniciados:"
echo "   - API Gateway: http://localhost:8080"
echo "   - Frontend:    http://localhost:3000"
echo ""
echo "📝 Logs en tiempo real. Presiona Ctrl+C para detener todos los servicios."
echo ""

# Esperar a que los procesos terminen
wait
