"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { CATS, SUBCATS, AREAS, areaPos, inDateBucket, type EventRow, type CategoryId } from "@/lib/data";

// Leaflet touches `window`, so it must be client-only, loaded after mount.
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const TODAY = new Date("2026-09-23");
const DATE_OPTIONS = [
  ["all", "All dates"],
  ["today", "Today/Tmrw"],
  ["week", "This week"],
  ["weekend", "This weekend"],
] as const;

export default function HomePage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(new Set(CATS.map((c) => c.id)));
  const [activeSubs, setActiveSubs] = useState<Set<string>>(
    new Set(CATS.flatMap((c) => SUBCATS[c.id].map((s) => `${c.id}|${s}`)))
  );
  const [activeDate, setActiveDate] = useState<string>("all");
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState<EventRow | null>(null);

  async function loadEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .order("start_date", { ascending: true });
    if (!error && data) setEvents(data as EventRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const visibleEvents = useMemo(() => {
    const all = justSubmitted ? [...events, justSubmitted] : events;
    return all.map((ev) => ({
      ev,
      visible:
        activeCats.has(ev.category) &&
        activeSubs.has(`${ev.category}|${ev.sub_category}`) &&
        (ev.status === "pending" || inDateBucket(ev.start_date, activeDate, TODAY)),
    }));
  }, [events, justSubmitted, activeCats, activeSubs, activeDate]);

  function toggleCat(id: CategoryId) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSub(key: string) {
    setActiveSubs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = new FormData(formEvent.currentTarget);
    const category = form.get("category") as CategoryId;
    const sub_category = form.get("sub_category") as string;
    const area = form.get("area") as string;
    const pos = areaPos(area);

    const payload = {
      title: form.get("title") as string,
      description: (form.get("description") as string) || "No description provided yet.",
      category,
      sub_category,
      venue_name: form.get("venue") as string,
      area,
      latitude: pos.lat,
      longitude: pos.lng,
      start_date: form.get("date") as string,
      start_time: form.get("time") as string,
      organizer_name: form.get("organizer") as string,
      format: (form.get("format") as string) || "Details TBC",
      tags: ["Just added"],
      rsvp_url: (form.get("rsvp") as string) || null,
      status: "pending" as const,
    };

    const { error } = await supabase.from("events").insert(payload);
    if (error) {
      alert("Couldn't submit — " + error.message);
      return;
    }

    // We don't read the row back from Supabase: the SELECT policy only
    // allows status='approved' rows, so a just-inserted 'pending' row can't
    // be re-fetched yet. Show it locally with an optimistic object instead.
    const data: EventRow = {
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payload,
    };

    // Make sure the new pin's category/sub-category are switched on so it's visible immediately
    setActiveCats((prev) => new Set(prev).add(category));
    setActiveSubs((prev) => new Set(prev).add(`${category}|${sub_category}`));
    setJustSubmitted(data as EventRow);
    setModalOpen(false);
    setSelected(data as EventRow);
    formEvent.currentTarget.reset();
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-2.5 border-b border-line bg-panel">
        <div>
          <h1 className="text-[17px] font-semibold m-0 mb-0.5">📍 Nearby.Events</h1>
          <p className="text-[12.5px] text-sub m-0">Local events near you — Pune</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="shrink-0 bg-ink text-bg rounded-lg px-3 py-2 text-[12.5px] font-semibold whitespace-nowrap"
        >
          + List your event
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-line bg-panel">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => toggleCat(c.id)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] whitespace-nowrap border"
            style={{
              background: activeCats.has(c.id) ? "var(--ink)" : "var(--bg)",
              color: activeCats.has(c.id) ? "var(--bg)" : "var(--ink)",
              borderColor: activeCats.has(c.id) ? "var(--ink)" : c.color,
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 px-4 pb-2 bg-panel">
        {DATE_OPTIONS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveDate(id)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11.5px] border"
            style={{
              background: activeDate === id ? "var(--ink)" : "var(--bg)",
              color: activeDate === id ? "var(--bg)" : "var(--ink)",
              borderColor: "var(--line)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 border-b border-line bg-panel">
        {CATS.filter((c) => activeCats.has(c.id)).flatMap((c) =>
          SUBCATS[c.id].map((s) => {
            const key = `${c.id}|${s}`;
            return (
              <button
                key={key}
                onClick={() => toggleSub(key)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] border opacity-90"
                style={{
                  background: activeSubs.has(key) ? "var(--ink)" : "var(--bg)",
                  color: activeSubs.has(key) ? "var(--bg)" : "var(--ink)",
                  borderColor: "var(--line)",
                }}
              >
                {s}
              </button>
            );
          })
        )}
      </div>

      <main className="flex-1 relative overflow-hidden flex">
        <div className="flex-1 relative" style={{ background: "var(--map)" }}>
          <MapView events={visibleEvents} onSelect={setSelected} />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sub text-sm pointer-events-none">
              Loading events…
            </div>
          )}
        </div>

        {selected && (
          <div className="w-[340px] max-w-[88vw] shrink-0 bg-panel border-l border-line overflow-y-auto">
            <EventCard event={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </main>

      <div className="text-[11px] text-sub px-4 py-1.5 border-t border-line bg-panel">
        {events.length} approved events • click a pin • filter by category, sub-category, or date
      </div>

      {modalOpen && (
        <ListEventModal onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />
      )}
    </div>
  );
}

function EventCard({ event, onClose }: { event: EventRow; onClose: () => void }) {
  const cat = CATS.find((c) => c.id === event.category);
  const dateFmt = new Date(event.start_date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return (
    <div className="p-[18px]">
      <button className="float-right text-lg text-sub" onClick={onClose}>
        ✕
      </button>
      <span
        className="inline-block text-[11px] px-2 py-1 rounded-full text-white mb-2 mr-1.5"
        style={{ background: cat?.color }}
      >
        {cat?.name}
      </span>
      <span className="inline-block text-[11px] px-2 py-1 rounded-full border border-line text-sub mb-2">
        {event.sub_category}
      </span>
      <h2 className="text-[17px] m-0 mb-1.5">{event.title}</h2>
      <div className="text-[13px] text-sub">📅 {dateFmt} · {event.start_time}</div>
      <div className="text-[13px] text-sub">📍 {event.venue_name}, {event.area}</div>
      <div className="text-[13px] text-sub">👤 {event.organizer_name}</div>
      {event.status === "pending" && (
        <div className="text-[11.5px] mt-2" style={{ color: "#c98a2b" }}>
          ⏳ Pending review (just submitted)
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 my-2.5">
        {(event.tags ?? []).map((t) => (
          <span key={t} className="text-[11px] px-2 py-1 border border-line rounded text-sub">
            {t}
          </span>
        ))}
        <span className="text-[11px] px-2 py-1 border border-line rounded text-sub">{event.format}</span>
      </div>
      <div className="text-[13.5px] leading-relaxed my-3">{event.description}</div>
      <a
        href={event.rsvp_url ?? "#"}
        target={event.rsvp_url ? "_blank" : "_self"}
        rel="noreferrer"
        onClick={(e) => {
          if (!event.rsvp_url) {
            e.preventDefault();
            alert("This event has no RSVP link yet.");
          }
        }}
        className="block text-center mt-4 py-2.5 rounded-lg text-white font-semibold"
        style={{ background: "var(--accent)" }}
      >
        RSVP externally →
      </a>
    </div>
  );
}

function ListEventModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [category, setCategory] = useState<CategoryId>(CATS[0].id);
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-2xl max-w-[440px] w-full max-h-[86vh] overflow-y-auto p-5">
        <button className="float-right text-lg text-sub" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-base font-semibold m-0 mb-1">List your event</h2>
        <p className="text-xs text-sub mb-4">
          Submitted events are reviewed before they go live on the public map.
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Field label="Event name">
            <input name="title" required placeholder="e.g. Sunday Pottery Circle" className="input" />
          </Field>
          <div className="flex gap-2.5">
            <Field label="Category">
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="input"
              >
                {CATS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sub-category">
              <select name="sub_category" className="input">
                {SUBCATS[category].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex gap-2.5">
            <Field label="Date">
              <input name="date" type="date" required min="2026-09-23" className="input" />
            </Field>
            <Field label="Time">
              <input name="time" required placeholder="6:00 PM" className="input" />
            </Field>
          </div>
          <Field label="Venue">
            <input name="venue" required placeholder="Venue name" className="input" />
          </Field>
          <Field label="Area">
            <select name="area" className="input">
              {AREAS.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Organizer name">
            <input name="organizer" required placeholder="Your name or group" className="input" />
          </Field>
          <Field label="Format">
            <input name="format" placeholder="Free / ₹300 · RSVP required" className="input" />
          </Field>
          <Field label="Description">
            <textarea name="description" placeholder="What should people expect?" className="input min-h-[60px]" />
          </Field>
          <Field label="RSVP link (optional)">
            <input name="rsvp" placeholder="https://..." className="input" />
          </Field>
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-[13.5px] font-semibold border border-line"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-[13.5px] font-semibold bg-ink text-bg"
            >
              Submit for review
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          padding: 9px 10px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--ink);
          font-size: 13.5px;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1">
      <span className="block text-[12.5px] font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
