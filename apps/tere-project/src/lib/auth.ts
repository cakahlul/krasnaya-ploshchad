import { auth, googleProvider } from './firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';

export const signup = async (email: string, password: string) => {
  const allowedDomain = `@${process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || 'amarbank.co.id'}`;

  if (!email.endsWith(allowedDomain)) {
    throw new Error('Email domain is not allowed. Should be amarbank.co.id');
  }

  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  await signOut(auth);
  return result;
};

export const login = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!result.user.emailVerified) {
    try { await sendEmailVerification(result.user); } finally { await signOut(auth); }
    throw new Error('Verify your email before signing in. A verification email has been sent.');
  }
  return result;
};

export const logout = async () => {
  // Clear the server-side session cookie
  await fetch('/api/auth/session', { method: 'DELETE' });
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
      process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || 'amarbank.co.id'; // fallback to default domain if env var is not set
    if (!email.endsWith(`@${allowedDomain}`)) {
      await signOut(auth);
      throw new Error('Only specific domain users allowed');
    }

    return user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    throw error;
  }
}
