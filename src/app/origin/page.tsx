"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Permanent redirect — /origin → /infrastructure */
export default function OriginRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/infrastructure"); }, [router]);
  return null;
}
