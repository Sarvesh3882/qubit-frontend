import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_instructor: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          const { access_token, user } = res.data;
          Cookies.set("qubit_token", access_token, { expires: 7 });
          set({ user, token: access_token });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data);
          const { access_token, user } = res.data;
          Cookies.set("qubit_token", access_token, { expires: 7 });
          set({ user, token: access_token });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        Cookies.remove("qubit_token");
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const res = await authApi.me();
          set({ user: res.data });
        } catch {
          Cookies.remove("qubit_token");
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "qubit-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
