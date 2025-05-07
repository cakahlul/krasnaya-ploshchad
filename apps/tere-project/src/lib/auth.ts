import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

export const signup = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const login = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      resolve(user);
    });
  });
};
