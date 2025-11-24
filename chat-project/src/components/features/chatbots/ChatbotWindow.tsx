'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotWindowProps {
  botId: string;
  botName: string;
}

// URL Base de tu Ingress (apuntando a tu Gateway Node.js)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function ChatbotWindow({ botId, botName }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ SOLUCIÓN 1: Limpiar el chat cuando cambiamos de Bot
  useEffect(() => {
    setMessages([]); // Resetea los mensajes
    setInputValue(''); // Limpia el input por si acaso
    setIsLoading(false);
  }, [botId]); // Se ejecuta cada vez que cambia el ID del bot

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    
    // Agregamos mensaje usuario
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // ✅ SOLUCIÓN 2: Rutas exactas según tu API Gateway (services.js)
      let apiPath = '';
      
      if (botId === 'bot-wikipedia') {
        // Ruta configurada en tu Gateway
        apiPath = '/api/chatbot/wikipedia/chat-wikipedia';
      } else if (botId === 'bot-programacion') {
        // Ruta configurada en tu Gateway
        // NOTA: Verifica si en tu services.js dice 'programming' o 'programacion'
        apiPath = '/api/chatbot/programming/chat'; 
      } else {
        throw new Error('Bot no configurado correctamente');
      }

      const fullUrl = `${BASE_URL}${apiPath}`;
      console.log(`[Chatbot] Enviando a: ${fullUrl}`); // Debug para ver la URL

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Procesar respuesta
      const botResponse = data.message || JSON.stringify(data);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error: any) {
      console.error('Error chatbot:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        content: 'Lo siento, no pude conectar con el servidor del chatbot.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-3 bg-white shadow-sm z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center 
          ${botId === 'bot-wikipedia' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-bold text-lg text-gray-800">{botName}</h2>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> En línea
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-60">
            <Bot size={64} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">¡Hola!</p>
            <p className="text-sm">Soy tu asistente de {botName}.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
              ${msg.role === 'user' ? 'bg-gray-800 text-white' : 
                botId === 'bot-wikipedia' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-gray-800 text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400">
                <Loader2 size={16} className="animate-spin" />
             </div>
             <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-sm text-gray-500">
               <span>Escribiendo...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Mensaje a ${botName}...`}
            className="flex-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!inputValue.trim() || isLoading} size="sm">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
