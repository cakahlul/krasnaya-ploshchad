import { auth } from '@src/lib/firebase';
import useUserStore from '@src/store/userStore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

export default function useUser() {
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  const setLoading = useUserStore(state => state.setLoading);
  const loading = useUserStore(state => state.loading);
  const setLoginPageMessage = useUserStore(state => state.setLoginPageMessage);
  const loginPageMessage = useUserStore(state => state.loginPageMessage);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return {
    user,
    setUser,
    clearUser: () => {
      setUser(null);
    },
    getUserEmail: () => (user ? user.email : ''),
    getDisplayName: () => (user ? user.displayName : ''),
    getUserPhoto: () => (user ? user.photoURL : ''),
    loading,
    setLoading,
    setLoginPageMessage,
    loginPageMessage,
  };
}
