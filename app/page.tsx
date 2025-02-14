"use client";

import Dashboard from "@/components/dashboard";
import Login from "@/components/login";
import { useAuth } from "./auth-provider";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="flex h-screen flex-col items-center justify-center p-24">
      {user ? <Dashboard /> : <Login />}
    </main>
  );
}
