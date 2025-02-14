"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/auth-provider";
import { db } from "@/app/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  // doc,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import EditBroadcast from "./edit-broadcast";

interface Broadcast {
  id: string;
  activity: string;
  location: string;
  ownerId: string;
  ownerName: string;
  startTime: string;
  endTime: string;
  active: boolean;
  participants: string[];
}

interface RequestStatus {
  [broadcastId: string]: "pending" | "accepted" | "rejected" | null;
}

export default function BroadcastList() {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus>({});
  const router = useRouter();
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(
    null
  );

  // Fetch active broadcasts
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "broadcasts"), where("active", "==", true));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const broadcastsData: Broadcast[] = [];
      querySnapshot.forEach((docSnap) => {
        broadcastsData.push({ id: docSnap.id, ...docSnap.data() } as Broadcast);
      });
      setBroadcasts(broadcastsData);
    });
    return () => unsubscribe();
  }, [user]);

  // Check request status for each broadcast
  useEffect(() => {
    if (!user) return;

    const fetchRequestStatuses = async () => {
      const statuses: RequestStatus = {};

      for (const broadcast of broadcasts) {
        // Skip if user is the owner or already a participant
        if (
          broadcast.ownerId === user.uid ||
          broadcast.participants?.includes(user.uid)
        ) {
          continue;
        }

        // Check for existing request
        const requestsQuery = query(
          collection(db, "broadcasts", broadcast.id, "requests"),
          where("userId", "==", user.uid)
        );
        const requestsSnap = await getDocs(requestsQuery);

        if (!requestsSnap.empty) {
          const request = requestsSnap.docs[0].data();
          statuses[broadcast.id] = request.status;
        } else {
          statuses[broadcast.id] = null;
        }
      }

      setRequestStatuses(statuses);
    };

    fetchRequestStatuses();
  }, [broadcasts, user]);

  const handleJoin = async (broadcastId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "broadcasts", broadcastId, "requests"), {
        userId: user.uid,
        userName: user.displayName,
        status: "pending",
      });

      // Update local state immediately
      setRequestStatuses((prev) => ({
        ...prev,
        [broadcastId]: "pending",
      }));

      // Listen for status changes
      const requestsQuery = query(
        collection(db, "broadcasts", broadcastId, "requests"),
        where("userId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const request = snapshot.docs[0].data();
          setRequestStatuses((prev) => ({
            ...prev,
            [broadcastId]: request.status,
          }));

          if (request.status === "accepted") {
            router.push(`/chat/${broadcastId}`);
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error joining broadcast:", error);
    }
  };

  const getJoinButton = (broadcast: Broadcast) => {
    if (broadcast.ownerId === user?.uid) {
      return (
        <>
          <button
            onClick={() => router.push(`/chat/${broadcast.id}`)}
            className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Enter Chat
          </button>
          <span className="text-gray-400">Your Broadcast</span>;
        </>
      );
    }

    if (user?.uid && broadcast.participants?.includes(user.uid)) {
      return (
        <button
          onClick={() => router.push(`/chat/${broadcast.id}`)}
          className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Enter Chat
        </button>
      );
    }

    const status = requestStatuses[broadcast.id];

    switch (status) {
      case "pending":
        return <span className="text-yellow-500">Request Pending</span>;
      case "rejected":
        return <span className="text-red-500">Request Rejected</span>;
      case "accepted":
        return <span className="text-green-500">Request Accepted</span>;
      default:
        return (
          <button
            onClick={() => handleJoin(broadcast.id)}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Join Broadcast
          </button>
        );
    }
  };

  return (
    <div className="space-y-4">
      {broadcasts.map((broadcast) => (
        <div
          key={broadcast.id}
          className="border border-gray-700 p-4 rounded-lg bg-gray-800"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{broadcast.activity}</h3>
              <p className="text-gray-300">Location: {broadcast.location}</p>
              <p className="text-gray-300">Host: {broadcast.ownerName}</p>
              <div className="mt-2 text-gray-400">
                <p>Starts: {new Date(broadcast.startTime).toLocaleString()}</p>
                <p>Ends: {new Date(broadcast.endTime).toLocaleString()}</p>
              </div>
            </div>
            {broadcast.ownerId === user?.uid && (
              <button
                onClick={() => setEditingBroadcast(broadcast)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Edit
              </button>
            )}
          </div>
          <div className="mt-4">{getJoinButton(broadcast)}</div>
        </div>
      ))}

      {/* Edit Modal */}
      {editingBroadcast && (
        <EditBroadcast
          broadcast={editingBroadcast}
          onClose={() => setEditingBroadcast(null)}
        />
      )}
    </div>
  );
}
