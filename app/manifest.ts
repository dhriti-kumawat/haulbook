import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haulbook",
    short_name: "Haulbook",
    description: "Every product you review, in one place.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f4f1fa",
    theme_color: "#f4f1fa",
    // Lets the installed app appear in the phone's share sheet (Android), so a product can be
    // shared straight from a shop app. See app/share/page.tsx.
    // Written in the Web Share Target spec's shape; Next's type for it doesn't match the spec.
    ...({ share_target: { action: "/share", method: "GET", params: { title: "title", text: "text", url: "url" } } } as object),
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
