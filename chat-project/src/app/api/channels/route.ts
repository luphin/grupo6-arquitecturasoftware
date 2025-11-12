import { NextResponse } from 'next/server';

// TODO: Connect to Channels microservice
export async function GET() {
  // Mock response for now
  const channels = [
    {
      id: '1',
      name: 'general',
      description: 'General discussion',
      type: 'public',
      createdBy: '1',
      createdAt: new Date().toISOString(),
      memberCount: 10,
    },
    {
      id: '2',
      name: 'arquitectura-software',
      description: 'Software Architecture course',
      type: 'public',
      createdBy: '1',
      createdAt: new Date().toISOString(),
      memberCount: 25,
    },
  ];

  return NextResponse.json(channels);
}

export async function POST(request: Request) {
  const body = await request.json();

  // TODO: Connect to Channels microservice to create channel
  const newChannel = {
    id: String(Date.now()),
    ...body,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(newChannel, { status: 201 });
}
