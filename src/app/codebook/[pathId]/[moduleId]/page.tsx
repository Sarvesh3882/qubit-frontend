"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

// Module overview just redirects to path page (modules are shown inline there)
export default function ModuleRedirect() {
  const { pathId } = useParams<{ pathId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/codebook/${pathId}`);
  }, [pathId]);
  return null;
}
