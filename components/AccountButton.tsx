"use client";

import { LogOut } from "lucide-react";
import { useSession } from "@/lib/session";
import { curvedSm, dark } from "./buttonStyles";

// Only shows when someone is logged in
export default function AccountButton() {
  const user = useSession((state) => state.user);
  const logout = useSession((state) => state.logout);
  if (!user) return null;

  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-bold text-stone-300 xl:inline">
        Hi, {firstName}
      </span>
      <button
        type="button"
        onClick={logout}
        title={`Log out ${user.name}`}
        aria-label={`Log out ${user.name}`}
        className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center`}
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}
