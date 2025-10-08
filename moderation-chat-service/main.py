# main.py
from fastapi import FastAPI
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = FastAPI(title="Moderation Chat Service")

# Conexión a MongoDB usando variables de entorno
MONGODB_URL = os.getenv("MONGODB_URL")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

client = MongoClient(MONGODB_URL)
db = client[os.getenv("MONGODB_DATABASE", "moderation_db")]

@app.get("/")
async def root():
    return {"message": "Moderation Chat Service is running"}

@app.get("/health")
async def health_check():
    try:
        client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
