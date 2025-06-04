import { auth, googleProvider } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';

export const signup = (email: string, password: string) => {
  const allowedDomain = '@amarbank.co.id';

  if (!email.endsWith(allowedDomain)) {
    throw new Error('Email domain is not allowed. Should be amarbank.co.id');
  }

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

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Optional: check domain here
    const email = user.email || '';
    const allowedDomain =
      process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || 'secret.co.id'; // fallback to default domain if env var is not set
    if (!email.endsWith(`@${allowedDomain}`)) {
      throw new Error('Only specific domain users allowed');
    }

    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    throw error;
  }
}
