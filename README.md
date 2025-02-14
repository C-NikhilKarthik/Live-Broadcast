# Spontaneous Meetup

A real-time chat application that allows users to create and join spontaneous meetups. Built with Next.js, Firebase, and TypeScript.

## Features

- 🔐 Google Authentication
- 📢 Create and join broadcasts (meetups)
- 💬 Real-time chat functionality
- 👥 Request/Accept/Reject join system
- 🌓 Dark mode interface
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: React Context
- **Real-time Updates**: Firebase Listeners

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/C-NikhilKarthik/Live-Broadcast
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:

```bash
npm run dev
```

## Project Structure

```
├── app/
│   ├── auth-provider.tsx    # Authentication context
│   ├── firebase.ts         # Firebase configuration
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── broadcast-list.tsx  # List of available broadcasts
│   ├── chat-room.tsx      # Chat interface
│   ├── create-broadcast.tsx# Broadcast creation form
│   ├── dashboard.tsx      # User dashboard
│   ├── login.tsx          # Login component
│   └── navbar.tsx         # Navigation bar
└── types/
    └── index.ts           # TypeScript interfaces
```

## Features in Detail

### Authentication

- Google Sign-in integration
- Persistent authentication state
- Protected routes

### Broadcasts

- Create new meetup broadcasts
- Join existing broadcasts
- Real-time updates for broadcast status

### Chat System

- Real-time messaging
- Message history
- Participant management
- Leave chat functionality

### Request System

- Send join requests
- Accept/reject requests
- Real-time request notifications

## Firebase Structure

```
├── broadcasts/
│   └── [broadcastId]/
│       ├── activity
│       ├── location
│       ├── ownerId
│       ├── ownerName
│       ├── participants[]
│       ├── active
│       └── requests/
│           └── [requestId]/
│               ├── userId
│               ├── userName
│               └── status
└── messages/
    └── [messageId]/
        ├── text
        ├── userId
        ├── userName
        └── timestamp
```
