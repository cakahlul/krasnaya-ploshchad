'use client';

import { useState, type FormEvent } from 'react';
import { LockKeyhole, Mail, MoveRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@src/lib/auth';
import { ThemeToggle } from '@src/components/ThemeToggle';

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
      router.push('/dashboard');
    } catch (error) {
      alert(String(error));
      setLoading(false);
    }
  };

  return (
    <main className="auth-desktop">
      <div className="wallpaper-shape wallpaper-shape-a" />
      <div className="wallpaper-shape wallpaper-shape-b" />
      <div className="auth-toolbar liquid-group">
        <div className="flex items-center gap-2.5"><div className="tere-glyph"><span /><span /><span /></div><strong>TERE</strong></div>
        <ThemeToggle />
      </div>

      <section className="auth-window liquid-glass">
        <div className="auth-window-copy">
          <div className="auth-window-kicker"><span /> A clearer view of delivery</div>
          <h1>Bring your work<br />into focus.</h1>
          <p>Create your workspace account for reporting, delivery health, productivity, and project context.</p>
          <div className="auth-preview" aria-hidden>
            <div className="auth-preview-bar"><i /><i /><i /></div>
            <div className="auth-preview-body"><aside /><div><b /><b /><b /><span /><span /></div></div>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="auth-form-panel">
          <div className="mb-8">
            <span className="auth-eyebrow">New workspace account</span>
            <h2>Create your account</h2>
            <p>Use your company email to get started.</p>
          </div>
          <div className="auth-email-form">
            <label>Email<div><Mail size={16} /><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></div></label>
            <label>Password<div><LockKeyhole size={16} /><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></div></label>
            <button disabled={loading} className="auth-submit">{loading ? 'Creating account…' : 'Create account'}<MoveRight size={16} /></button>
          </div>
          <p className="auth-account-link">Already registered? <Link href="/sign-in">Sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
