import { NextResponse } from 'next/server';

// TODO: Connect to Messages microservice
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');
  const threadId = searchParams.get('threadId');

  // Mock response for now
  const messages = [
    {
      id: '1',
      threadId: threadId || '1',
      channelId: channelId || '1',
      content: 'Hello everyone!',
      userId: '1',
      type: 'text',
      createdAt: new Date().toISOString(),
      isEdited: false,
    },
  ];

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const body = await request.json();

  // TODO: Connect to Messages microservice to create message
  const newMessage = {
    id: String(Date.now()),
    ...body,
    createdAt: new Date().toISOString(),
    isEdited: false,
  };

  return NextResponse.json(newMessage, { status: 201 });
}
