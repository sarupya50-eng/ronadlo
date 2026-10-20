import "./globals.css";
import type { Metadata, Viewport } from "next";
import ServiceWorker from "./components/ServiceWorker";

export const metadata: Metadata = {
  title: "Auralis — Music",
  description: "Ad-free music discovery and playback.",
  applicationName: "Auralis",
  appleWebApp: {
    capable: true,
    title: "Auralis",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
