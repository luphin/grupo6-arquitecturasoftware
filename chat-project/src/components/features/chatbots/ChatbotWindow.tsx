'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function ChatbotWindow({ botId, botName }: ChatbotWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Limpiar chat al cambiar de bot
  useEffect(() => {
    setMessages([]); 
    setInputValue(''); 
    setIsLoading(false);
  }, [botId]);

  // Auto-scroll
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
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let apiPath = '';
      if (botId === 'bot-wikipedia') {
        apiPath = '/api/chatbot/wikipedia/chat-wikipedia';
      } else if (botId === 'bot-programacion') {
        apiPath = '/api/chatbot/programming/chat'; 
      } else {
        throw new Error('Bot no configurado');
      }

      const fullUrl = `${BASE_URL}${apiPath}`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      
      // IMPORTANTE: Aseguramos que sea un string limpio
      const botResponse = typeof data.reply === 'string' ? data.reply : (data.message || JSON.stringify(data));

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
        content: 'Lo siento, ocurrió un error de conexión.',
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
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm h-fit mt-1
              ${msg.role === 'user' ? 'bg-gray-800 text-white' : 
                botId === 'bot-wikipedia' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Burbuja de Mensaje */}
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm overflow-hidden
              ${msg.role === 'user' 
                ? 'bg-gray-800 text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
              }`}>
              
              {msg.role === 'bot' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Títulos (### en tu ejemplo es h3)
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props as any} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-gray-900 border-b pb-1" {...props as any} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-gray-800" {...props as any} />,
                    
                    // Párrafos (clave para espaciado)
                    p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-700" {...props as any} />,
                    
                    // Listas
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-gray-700" {...props as any} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-gray-700" {...props as any} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props as any} />,
                    
                    // Código en línea (`variable`)
                    code: ({node, ...props}) => (
                      <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs font-medium border border-gray-200" {...props as any} />
                    ),
                    
                    // Bloques de código (```python ... ```)
                    pre: ({node, ...props}) => (
                      <div className="bg-slate-900 text-slate-50 p-4 rounded-lg my-4 overflow-x-auto shadow-inner">
                        <pre className="font-mono text-xs leading-5" {...props as any} />
                      </div>
                    ),
                    
                    // Enlaces
                    a: ({node, ...props}) => (
                      <a className="text-blue-600 hover:underline break-all font-medium" target="_blank" rel="noopener noreferrer" {...props as any} />
                    ),
                    
                    // Citas
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-3 text-gray-500 italic bg-gray-50 rounded-r" {...props as any} />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400 mt-1">
                <Loader2 size={16} className="animate-spin" />
             </div>
             <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none text-sm text-gray-500">
               <span className="animate-pulse">Escribiendo...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Mensaje a ${botName}...`}
            className="flex-1 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-black"
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
