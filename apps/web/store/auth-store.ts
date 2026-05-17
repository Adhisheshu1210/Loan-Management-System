import { create } from "zustand";

type UserRole = "ADMIN" | "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION" | "BORROWER";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  phoneVerifiedAt?: string | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token?: string | null) => void;
  syncUserPhone: (phone: string, phoneVerifiedAt?: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token = null) => set({ user, token }),
  syncUserPhone: (phone, phoneVerifiedAt = null) =>
    set((state) => ({
      user: state.user ? { ...state.user, phone, phoneVerifiedAt } : state.user,
    })),
  logout: () => set({ user: null, token: null }),
}));
