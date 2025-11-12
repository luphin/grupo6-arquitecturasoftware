# Aplicación de Chat - USM

Aplicación de chat moderna construida con Next.js y arquitectura de microservicios. El frontend está desarrollado con React 19, Next.js 16, TypeScript y Tailwind CSS v4.

## 🚀 Comenzando

### Requisitos Previos

- Node.js 18+
- npm, yarn, pnpm o bun


### Instalación

```bash
# Instalar dependencias
npm install
```

### Comandos de Desarrollo

```bash
# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Ejecutar linter
npm run lint
```

El servidor de desarrollo se ejecuta en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Páginas de Next.js App Router
│   ├── (auth)/              # Rutas de autenticación (login, registro)
│   ├── (chat)/              # Rutas de la aplicación de chat
│   │   ├── channels/[channelId]/  # Páginas dinámicas de canales
│   │   ├── layout.tsx       # Layout del chat con sidebar y navbar
│   │   └── page.tsx         # Página principal del chat
│   ├── api/                 # Rutas API (mensajes, canales, socket)
│   └── layout.tsx           # Layout raíz
├── components/
│   ├── ui/                  # Componentes UI reutilizables
│   │   ├── Button.tsx       # Botón con variantes (primary, secondary, ghost, danger)
│   │   ├── Input.tsx        # Input de texto con label y estados de error
│   │   ├── Avatar.tsx       # Avatar de usuario con indicador de estado
│   │   ├── Modal.tsx        # Componente de diálogo/modal
│   │   └── Skeleton.tsx     # Componentes de estado de carga
│   ├── features/            # Componentes específicos de funcionalidades
│   │    ├── auth/            # Componentes de autenticación
│   │    ├── channels/        # Componentes de canales
│   │    ├── chat/            # Componentes de chat
│   │    └── layout/          # Componentes de layout (Navbar, Sidebar, Footer)
│   └── providers/           # Configuraciones que dan contexto, pueden ser aplicadas a nivel macro o micro
├── contexts/                # Contextos de React
│   └── ThemeContext.tsx     # Contexto de tema (light/dark mode)
├── types/                   # Definiciones de tipos TypeScript
│   └── index.ts            # Tipos compartidos (User, Channel, Thread, Message, etc.)
├── hooks/                   # Hooks personalizados de React
└── lib/                     # Funciones de utilidad y configuraciones
```

## 🎨 Arquitectura de Componentes

### 1. Componentes UI (`src/components/ui/`)
Componentes reutilizables de solo presentación:

- **Button**: Soporta variantes (primary, secondary, ghost, danger) y tamaños (sm, md, lg)
- **Input**: Input de texto con soporte para label y estado de error
- **Avatar**: Avatar de usuario con soporte para indicador de estado
- **Modal**: Componente de diálogo/modal para overlays
- **Skeleton**: Componentes de estado de carga para mensajes y canales

### 2. Componentes de Funcionalidad (`src/components/features/`)
Componentes específicos del dominio:

- **Auth**: Formularios de login y registro
- **Channels**: Lista de canales y componentes de encabezado
- **Chat**: Componentes de visualización y entrada de mensajes
- **Layout**: Componentes de layout de la aplicación (navbar, sidebar, footer)

### 3. Páginas (`src/app/`)
Páginas de Next.js App Router:

- Usa grupos de rutas `(auth)` y `(chat)` para organización lógica
- Rutas dinámicas para páginas de canales: `/channels/[channelId]`

## 🎯 Sistema de Tipos

Todos los tipos están centralizados en `src/types/index.ts`:

- **User**: Cuenta de usuario con estado (online/offline/away)
- **Channel**: Canales de chat (públicos/privados)
- **Thread**: Hilos de discusión dentro de canales
- **Message**: Mensajes de chat con soporte de moderación
- **Attachment**: Archivos adjuntos para mensajes
- **PresenceStatus**: Seguimiento de estado en línea del usuario
- **ModerationEvent**: Eventos de moderación de contenido

## 🎨 Sistema de Diseño

### Estilos

- Usa Tailwind CSS v4 para estilos
- Todos los componentes usan clases de utilidad
- Diseño responsive con enfoque mobile-first

### Tema y Colores

El proyecto incluye un sistema de temas con soporte para modo claro/oscuro:

**Colores principales:**
- `primary` - Color principal de la marca (Azul)
- `secondary` - Color secundario (Púrpura)
- `accent` - Color de resaltado (Cyan)
- `success` - Para botones de aceptar/confirmar (Verde)
- `danger` - Para botones de cancelar/eliminar (Rojo)
- `warning` - Para advertencias/alertas (Naranja)

**Colores semánticos:**
- `background` / `foreground` - Fondos y texto principal
- `border` - Bordes
- `muted` / `muted-foreground` - Texto y fondos secundarios

El tema se puede cambiar mediante un toggle en el Navbar y se persiste en `localStorage`.

## 🏗️ Arquitectura de Microservicios

El backend consiste en 13 microservicios:

1. **Servicio de Usuarios (Grupo 1)**: Registro, autenticación, perfiles de usuario
2. **Servicio de Canales (Grupo 2)**: Creación y gestión de canales
3. **Servicio de Hilos (Grupo 3)**: Gestión de hilos dentro de canales
4. **Servicio de Mensajes (Grupo 4)**: Publicación, edición, eliminación de mensajes
5. **Servicio de Presencia (Grupo 5)**: Estado de conexión de usuarios (online/offline)
6. **Servicio de Moderación (Grupo 6)**: Moderación de contenido y detección de lenguaje inapropiado
7. **Servicio de Archivos (Grupo 7)**: Carga de archivos y gestión de adjuntos
8. **Servicio de Búsqueda (Grupo 8)**: Indexación de búsqueda de mensajes, hilos y archivos
9. **Servicio de Chatbot Académico (Grupo 9)**: Bot de preguntas frecuentes académicas
10. **Servicio de Chatbot de Utilidad (Grupo 10)**: Bot de utilidades (recordatorios, encuestas)
11. **Servicio de Chatbot de Cálculo (Grupo 11)**: Bot de cálculos matemáticos
12. **Servicio de Chatbot de Wikipedia (Grupo 12)**: Bot de búsqueda enciclopédica
13. **Servicio de Chatbot de Programación (Grupo 13)**: Bot de ayuda de programación

Todos los microservicios se comunican mediante arquitectura basada en eventos. El frontend actualmente usa datos simulados pero debe conectarse a estos servicios a través de rutas API en `src/app/api/`.

## 🔄 Gestión de Estado

Actualmente usa gestión de estado integrada de React (useState, useContext). Las páginas contienen datos simulados que deben ser reemplazados con llamadas API a los microservicios del backend.

## 📋 Próximos Pasos para Integración

1. Reemplazar datos simulados en páginas con llamadas API reales
2. Implementar conexión WebSocket para mensajería en tiempo real (ver `src/app/api/socket/route.ts`)
3. Agregar flujo de autenticación conectándose al Servicio de Usuarios
4. Integrar con servicios de Canales, Hilos y Mensajes
5. Agregar funcionalidad de carga de archivos conectándose al Servicio de Archivos
6. Implementar funcionalidad de búsqueda usando el Servicio de Búsqueda
7. Agregar integraciones de chatbots para respuestas automatizadas

## 🌐 Características de UI

### Sidebar Redimensionable
- El sidebar puede ajustarse en ancho arrastrando desde el borde derecho
- Límites: 230px (mínimo) - 350px (máximo)
- El ancho se persiste en `localStorage`

### Toggle de Tema
- Botón de cambio de tema en el Navbar (esquina superior derecha)
- Soporte para modo claro y oscuro
- Preferencia persistida en `localStorage`

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs)

## 📄 Licencia

Este proyecto es parte del curso de Arquitectura de Software - USM.
