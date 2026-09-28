"use client";
import dynamic from "next/dynamic";

// Dynamic import keeps Three.js and framer-motion out of the SSR bundle for tour
const Tour = dynamic(() => import("./Tour"), { ssr: false });

export default function TourRoot() {
  return <Tour />;
}
