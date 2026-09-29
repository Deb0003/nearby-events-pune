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
        <p className="text-sm text-sub mb-4">Enter the admin secret to view pending events.</p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
          className="w-full px-3 py-2 rounded-lg border border-line mb-2 bg-panel"
        />
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <button
          onClick={unlock}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-ink text-bg font-semibold"
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-lg font-semibold mb-1">Pending events ({events.length})</h1>
      <p className="text-sm text-sub mb-6">Approve or reject events submitted through the public form.</p>
      {events.length === 0 && <p className="text-sm text-sub">Nothing pending right now.</p>}
      <div className="flex flex-col gap-3">
        {events.map((ev) => (
          <div key={ev.id} className="border border-line rounded-xl p-4 bg-panel">
            <div className="font-semibold">{ev.title}</div>
            <div className="text-sm text-sub">
              {ev.category} / {ev.sub_category} · {ev.start_date} {ev.start_time}
            </div>
            <div className="text-sm text-sub">{ev.venue_name}, {ev.area}</div>
            <div className="text-sm text-sub">Organizer: {ev.organizer_name}</div>
            <p className="text-sm mt-2">{ev.description}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => decide(ev.id, "approved")}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#2f9e44" }}
              >
                Approve
              </button>
              <button
                onClick={() => decide(ev.id, "rejected")}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#b5541c" }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
