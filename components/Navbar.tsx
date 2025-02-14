// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/auth-provider";
import { db } from "@/app/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/app/firebase";

interface Request {
  id: string;
  broadcastId: string;
  userId: string;
  userName: string;
  status: "pending" | "accepted" | "rejected";
}

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Query broadcasts where current user is owner
    const broadcastsQuery = query(
      collection(db, "broadcasts"),
      where("ownerId", "==", user.uid)
    );

    // First listener for broadcasts
    const unsubscribeBroadcasts = onSnapshot(
      broadcastsQuery,
      (broadcastsSnapshot) => {
        // Array to store all unsubscribe functions for requests
        const requestUnsubscribes: (() => void)[] = [];

        broadcastsSnapshot.docs.forEach((broadcastDoc) => {
          // For each broadcast, set up a listener for its requests
          const requestsQuery = query(
            collection(db, "broadcasts", broadcastDoc.id, "requests"),
            where("status", "==", "pending")
          );

          const unsubscribeRequests = onSnapshot(
            requestsQuery,
            (requestsSnapshot) => {
              const newRequests = requestsSnapshot.docs.map(
                (reqDoc) =>
                  ({
                    id: reqDoc.id,
                    broadcastId: broadcastDoc.id,
                    ...reqDoc.data(),
                  } as Request)
              );

              // Update requests state, maintaining existing requests from other broadcasts
              setRequests((prev) => {
                const otherBroadcastRequests = prev.filter(
                  (r) => r.broadcastId !== broadcastDoc.id
                );
                return [...otherBroadcastRequests, ...newRequests];
              });
            }
          );

          requestUnsubscribes.push(unsubscribeRequests);
        });

        // Return cleanup function
        return () => {
          requestUnsubscribes.forEach((unsubscribe) => unsubscribe());
        };
      }
    );

    // Cleanup function for the main broadcast listener
    return () => {
      unsubscribeBroadcasts();
    };
  }, [user]);

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
    <nav className="bg-primary w-full text-white p-4 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Desktop and Mobile Layout */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Spontaneous Meetup</h1>

          {/* Hamburger Menu Button (Mobile) */}
          {user && (
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}

          {/* Desktop Menu */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <Image
                height={0}
                width={0}
                sizes="100%"
                src={user.photoURL || "/default-profile.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />

              <div className="relative">
                <button
                  onClick={() => setShowRequests(!showRequests)}
                  className="bg-gray-800 p-2 rounded-md px-4 hover:bg-gray-700"
                >
                  Requests {requests.length > 0 && `(${requests.length})`}
                </button>

                {showRequests && requests.length > 0 && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl p-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-2 border-b border-gray-700"
                      >
                        <span className="text-white">{request.userName}</span>
                        <div className="space-x-2">
                          <button
                            onClick={() =>
                              handleAccept(request.broadcastId, request)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleReject(request.broadcastId, request.id)
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4">
            <div className="flex items-center space-x-4 pb-4">
              <Image
                height={0}
                width={0}
                sizes="100%"
                src={user.photoURL || "/default-profile.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span>{user.displayName}</span>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowRequests(!showRequests)}
                className="w-full bg-gray-800 p-2 rounded-md px-4 hover:bg-gray-700 text-left"
              >
                Requests {requests.length > 0 && `(${requests.length})`}
              </button>

              {showRequests && requests.length > 0 && (
                <div className="bg-gray-800 rounded-lg shadow-xl p-4 mt-2">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col space-y-2 p-2 border-b border-gray-700"
                    >
                      <span className="text-white">{request.userName}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleAccept(request.broadcastId, request)
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleReject(request.broadcastId, request.id)
                          }
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
