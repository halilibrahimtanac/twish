import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  username: string;
  name: string;
  email: string;
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
        name: 'user-storage-twish',
      }
    ),
    { name: 'UserStore' }
  )
);

