import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { City } from "../city-search";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  profilePictureUrl: string | undefined;
  backgroundPictureUrl: string | undefined;
  location: City | undefined;
}

type UserState = {
  user: User | null;
  setUser: <K extends keyof User>(field: K, value: User[K]) => void;
  setUserObject: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (field, value) =>
          set((state) => ({
            user: state.user ? { ...state.user, [field]: value } : null,
        })),
        setUserObject: (user: User) => set((state) => ({ ...state, user })),
        clearUser: () => set({ user: null }),
      }),
      {
        name: "user-storage-twish",
      }
    ),
    { name: "UserStore" }
  )
);