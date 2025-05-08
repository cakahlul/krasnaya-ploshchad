'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@src/lib/auth';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password);
      router.push('/');
    } catch (error) {
      alert(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-muted to-accent">
      <div className="w-full max-w-md bg-white/80 shadow-xl backdrop-blur-md rounded-3xl px-8 py-10 animate-bounce-up-down">
        <h2 className="text-3xl font-extrabold text-primary text-center mb-2 animate-bounce-up-down hover:animate-bounce-up-down transition-all">
          🎉 Create Your Account
        </h2>
        <p className="text-secondary text-center mb-6 animate-slot-in">
          Let&apos;s start something great together
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            placeholder="📧 Email"
            className="w-full px-4 py-3 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition duration-300"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="🔐 Password"
            className="w-full px-4 py-3 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition duration-300"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-primary active:scale-95 transition-transform duration-200"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up 🚀'}
          </button>

          <p className="text-center text-sm mt-4">
            Already registered?{' '}
            <Link
              href="/sign-in"
              className="text-accent font-semibold hover:underline"
            >
              Sign In Here 🔐
            </Link>
          </p>
        </form>
      </div>
      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-secondary text-center animate-slot-in">
        Made with ✨ and 0 bugs (hopefully) by{' '}
        <strong className="text-accent">Esasjana</strong> 🚀
      </footer>
    </div>
  );
}
