"use client";
import { useEffect } from "react";

const CALENDLY_URL = "https://calendly.com/contact-jj-conseil/rdv-analyste";

export default function RDVPage() {
  useEffect(() => {
    // charge le script Calendly si absent
    if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
      const s = document.createElement("script");
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[#123055]">Prendre un rendez‑vous</h1>
      <p className="mt-2 text-slate-600">Choisissez le créneau qui vous convient.</p>
      <div
        className="calendly-inline-widget mt-6"
        data-url={CALENDLY_URL}
        style={{ minWidth: "320px", height: "700px" }}
      />
    </main>
  );
}