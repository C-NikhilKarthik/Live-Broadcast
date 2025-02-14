"use client";

import Dashboard from "@/components/dashboard";
import Login from "@/components/login";
import { useAuth } from "./auth-provider";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center pt-24 px-4">
      {user ? <Dashboard /> : <Login />}
    </main>
  );
}
