# Spontaneous Meetup

A real-time chat application that allows users to create and join spontaneous meetups. Built with Next.js, Firebase, and TypeScript.

## Features

- 🔐 Google Authentication
- 📢 Create and join broadcasts (meetups)
- 💬 Real-time chat functionality
- 👥 Request/Accept/Reject join system
- 🌓 Dark mode interface
- 📱 Responsive design

## How It Works

### User Flow

1. **Authentication**

   - Users sign in using their Google account
   - Authentication state persists across sessions

2. **Creating a Meetup**

   - Users can create a new broadcast by specifying:
     - Activity name
     - Location
     - Start and end times
   - The creator automatically becomes the owner

3. **Joining Meetups**

   - Users can see all active broadcasts on the dashboard
   - To join a meetup:
     - Send a join request
     - Wait for owner's approval
     - Once approved, gain access to the chat room

4. **Chat Room**
   - Real-time messaging with all participants
   - Messages show sender's name and timestamp
   - Auto-scroll to latest messages
   - Leave room option
   - Room automatically closes at scheduled end time

### Key Features

- **Time Management**

  - Broadcasts have defined start and end times
  - Automatic cleanup of expired meetups
  - Real-time countdown for participants

- **Access Control**

  - Owner can accept/reject join requests
  - Only approved participants can access chat
  - Owner can end broadcast at any time

- **Real-time Updates**
  - Instant message delivery
  - Live participant status
  - Immediate request notifications

### Data Flow

1. User creates/joins a broadcast
2. Firestore stores broadcast details
3. Real-time listeners update UI
4. Messages sync across all participants
5. Automatic cleanup when broadcast ends

## Live Demo

[View Live Demo](https://live-broadcast.vercel.app/)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: React Context
- **Real-time Updates**: Firebase Listeners
- **Hosting**: Vercel

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

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/C-NikhilKarthik/Live-Broadcast
cd Live-Broadcast
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:

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

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Google provider)
3. Create a Firestore database
4. Set up Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /broadcasts/{broadcastId} {
      allow read: if true;
      allow write: if request.auth != null;

      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }

      match /requests/{requestId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## Deployment

This project is deployed on Vercel. To deploy your own instance:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
vercel --prod
```

## CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- Automated builds on push to main branch
- TypeScript type checking
- ESLint code quality checks
- Automated deployment to Vercel

## Testing

Run tests using:

```bash
npm run test
```

## Database Schema

### Broadcasts Collection

```typescript
interface Broadcast {
  id: string;
  activity: string;
  location: string;
  ownerId: string;
  ownerName: string;
  startTime: string;
  endTime: string;
  participants: string[];
  active: boolean;
}
```

### Messages Collection

```typescript
interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Timestamp;
}
```
