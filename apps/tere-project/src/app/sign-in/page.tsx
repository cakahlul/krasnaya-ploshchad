'use client';

import { useState, FormEvent } from 'react';
import { login, signInWithGoogle } from '@src/lib/auth';
import useUser from '@src/hooks/useUser';
import { useRouter } from 'next/navigation';
import GoogleLoginButton from '@src/components/buttonLoginGoogle';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginPageMessage } = useUser();
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      alert(error);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-accent via-muted to-white">
      {loginPageMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-2 text-accent font-semibold text-sm animate-slot-in">
          {loginPageMessage}
        </div>
      )}
      <div className="w-full max-w-md bg-white/80 shadow-xl backdrop-blur-md rounded-3xl px-8 py-10 animate-bounce-up-down">
        <h2 className="text-3xl font-extrabold text-primary text-center mb-2 animate-bounce-up-down hover:animate-bounce-up-down">
          👋 Welcome Back!
        </h2>
        <p className="text-secondary text-center mb-6 animate-slot-in">
          Login to continue your journey
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? 'Logging in...' : 'Login 🚀'}
          </button>
          {/* Add Google login button here */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-muted">or</span>
            </div>
          </div>

          <GoogleLoginButton
            onClick={async () => {
              setLoading(true);
              try {
                await signInWithGoogle();
                router.push('/dashboard');
              } catch (error) {
                alert(error || 'Google login failed');
              }
              setLoading(false);
            }}
            disabled={loading}
          />
        </form>
      </div>
      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-secondary text-center animate-slot-in">
        Made with ✨ and 0 bugs (hopefully) by{' '}
        <strong className="text-accent">Esasjana</strong> 🚀
      </footer>
    </div>
  );
}
