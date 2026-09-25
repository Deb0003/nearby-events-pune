import "./globals.css";

export const metadata = {
  title: "Nearby.Events — Pune",
  description: "Discover local events near you in Pune, on a map.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
