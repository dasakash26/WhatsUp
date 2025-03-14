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
- **User authentication**: Secure user management with Clerk
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
- WebSockets for real-time communication

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

## Fixes and Enhancements

This section highlights recent fixes and additional features to improve user experience:

### Fixes:

- **Typing Indicator Alert:**

  - Added real-time typing alerts to notify users when someone is typing in a conversation.

- **Read Receipt Status:**

  - Enhanced message tracking with clear indicators for sent, delivered, and read statuses.

- **Conversation Creation Error Handling:**

  - Improved error handling when creating new conversations to provide better feedback to users.

- **Group Details Improvements:**

  - Resolved issues with displaying participant names in group chats and group details.

- **User Sidebar Enhancements:**

  - Fixed bugs related to showing user profile images in the sidebar for better identification.

- **Image Sending Feature:**
  - Addressed issues in media sharing, ensuring smooth image uploads and display within chats.

### New Features:

- **Participant Names in Groups:**

  - Group chats now display participant names prominently for easier identification.

- **User Images in Sidebar:**

  - Users' profile pictures are now visible in the sidebar for better visual representation.

- **Image Sharing in Conversations:**

  - Users can now share images seamlessly within individual or group chats.

- **Group Details Display:**

  - Added a dedicated section to view group details, including participants and group settings.

- **Dark Mode Enhancements:**
  - Improved dark mode usability with better contrast and readability adjustments.

## Project Structure
