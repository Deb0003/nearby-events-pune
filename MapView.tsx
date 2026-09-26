"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { CATS, type EventRow, type CategoryId } from "@/lib/data";

const catMap = Object.fromEntries(CATS.map((c) => [c.id, c]));

// Colored teardrop pin as a divIcon — avoids the classic Leaflet+webpack
// broken-default-marker-image issue entirely, and lets us color by category.
function pinIcon(color: string, dashed: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${color};
      border:2px ${dashed ? "dashed" : "solid"} #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

export default function MapView({
  events,
  onSelect,
}: {
  events: { ev: EventRow; visible: boolean }[];
  onSelect: (ev: EventRow) => void;
}) {
  return (
    <MapContainer
      center={[18.5204, 73.8567]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map(({ ev, visible }) => {
        if (ev.latitude == null || ev.longitude == null) return null;
        const cat = catMap[ev.category as CategoryId];
        return (
          <Marker
            key={ev.id}
            position={[ev.latitude, ev.longitude]}
            icon={pinIcon(cat?.color ?? "#888888", ev.status === "pending")}
            opacity={visible ? 1 : 0.2}
            interactive={visible}
            eventHandlers={{ click: () => onSelect(ev) }}
          />
        );
      })}
    </MapContainer>
  );
}
