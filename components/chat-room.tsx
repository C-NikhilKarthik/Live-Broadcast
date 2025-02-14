"use client";

import { useState, useEffect } from "react";
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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DocumentData, Timestamp } from "firebase/firestore";

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
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // const [isLoading, setIsLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const router = useRouter();

  // Check if the current user is part of the broadcast
  useEffect(() => {
    const checkParticipation = async () => {
      // if (!user) {
      //   setIsLoading(false);
      //   return;
      // }

      try {
        const broadcastRef = doc(db, "broadcasts", broadcastId);
        const unsubscribe = onSnapshot(broadcastRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as DocumentData;
            if (data.participants && data.participants.includes(user?.uid)) {
              setIsParticipant(true);
            } else {
              router.push("/");
            }
          } else {
            router.push("/");
          }
          // setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error checking participation:", error);
        // setIsLoading(false);
      }
    };

    checkParticipation();
  }, [broadcastId, user, router]);

  // Listen for incoming chat messages
  useEffect(() => {
    if (!user || !isParticipant) return;

    const q = query(
      collection(db, "broadcasts", broadcastId, "messages"),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((docSnap) => {
        messagesData.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [broadcastId, user, isParticipant]);

  // Check if the current user is part of the broadcast.
  // useEffect(() => {
  //   const checkParticipation = async () => {
  //     const broadcastRef = doc(db, "broadcasts", broadcastId);
  //     const snap = await getDoc(broadcastRef);
  //     if (snap.exists()) {
  //       const data = snap.data() as DocumentData;
  //       console.log("Broadcast data:", data);
  //       if (!data.participants || !data.participants.includes(user?.uid)) {
  //         // User is not a participant, so redirect them out.
  //         router.push("/");
  //       }
  //     }
  //   };

  //   if (user) {
  //     checkParticipation();
  //   }
  // }, [broadcastId, user, router]);

  // Listen for incoming chat messages.
  // useEffect(() => {
  //   if (!user) return;

  //   const q = query(
  //     collection(db, "broadcasts", broadcastId, "messages"),
  //     orderBy("timestamp")
  //   );
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const messagesData: Message[] = [];
  //     snapshot.forEach((docSnap) => {
  //       messagesData.push({ id: docSnap.id, ...docSnap.data() } as Message);
  //     });
  //     setMessages(messagesData);
  //   });

  //   return () => unsubscribe();
  // }, [broadcastId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, "broadcasts", broadcastId, "messages"), {
        userId: user.uid,
        userName: user.displayName,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || !isParticipant) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen h-full pt-20">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
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
      </div>
      <form
        onSubmit={handleSendMessage}
        className="bg-[#141415] mx-4 relative z-10 rounded-xl border border-[#ffffff1f]"
      >
        <div className="flex p-1 items-center">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (newMessage.trim()) {
                  handleSendMessage(e);
                }
              }
            }}
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
            className="inline-flex items-center justify-center px-3 h-7 rounded-lg transition-colors text-white font-medium text-sm hover:bg-gray-800"
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
        className="bg-red-500 text-white px-4 py-2 rounded m-4"
      >
        Leave Room
      </button>
    </div>
  );
}
