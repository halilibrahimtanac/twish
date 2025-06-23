import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  profilePictureUrl: string | null;
  backgroundPictureUrl: string | null;
}

type UserState = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user: User) => set({ user }),
        clearUser: () => set({ user: null }),
      }),
      {
        name: "user-storage-twish",
      }
    ),
    { name: "UserStore" }
  )
);
