'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signup } from '@src/lib/auth';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signup(email, password);
      router.push('/');
    } catch (error) {
      alert(String(error));
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8] p-6 text-[#102a36] dark:bg-[#101418] dark:text-[#edf6f9]">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-[#181f25]/80">
        <p className="m-0 text-xs font-semibold uppercase tracking-[.16em] text-[#087ea4] dark:text-[#67d2ff]">Tere</p>
        <h1 className="mb-2 mt-4 text-2xl font-semibold">Create account</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-300">Use your work email to create your account.</p>
        <form onSubmit={handleSignUp} className="space-y-4">
          <label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-[#087ea4] dark:border-white/15" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-[#087ea4] dark:border-white/15" /></label>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#087ea4] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mb-0 mt-6 text-center text-sm text-slate-500 dark:text-slate-300">Already registered? <Link href="/sign-in" className="font-semibold text-[#087ea4] dark:text-[#67d2ff]">Sign in</Link></p>
      </section>
    </main>
  );
}
