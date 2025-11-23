'use client';

import React, { useState } from 'react';
import { ChannelHeader } from '@/components/features/channels/ChannelHeader';
import { MessageList } from '@/components/features/chat/MessageList';
import { ChatInput } from '@/components/features/chat/ChatInput';

// TODO: Mock data - esto se reemplazara con datos reales de la API
const mockChannel = {
  id: '1',
  name: 'general',
  description: 'General discussion',
  owner_id: '1',
  channel_type: 'public' as const,
  created_at: Date.now(),
  user_count: 10,
};

const mockMessages = [
  {
    id: '1',
    thread_id: '1',
    user_id: '1',
    content: 'Hello everyone!',
    type: 'text' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    thread_id: '1',
    user_id: '2',
    content: 'Hi Alice! How are you?',
    type: 'text' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = (content: string) => {
    // TODO: Aqui se conectara con la API para enviar mensajes
    console.log('Sending message:', content);

    const newMessage = {
      id: String(messages.length + 1),
      thread_id: '1',
      user_id: '1',
      content,
      type: 'text' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex-1 flex flex-col">
      <ChannelHeader channel={mockChannel} />
      <MessageList
        messages={messages}
        onEdit={(id) => console.log('Edit message:', id)}
        onDelete={(id) => console.log('Delete message:', id)}
      />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
