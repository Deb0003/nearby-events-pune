export type CategoryId = "pro" | "sport" | "well" | "arts" | "gen" | "learn" | "social";

export const CATS: { id: CategoryId; name: string; color: string }[] = [
  { id: "pro", name: "Startup", color: "#3b6ea5" },
  { id: "sport", name: "Sports", color: "#2f9e44" },
  { id: "well", name: "Wellness", color: "#8e6bbf" },
  { id: "arts", name: "Arts", color: "#d1495b" },
  { id: "gen", name: "Meetups", color: "#c98a2b" },
  { id: "learn", name: "Learning", color: "#3aa6a0" },
  { id: "social", name: "Social Cause", color: "#b5541c" },
];

export const SUBCATS: Record<CategoryId, string[]> = {
  pro: ["Pitch Night", "Panel/Talk", "Hackathon", "Demo Day", "Networking Mixer"],
  sport: ["Football", "Cycling", "Badminton", "Running", "Cricket"],
  well: ["Yoga", "Meditation", "Breathwork", "Therapy Circle"],
  arts: ["Open Mic", "Live Music", "Poetry", "Art Workshop", "Book Club"],
  gen: ["Board Games", "Language Exchange", "Hobby Club"],
  learn: ["Workshop", "Talk", "Study Group"],
  social: ["Volunteering", "Awareness Drive", "Cleanup Drive"],
};

// Rough illustrative x/y (%) positions for areas on the placeholder map.
// Once real lat/long is geocoded, swap this for an actual map library.
export const AREAS: { name: string; x: number; y: number; lat: number; lng: number }[] = [
  { name: "Baner", x: 14, y: 30, lat: 18.559, lng: 73.7868 },
  { name: "Aundh", x: 20, y: 38, lat: 18.5613, lng: 73.807 },
  { name: "Kothrud", x: 22, y: 58, lat: 18.5074, lng: 73.8077 },
  { name: "Deccan", x: 34, y: 52, lat: 18.5158, lng: 73.8412 },
  { name: "Camp", x: 48, y: 56, lat: 18.5122, lng: 73.8792 },
  { name: "Koregaon Park", x: 54, y: 48, lat: 18.5362, lng: 73.8938 },
  { name: "Viman Nagar", x: 70, y: 38, lat: 18.5679, lng: 73.9143 },
  { name: "Kalyani Nagar", x: 64, y: 44, lat: 18.549, lng: 73.902 },
  { name: "Hinjewadi", x: 6, y: 20, lat: 18.5908, lng: 73.7392 },
  { name: "Hadapsar", x: 66, y: 70, lat: 18.5089, lng: 73.9260 },
  { name: "Magarpatta", x: 60, y: 66, lat: 18.5158, lng: 73.9280 },
  { name: "FC Road", x: 38, y: 44, lat: 18.5236, lng: 73.8408 },
];

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  category: CategoryId;
  sub_category: string;
  venue_name: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  start_time: string;
  organizer_name: string;
  format: string | null;
  tags: string[] | null;
  rsvp_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function areaPos(area: string) {
  return AREAS.find((a) => a.name === area) ?? { x: 50, y: 50, lat: 18.5204, lng: 73.8567 };
}

export function inDateBucket(dateStr: string, bucket: string, today: Date) {
  const d = new Date(dateStr);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (bucket === "all") return true;
  if (bucket === "today") return diffDays === 0 || diffDays === 1;
  if (bucket === "week") return diffDays >= 0 && diffDays <= 7;
  if (bucket === "weekend") {
    const day = d.getDay();
    return diffDays >= 0 && diffDays <= 7 && (day === 0 || day === 6);
  }
  return true;
}
