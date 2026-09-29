"use client";

import { useState } from "react";
import type { EventRow } from "@/lib/data";

// NOTE: this is a demo-grade gate — the secret is typed client-side and
// sent as a header, checked against process.env.ADMIN_SECRET on the server
// (see app/api/admin/events/route.ts). Good enough to keep this page out of
// casual reach; for real production use, swap this for Supabase Auth.
export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function unlock() {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/events", { headers: { "x-admin-secret": secret } });
    if (res.status === 401) {
      setErr("Wrong secret.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setUnlocked(true);
    setLoading(false);
  }

  async function decide(id: string, status: "approved" | "rejected") {
    await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ id, status }),
    });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto mt-24 px-4">
        <h1 className="text-lg font-semibold mb-2">Admin — moderation queue</h1>
