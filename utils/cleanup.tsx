// utils/cleanup.ts
import { db } from "@/app/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export const deleteBroadcast = async (broadcastId: string) => {
  try {
    // Delete all messages
    const messagesRef = collection(db, "broadcasts", broadcastId, "messages");
    const messagesSnapshot = await getDocs(messagesRef);
    await Promise.all(messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

    // Delete all requests
    const requestsRef = collection(db, "broadcasts", broadcastId, "requests");
    const requestsSnapshot = await getDocs(requestsRef);
    await Promise.all(requestsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

    // Delete the broadcast itself
    await deleteDoc(doc(db, "broadcasts", broadcastId));
  } catch (error) {
    console.error("Error deleting broadcast:", error);
  }
};
