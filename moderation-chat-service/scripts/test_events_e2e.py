"""
Test end-to-end de eventos de RabbitMQ
Crea consumer temporal, publica evento, verifica recepción
"""

import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import aio_pika
from app.config.settings import settings
from app.config.events import rabbitmq
import json
from datetime import datetime


async def test_end_to_end():
    """Test completo de publicación y consumo"""
    
    print("🧪 Starting end-to-end RabbitMQ test...\n")
    
    # 1. Conectar como consumer
    print("📥 Step 1: Creating temporary consumer...")
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    channel = await connection.channel()
    
    exchange = await channel.declare_exchange(
        settings.RABBITMQ_EXCHANGE,
        aio_pika.ExchangeType.TOPIC,
        durable=True
    )
    
    # Crear queue temporal
    queue = await channel.declare_queue("test_e2e_queue", exclusive=True)
    await queue.bind(exchange, routing_key="moderation.*")
    
    print("✅ Consumer ready\n")
    
    # 2. Publicar evento desde el servicio
    print("📤 Step 2: Publishing test event...")
    await rabbitmq.connect()
    
    success = await rabbitmq.publish_event(
        event_type="moderation.test",
        data={
            "test": True,
            "message": "End-to-end test event",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    if success:
        print("✅ Event published\n")
    else:
        print("❌ Failed to publish\n")
        return
    
    # 3. Consumir evento
    print("📥 Step 3: Waiting for event (5 seconds timeout)...")
    
    try:
        message = await asyncio.wait_for(queue.get(), timeout=5.0)
        await message.ack()
        
        event = json.loads(message.body.decode())
        
        print("✅ Event received!")
        print(f"\n   Event Type: {event['event_type']}")
        print(f"   Service: {event.get('service')}")
        print(f"   Data: {json.dumps(event['data'], indent=6)}")
        print("\n🎉 END-TO-END TEST PASSED!")
        
    except asyncio.TimeoutError:
        print("❌ Timeout: No event received")
        print("   This might indicate a problem with RabbitMQ connection")
    
    finally:
        await connection.close()
        await rabbitmq.disconnect()


if __name__ == "__main__":
    asyncio.run(test_end_to_end())  
