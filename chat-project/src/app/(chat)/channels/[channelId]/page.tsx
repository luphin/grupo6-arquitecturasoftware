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
  type: 'public' as const,
  createdBy: '1',
  createdAt: new Date(),
};

const mockMessages = [
  {
    id: '1',
    threadId: '1',
    channelId: '1',
    content: 'Hello everyone!',
    userId: '1',
    user: {
      id: '1',
      username: 'Alice',
      email: 'alice@example.com',
      status: 'online' as const,
      createdAt: new Date(),
    },
    type: 'text' as const,
    createdAt: new Date(),
    isEdited: false,
  },
  {
    id: '2',
    threadId: '1',
    channelId: '1',
    content: 'Hi Alice! How are you?',
    userId: '2',
    user: {
      id: '2',
      username: 'Bob',
      email: 'bob@example.com',
      status: 'online' as const,
      createdAt: new Date(),
    },
    type: 'text' as const,
    createdAt: new Date(),
    isEdited: false,
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
      threadId: '1',
      channelId: params.channelId,
      content,
      userId: '1',
      user: {
        id: '1',
        username: 'Demo User',
        email: 'demo@example.com',
        status: 'online' as const,
        createdAt: new Date(),
      },
      type: 'text' as const,
      createdAt: new Date(),
      isEdited: false,
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
