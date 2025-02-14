"use client";

import { useState } from "react";
import { useAuth } from "@/app/auth-provider";
import { db } from "@/app/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreateBroadcast() {
  const { user } = useAuth();
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, "broadcasts"), {
        activity,
        location,
        ownerId: user.uid,
        ownerName: user.displayName,
        createdAt: new Date(),
        active: true,
        participants: [user.uid],
      });
      setActivity("");
      setLocation("");
      router.push(`/chat/${docRef.id}`);
    } catch (error) {
      console.error("Error creating broadcast:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="w-full border-t border-t-slate-600 py-10">
          <div className="val flex w-full text-[1.3rem]">
            <div className="flex flex-col w-full">
              <div className="mb-4">What activity are you planning?</div>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                required
                className="placeholder:text-gray-700 border-none outline-none focus:outline-none bg-transparent w-full text-white"
                placeholder="e.g., Basketball, Coffee, Study group... *"
              />
            </div>
          </div>
        </div>

        <div className="w-full border-t border-t-slate-600 py-10">
          <div className="val flex w-full text-[1.3rem]">
            <div className="flex flex-col w-full">
              <div className="mb-4">Where will this take place?</div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="placeholder:text-gray-700 border-none outline-none focus:outline-none bg-transparent w-full text-white"
                placeholder="Enter location *"
              />
            </div>
          </div>
        </div>

        <div className="w-full border-t border-t-slate-600 py-10">
          <button
            type="submit"
            className="bg-white hover:bg-slate-100 text-black font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Create Broadcast
          </button>
        </div>
      </form>
    </div>
  );
}
