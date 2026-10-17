import { create } from "zustand";

export type SessionUser = { name: string; phone: string };

type SessionState = {
  status: "loading" | "ready";
  user: SessionUser | null;
  refresh: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
  logout: () => Promise<void>;
};

// Who is logged in, as far as the browser knows. The server decides what is really allowed.
export const useSession = create<SessionState>()((set) => ({
  status: "loading",
  user: null,

  refresh: async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await response.json();
      set({ user: data.user ?? null, status: "ready" });
    } catch {
      set({ user: null, status: "ready" });
    }
  },

  setUser: (user) => set({ user, status: "ready" }),

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
