// app/chat/[id]/page.tsx
"use client";

import ChatRoom from "@/components/chat-room";
import { useAuth } from "@/app/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <ChatRoom broadcastId={params.id} />
      </main>
    </div>
  );
}
