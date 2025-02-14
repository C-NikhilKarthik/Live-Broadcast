// components/chat-room.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/auth-provider";
import { db } from "@/app/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { deleteBroadcast } from "@/utils/cleanup";

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Timestamp;
}

interface ChatRoomProps {
  broadcastId: string;
}

export default function ChatRoom({ broadcastId }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRoomActive, setIsRoomActive] = useState(true);
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check room status and handle expiration
  const [hasShownEndMessage, setHasShownEndMessage] = useState(false);

  // Replace the existing room status effect with this one
  useEffect(() => {
    if (!user) return;

    const broadcastRef = doc(db, "broadcasts", broadcastId);
    const unsubscribe = onSnapshot(broadcastRef, async (snap) => {
      if (!snap.exists()) {
        if (!hasShownEndMessage) {
          setHasShownEndMessage(true);
          setIsRoomActive(false);
          toast.error("This room has been closed");
          router.push("/");
        }
        return;
      }

      const data = snap.data();
      if (!data) return;

      // Check if user is participant
      if (!data.participants?.includes(user.uid)) {
        router.push("/");
        return;
      }

      // Check end time
      const roomEndTime = new Date(data.endTime);
      // setEndTime(roomEndTime);

      if (roomEndTime <= new Date()) {
        if (!hasShownEndMessage) {
          setHasShownEndMessage(true);
          setIsRoomActive(false);
          toast.error("This meeting has ended");

          // If owner, delete the room
          if (data.ownerId === user.uid) {
            await deleteBroadcast(broadcastId);
          }

          router.push("/");
        }
        return;
      }
    });

    // Remove the separate interval since we're handling everything in the snapshot listener
    return () => unsubscribe();
  }, [broadcastId, user, router, hasShownEndMessage]);

  // Listen for messages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "broadcasts", broadcastId, "messages"),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [broadcastId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, "broadcasts", broadcastId, "messages"), {
        userId: user.uid,
        userName: user.displayName,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleLeaveRoom = async () => {
    if (!user) return;
    try {
      const broadcastRef = doc(db, "broadcasts", broadcastId);
      const broadcastSnap = await getDoc(broadcastRef);
      if (!broadcastSnap.exists()) return;
      const broadcastData = broadcastSnap.data();
      if (broadcastData.ownerId === user.uid) {
        // If the current user is the owner, delete the broadcast.
        await deleteDoc(broadcastRef);
      } else if (broadcastData.participants) {
        // Otherwise, remove the user from the participants array.
        const updatedParticipants = broadcastData.participants.filter(
          (id: string) => id !== user.uid
        );
        await updateDoc(broadcastRef, { participants: updatedParticipants });
      }
      router.push("/");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        handleSendMessage(e);
      }
    }
  };

  if (!isRoomActive) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.userId === user?.uid ? "items-end" : "items-start"
              }`}
            >
              <span className="text-sm text-gray-400 mb-1 px-2">
                {message.userName}
              </span>
              <div
                className={`max-w-[80%] break-words ${
                  message.userId === user?.uid
                    ? "bg-gray-800 text-white"
                    : "bg-[#0a0a0a] text-white"
                } rounded-2xl border border-[#ffffff1f] px-4 py-2`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Bottom Section */}
      <div className="border-t border-gray-800 bg-primary">
        <form
          onSubmit={handleSendMessage}
          className="bg-[#141415] m-4 rounded-xl border border-[#ffffff1f]"
        >
          <div className="flex p-1 items-center">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              spellCheck="false"
              className="resize-none overflow-auto w-full flex-1 bg-transparent p-3 pb-1.5 text-sm outline-none ring-0 placeholder:text-gray-500"
              style={{
                height: "42px",
                minHeight: "42px",
                maxHeight: "384px",
              }}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-3 h-7 rounded-lg hover:bg-gray-800 transition-colors text-white font-medium text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14.6667 1.33334L7.33334 8.66667M14.6667 1.33334L10 14.6667L7.33334 8.66667M14.6667 1.33334L1.33334 6L7.33334 8.66667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
        <button
          onClick={handleLeaveRoom}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
