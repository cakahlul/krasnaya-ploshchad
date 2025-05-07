import { User } from 'firebase/auth';
import { create } from 'zustand';

type UserState = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  loginPageMessage: string;
  setLoginPageMessage: (message: string) => void;
};

const useUserStore = create<UserState>(set => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
  loading: true,
  setLoading: (loading: boolean) => set({ loading }),
  loginPageMessage: '',
  setLoginPageMessage: (message: string) => set({ loginPageMessage: message }),
}));

export default useUserStore;
