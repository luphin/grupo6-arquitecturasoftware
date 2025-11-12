# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based chat application with a microservices architecture. The frontend is built with React 19, Next.js 16, TypeScript, and Tailwind CSS.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

The development server runs on http://localhost:3000

## Project Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication routes (login, register)
│   ├── (chat)/              # Chat application routes
│   │   ├── channels/[channelId]/  # Dynamic channel pages
│   │   ├── layout.tsx       # Chat layout with sidebar and navbar
│   │   └── page.tsx         # Chat home page
│   ├── api/                 # API routes (messages, channels, socket)
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Reusable UI components (Button, Input, Avatar, Modal, Skeleton)
│   └── features/            # Feature-specific components
│       ├── auth/            # Authentication components (LoginForm, RegisterForm)
│       ├── channels/        # Channel components (ChannelList, ChannelHeader)
│       ├── chat/            # Chat components (MessageList, MessageItem, ChatInput)
│       └── layout/          # Layout components (Navbar, Sidebar, Footer)
├── types/                   # TypeScript type definitions
│   └── index.ts            # Shared types (User, Channel, Thread, Message, etc.)
├── hooks/                   # Custom React hooks
└── lib/                     # Utility functions and configurations
```

### Component Architecture

The application follows a component-based architecture with clear separation of concerns:

1. **UI Components** (`src/components/ui/`): Reusable, presentation-only components
   - Button: Supports variants (primary, secondary, ghost, danger) and sizes (sm, md, lg)
   - Input: Text input with label and error state support
   - Avatar: User avatar with status indicator support
   - Modal: Dialog/modal component for overlays
   - Skeleton: Loading state components for messages and channels

2. **Feature Components** (`src/components/features/`): Domain-specific components
   - Auth: Login and registration forms
   - Channels: Channel list and header components
   - Chat: Message display and input components
   - Layout: Application layout components (navbar, sidebar, footer)

3. **Pages** (`src/app/`): Next.js App Router pages
   - Uses route groups `(auth)` and `(chat)` for logical organization
   - Dynamic routes for channel pages: `/channels/[channelId]`

### Type System

All types are centralized in `src/types/index.ts`:

- **User**: User account with status (online/offline/away)
- **Channel**: Chat channels (public/private)
- **Thread**: Discussion threads within channels
- **Message**: Chat messages with moderation support
- **Attachment**: File attachments for messages
- **PresenceStatus**: User online status tracking
- **ModerationEvent**: Content moderation events

### State Management

Currently using React's built-in state management (useState, useContext). Pages contain mock data that should be replaced with API calls to backend microservices.

### Styling

- Uses Tailwind CSS v4 for styling
- All components use utility classes
- Responsive design with mobile-first approach

## Microservices Architecture

The backend consists of 13 microservices (to be implemented):

1. **Servicio de Usuarios (Group 1)**: Registration, authentication, user profiles
2. **Servicio de Canales (Group 2)**: Channel creation and management
3. **Servicio de Hilos (Group 3)**: Thread management within channels
4. **Servicio de Mensajes (Group 4)**: Message publishing, editing, deletion
5. **Servicio de Presencia (Group 5)**: User connection status (online/offline)
6. **Servicio de Moderación (Group 6)**: Content moderation and inappropriate language detection
7. **Servicio de Archivos (Group 7)**: File upload and attachment management
8. **Servicio de Búsqueda (Group 8)**: Message, thread, and file search indexing
9. **Servicio de Chatbot Académico (Group 9)**: Academic FAQ bot
10. **Servicio de Chatbot de Utilidad (Group 10)**: Utility bot (reminders, polls)
11. **Servicio de Chatbot de Cálculo (Group 11)**: Math calculation bot
12. **Servicio de Chatbot de Wikipedia (Group 12)**: Encyclopedia lookup bot
13. **Servicio de Chatbot de Programación (Group 13)**: Programming help bot

All microservices communicate via event-driven architecture. The frontend currently uses mock data but should connect to these services via API routes in `src/app/api/`.

## Next Steps for Integration

1. Replace mock data in pages with real API calls
2. Implement WebSocket connection for real-time messaging (see `src/app/api/socket/route.ts`)
3. Add authentication flow connecting to User Service
4. Integrate with Channel, Thread, and Message services
5. Add file upload functionality connecting to File Service
6. Implement search functionality using Search Service
7. Add chatbot integrations for automated responses

