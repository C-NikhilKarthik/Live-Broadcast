// components/create-broadcast.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/app/auth-provider";
import { db } from "@/app/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreateBroadcast() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    activity: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      alert("End time must be after start time");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "broadcasts"), {
        activity: formData.activity,
        location: formData.location,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        ownerId: user.uid,
        ownerName: user.displayName,
        createdAt: new Date().toISOString(),
        active: true,
        participants: [user.uid],
      });
      router.push(`/chat/${docRef.id}`);
    } catch (error) {
      console.error("Error creating broadcast:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <div className="border-t border-t-slate-600 py-6">
          <label className="block text-lg mb-2">
            What activity are you planning?
          </label>
          <input
            type="text"
            name="activity"
            value={formData.activity}
            onChange={handleChange}
            required
            className="w-full bg-transparent border border-slate-600 rounded p-2"
            placeholder="e.g., Basketball, Coffee, Study group..."
          />
        </div>

        <div className="border-t border-t-slate-600 py-6">
          <label className="block text-lg mb-2">
            Where will this take place?
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full bg-transparent border border-slate-600 rounded p-2"
            placeholder="Enter location"
          />
        </div>

        <div className="border-t border-t-slate-600 py-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border border-slate-600 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-lg mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full bg-transparent border border-slate-600 rounded p-2"
            />
          </div>
        </div>

        <div className="border-t border-t-slate-600 py-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={formData.startDate || new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border border-slate-600 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-lg mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full bg-transparent border border-slate-600 rounded p-2"
            />
          </div>
        </div>

        <div className="border-t border-t-slate-600 py-6">
          <button
            type="submit"
            className="bg-white w-full hover:bg-slate-100 text-black font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Create Broadcast
          </button>
        </div>
      </form>
    </div>
  );
}
