import { NextRequest, NextResponse } from "next/server";

// Converts a free-text address ("venue, area, Pune") into precise
// latitude/longitude using OpenStreetMap's free Nominatim geocoder.
// Runs server-side (not in the browser) so we can set a proper
// identifying User-Agent, per Nominatim's usage policy, and keep this
// logic in one place. No API key needed — it's a free public service.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "in");
  // Rough bounding box around Pune (left, top, right, bottom) so results
  // stay local even if the venue name is ambiguous elsewhere in India.
  url.searchParams.set("viewbox", "73.72,18.65,73.98,18.42");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "NearbyEventsPune/1.0 (local events discovery prototype)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ found: false });
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ found: false });
    }

    const { lat, lon } = data[0];
    return NextResponse.json({ found: true, lat: parseFloat(lat), lon: parseFloat(lon) });
  } catch {
    // Geocoding is a nice-to-have, not critical — the caller falls back
    // to the area's approximate center if this fails for any reason.
    return NextResponse.json({ found: false });
  }
}
