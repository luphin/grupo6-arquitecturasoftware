'use client';

import { useChatContext } from '../layout';
import { ThreadMessages } from '@/components/features/chat/ThreadMessages';

export default function ChannelsPage() {
  const { selectedThread } = useChatContext();

  return (
    <div className="flex h-full bg-background">
      {selectedThread ? (
        <ThreadMessages thread={selectedThread} />
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <div className="text-center">
            <div className="flex text-6xl mb-4 justify-center">
              <img src="/Logo_UTFSM.webp" alt="USM logo" width="100" height="200" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Bienvenido a Chat USM
            </h2>
            <p className="text-foreground">
              Elige un canal y luego un chat para ver los mensajes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
