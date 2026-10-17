"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/session";

// Asks the server who is logged in, once, when the site opens
export default function SessionLoader() {
  useEffect(() => {
    void useSession.getState().refresh();
  }, []);

  return null;
}
