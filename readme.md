# WhatsUp

<div align="center">
  <img src="client/public/logo.webp" alt="WhatsUp Logo" width="100" height="100" />
  <h3>A modern real-time messaging application</h3>
  
  <p>
    <a href="https://whatsup-chat.onrender.com/" target="_blank">
      <strong>🔗 Live Demo</strong>
    </a>
  </p>
</div>

## Overview

WhatsUp is a feature-rich chat application built with modern web technologies. It provides real-time messaging capabilities with a clean, responsive UI that works seamlessly across all devices.

You can try the application at: [https://whatsup-chat.onrender.com/](https://whatsup-chat.onrender.com/)

<div align="center">
  <img src="Demo/ui-demo.png" alt="WhatsUp UI Demo" width="100%" />
</div>

## Features

- **Real-time messaging**: Instant message delivery using WebSocket technology
- **Video calling**: HD video calls with screen sharing and call controls
- **User authentication**: Secure user management with Clerk
- **Redis caching**: High-performance caching for conversations and messages
- **Responsive design**: Works seamlessly on mobile, tablet, and desktop
- **Dark/Light mode**: Theme customization for user comfort
- **Group conversations**: Create and manage group chats
- **Message status**: Track when messages are sent, delivered, and read
- **Media sharing**: Share images and other media in conversations
- **Modern UI**: Clean interface with smooth animations and transitions

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Shad CN UI Library
- Clerk for authentication

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL database
- Prisma ORM
- Redis for caching
- WebSockets for real-time communication
- Stream.io for video calling

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- PostgreSQL
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dasakash26/WhatsUp.git
   cd WhatsUp
   ```

2. **Set up the backend**

   ```bash
   cd server
   npm install

   # Create a .env file with your database and Clerk credentials
   # Example:
   # DATABASE_URL="postgresql://username:password@localhost:5432/whatsup"
   # CLERK_SECRET_KEY=your_clerk_secret_key
   # REDIS_URL=redis://localhost:6379
   # REDIS_PASSWORD=your_redis_password
   # STREAM_API_KEY=your_stream_api_key
   # STREAM_API_SECRET=your_stream_api_secret

   # Run migrations
   npx prisma migrate dev

   # Start the server
   npm run dev
   ```

3. **Set up the frontend**

   ```bash
   cd ../client
   npm install

   # Create a .env file for your frontend environment variables
   # Example:
   # VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   # VITE_API_URL=http://localhost:4000/api
   # VITE_WS_URL=ws://localhost:4000
   # VITE_STREAM_API_KEY=your_stream_api_key

   # Start the development server
   npm run dev
   ```

4. **Access the application**

   Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

## Development

### Running in Development Mode

- Frontend: `cd client && npm run dev`
- Backend: `cd server && npm run dev`

### Building for Production

- Frontend: `cd client && npm run build`
- Backend: `cd server && npm run build`

## New Features

### Video Calling System

- **HD Video Calls**: Crystal-clear video calling with Stream.io integration
- **Screen Sharing**: Share your screen during calls
- **Call Controls**: Mute/unmute, video on/off, end call functionality
- **Call Notifications**: Real-time ringing notifications for incoming calls
- **Call History**: Track call history and missed calls

### Redis Caching System

- **Conversation Caching**: Fast loading of conversation lists with Redis
- **Message Caching**: Cached message history for quick retrieval
- **Cache Invalidation**: Automatic cache updates when data changes
- **Error Handling**: Robust error handling for cache operations
- **Performance**: Reduced database load and faster response times

### Enhanced Cache Management

- **Smart Invalidation**: Cache automatically clears when conversations/messages are modified
- **Participant-based Caching**: Cache keys based on user participation
- **TTL Management**: Optimized cache expiration times (5min conversations, 10min messages)
- **Fallback Handling**: Graceful degradation when Redis is unavailable

## Project Structure

```
WhatsUp/
├── client/                 # Frontend application
│   ├── public/             # Static assets
│   │   └── logo.webp       # Application logo
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   │   ├── videoCall/  # Video calling components
│   │   │   ├── ui/         # UI library components
│   │   ├── contexts/       # React contexts for state management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and helpers
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Application entry point
│   ├── .env.example        # Example environment variables
│   ├── package.json        # Frontend dependencies
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── vite.config.ts      # Vite configuration
│
├── server/                 # Backend application
│   ├── prisma/             # Prisma ORM configuration and migrations
│   │   ├── migrations/     # Database migration files
│   │   └── schema.prisma   # Database schema
│   ├── src/                # Source code
│   │   ├── controllers/    # Request handlers
│   │   ├── lib/            # Cache management and utilities
│   │   │   ├── cacheManager.ts # Redis cache system
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   ├── websocket/      # WebSocket implementation
│   │   └── index.ts        # Server entry point
│   ├── .env.example        # Example environment variables
│   └── package.json        # Backend dependencies
│
├── Demo/                   # Demo screenshots and assets
│   └── ui-demo.png         # UI demonstration image
│
├── .gitignore              # Git ignore file
├── package.json            # Root package.json for workspace commands
└── README.md               # Project documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
