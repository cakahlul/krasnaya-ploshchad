'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Eye, EyeOff, LockKeyhole, Mail, MoveRight, Search, UsersRound } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { login, signInWithGoogle } from '@src/lib/auth';
import useUser from '@src/hooks/useUser';
import { ThemeToggle } from '@src/components/ThemeToggle';
import LegalModal, { type LegalModalType } from '@src/components/LegalModal';

async function createSessionCookie() {
  const user = getAuth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);
  const { loginPageMessage } = useUser();
  const router = useRouter();

  const finishSignIn = async (provider: 'google' | 'email') => {
    setBusy(provider);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await login(email, password);
      await createSessionCookie();
      router.push('/dashboard');
    } catch (error) {
      alert(String(error));
      setBusy(null);
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    void finishSignIn('email');
  };

  return (
    <main className="auth-desktop auth-login">
      <motion.section
        initial={{ opacity: 0, y: 12, scale: .985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
        className="landing-window liquid-glass"
      >
        <header className="landing-window-header">
          <div className="login-brand">
            <div className="tere-glyph" aria-hidden><span /><span /><span /></div>
            <div><strong>TERE</strong><span>Team Reporting Engine</span></div>
          </div>
          <ThemeToggle />
        </header>

        <div className="landing-content">
          <section className="landing-hero" aria-labelledby="landing-title">
            <span className="landing-kicker"><i /> Team intelligence, one view</span>
            <h1 id="landing-title">See the work.<br />Understand the team.</h1>
            <p>TERE brings delivery reporting, project context, productivity, and leave into one calm workspace.</p>
            <div className="landing-features">
              <div><BarChart3 size={18} /><span><strong>Delivery health</strong><small>Reports and trends without spreadsheet hunting.</small></span></div>
              <div><Search size={18} /><span><strong>Project context</strong><small>Find tickets, epics, and ownership quickly.</small></span></div>
              <div><UsersRound size={18} /><span><strong>Team visibility</strong><small>Shared signals for leads and members.</small></span></div>
            </div>
          </section>

          <section className="landing-form" aria-labelledby="sign-in-title">
            <div className="login-intro">
              <span className="auth-eyebrow">Welcome back</span>
              <h2 id="sign-in-title">Sign in</h2>
              <p>Continue to your TERE workspace.</p>
            </div>

            {loginPageMessage && <div className="auth-notice">{loginPageMessage}</div>}

            <button type="button" className="google-button" disabled={busy !== null} onClick={() => void finishSignIn('google')}>
              <svg viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.7 4.7 0 0 1-2 3v2.8h3.5c2-1.9 3.2-4.7 3.2-7.9Z"/><path fill="#34A853" d="M12 22c2.9 0 5.3-1 7.1-2.6l-3.5-2.8c-1 .7-2.2 1.1-3.6 1.1a6.2 6.2 0 0 1-5.8-4.3H2.6v2.8A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.4a6.2 6.2 0 0 1 0-3.8V6.8H2.6a10 10 0 0 0 0 9.4l3.6-2.8Z"/><path fill="#EA4335" d="M12 5.7c1.6 0 3 .5 4.1 1.6l3.1-3.1A10 10 0 0 0 2.6 6.8l3.6 2.8A6.2 6.2 0 0 1 12 5.7Z"/></svg>
              <span>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
              <MoveRight size={16} />
            </button>

            <div className="auth-separator"><span>or</span></div>

            <AnimatePresence mode="wait" initial={false}>
              {!emailMode ? (
                <motion.button key="email-trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} type="button" className="email-trigger" onClick={() => setEmailMode(true)}>
                  <Mail size={16} /> Continue with email
                </motion.button>
              ) : (
                <motion.form key="email-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={submitEmail} className="auth-email-form">
                  <label>Email<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label>
                  <label>Password<div><input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(show => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                  <button className="auth-submit" disabled={busy !== null}><LockKeyhole size={15} />{busy === 'email' ? 'Signing in…' : 'Sign in'}</button>
                  <button type="button" className="auth-back" onClick={() => setEmailMode(false)}>Back</button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="auth-legal"><button onClick={() => setLegalModal('terms')}>Terms</button><span>·</span><button onClick={() => setLegalModal('privacy')}>Privacy</button></div>
          </section>
        </div>
      </motion.section>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </main>
  );
}
