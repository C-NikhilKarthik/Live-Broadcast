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
  doc,
  updateDoc,
  getDocs,
  arrayUnion,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface Broadcast {
  id: string;
  activity: string;
  location: string;
  ownerId: string;
  ownerName: string;
}

export interface Request {
  id: string;
  userId: string;
  userName: string;
  status: "pending" | "accepted" | "rejected";
}

export default function BroadcastList() {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [requests, setRequests] = useState<{ [key: string]: Request[] }>({});
  const [showRequests, setShowRequests] = useState(false);
  const router = useRouter();

  // Fetch active broadcasts.
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

  // For each broadcast owned by the current user, fetch pending join requests.
  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const requestsData: { [key: string]: Request[] } = {};
      for (const broadcast of broadcasts) {
        if (broadcast.ownerId === user.uid) {
          const q = query(
            collection(db, "broadcasts", broadcast.id, "requests"),
            where("status", "==", "pending")
          );
          const querySnapshot = await getDocs(q);
          requestsData[broadcast.id] = querySnapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Request)
          );
        }
      }
      setRequests(requestsData);
    };
    fetchRequests();
  }, [broadcasts, user]);

  // When a non-owner clicks Join, create a join request.
  // Then listen for changes on the broadcast document's participants array.
  const handleJoin = async (broadcastId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "broadcasts", broadcastId, "requests"), {
        userId: user.uid,
        userName: user.displayName,
        status: "pending",
      });
      alert("Join request sent!");

      // Instead of listening on the join request document,
      // listen on the broadcast document for added participants.
      const broadcastRef = doc(db, "broadcasts", broadcastId);
      const unsubscribe = onSnapshot(broadcastRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.participants && data.participants.includes(user.uid)) {
          unsubscribe();
          router.push(`/chat/${broadcastId}`);
        }
      });
    } catch (error) {
      console.error("Error joining broadcast:", error);
    }
  };

  // Owner accepts a join request: update request status and add joiner to participants.
  // const handleAccept = async (broadcastId: string, request: Request) => {
  //   try {
  //     await updateDoc(
  //       doc(db, "broadcasts", broadcastId, "requests", request.id),
  //       { status: "accepted" }
  //     );
  //     await updateDoc(doc(db, "broadcasts", broadcastId), {
  //       participants: arrayUnion(request.userId),
  //     });
  //     // Do not force a redirection on the owner.
  //   } catch (error) {
  //     console.error("Error accepting request:", error);
  //   }
  // };

  const handleAccept = async (broadcastId: string, request: Request) => {
    try {
      // Update request status
      await updateDoc(
        doc(db, "broadcasts", broadcastId, "requests", request.id),
        { status: "accepted" }
      );

      // Add user to participants
      await updateDoc(doc(db, "broadcasts", broadcastId), {
        participants: arrayUnion(request.userId),
      });

      // The user will be automatically redirected when they detect
      // they've been added to participants
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleReject = async (broadcastId: string, requestId: string) => {
    try {
      await updateDoc(
        doc(db, "broadcasts", broadcastId, "requests", requestId),
        { status: "rejected" }
      );
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div className="space-y-4">
      {broadcasts.map((broadcast) => (
        <div key={broadcast.id} className="border p-4 rounded">
          <h3 className="text-xl font-bold">{broadcast.activity}</h3>
          <p>Location: {broadcast.location}</p>
          <p>Host: {broadcast.ownerName}</p>
          {user?.uid !== broadcast.ownerId && (
            <button
              onClick={() => handleJoin(broadcast.id)}
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Join Broadcast
            </button>
          )}
          {user?.uid === broadcast.ownerId && (
            <div className="mt-4">
              <button
                onClick={() => setShowRequests(!showRequests)}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                {showRequests ? "Hide Requests" : "Show Requests"}
              </button>
              {showRequests &&
                requests[broadcast.id] &&
                requests[broadcast.id].length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-bold">Join Requests:</h4>
                    {requests[broadcast.id].map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center space-x-2 mt-2"
                      >
                        <span>{request.userName}</span>
                        <button
                          onClick={() => handleAccept(broadcast.id, request)}
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(broadcast.id, request.id)}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
