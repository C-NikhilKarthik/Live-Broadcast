"use client";

import { useState } from "react";
import { useAuth } from "@/app/auth-provider";
import CreateBroadcast from "./create-broadcast";
import BroadcastList from "./broadcast-list";

export default function Dashboard() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center w-full">
          Welcome, {user?.displayName}!
        </h1>
      </div>
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Broadcast
        </button>
        <button
          onClick={() => setShowCreate(false)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Join Broadcast
        </button>
      </div>
      {showCreate ? <CreateBroadcast /> : <BroadcastList />}
    </div>
  );
}
