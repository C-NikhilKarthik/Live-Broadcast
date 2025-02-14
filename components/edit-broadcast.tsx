// components/edit-broadcast.tsx
"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/firebase";
import { toast } from "react-hot-toast";

interface EditBroadcastProps {
  broadcast: {
    id: string;
    activity: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  onClose: () => void;
}

export default function EditBroadcast({
  broadcast,
  onClose,
}: EditBroadcastProps) {
  // Convert ISO string to local datetime-local format
  const toLocalDateTimeString = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    activity: broadcast.activity,
    location: broadcast.location,
    startTime: toLocalDateTimeString(broadcast.startTime),
    endTime: toLocalDateTimeString(broadcast.endTime),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(formData.startTime);
    const endDateTime = new Date(formData.endTime);
    const now = new Date();
    const originalStartTime = new Date(broadcast.startTime);

    if (
      startDateTime < now &&
      startDateTime.getTime() !== originalStartTime.getTime()
    ) {
      toast.error("Start time cannot be in the past");
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      await updateDoc(doc(db, "broadcasts", broadcast.id), {
        activity: formData.activity,
        location: formData.location,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      toast.success("Broadcast updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating broadcast:", error);
      toast.error("Failed to update broadcast");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Broadcast</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Activity</label>
            <input
              type="text"
              name="activity"
              value={formData.activity}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 rounded p-2 text-white"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
            >
              Update
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
