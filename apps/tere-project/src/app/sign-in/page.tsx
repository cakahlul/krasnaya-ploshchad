'use client';

import { useState, FormEvent } from 'react';
import { login, signInWithGoogle } from '@src/lib/auth';
import { getAuth } from 'firebase/auth';
import useUser from '@src/hooks/useUser';
import { useRouter } from 'next/navigation';

async function createSessionCookie() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

const FEATURES = [
  {
    label: 'Sprint WP tracking across all boards',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="10" width="4" height="9" rx="1" fill="#22b8d4" />
        <rect x="7" y="6" width="4" height="13" rx="1" fill="#22b8d4" opacity="0.7" />
        <rect x="13" y="2" width="4" height="17" rx="1" fill="#22b8d4" opacity="0.5" />
      </svg>
    ),
  },
  {
    label: 'Real-time productivity analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="12" r="7" stroke="#22b8d4" strokeWidth="2" fill="none" />
        <path d="M10 12 L10 6" stroke="#22b8d4" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 12 L14 9" stroke="#22b8d4" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4" y="0" width="12" height="2" rx="1" fill="#22b8d4" opacity="0.4" />
      </svg>
    ),
  },
  {
    label: 'Bug monitoring & team health',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="12" rx="5" ry="6" stroke="#22b8d4" strokeWidth="1.5" fill="none" />
        <path d="M5 12H1M15 12H19" stroke="#22b8d4" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 7L3 4M14 7L17 4" stroke="#22b8d4" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 17L3 19M14 17L17 19" stroke="#22b8d4" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 9H13M7 12H13M7 15H13" stroke="#22b8d4" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    label: 'Leave & holiday management',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="14" rx="2" stroke="#22b8d4" strokeWidth="1.5" fill="none" />
        <path d="M2 8H18" stroke="#22b8d4" strokeWidth="1.5" />
        <path d="M6 2V5M14 2V5" stroke="#22b8d4" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="5" y="11" width="3" height="2" rx="0.5" fill="#22b8d4" opacity="0.6" />
        <rect x="10" y="11" width="3" height="2" rx="0.5" fill="#22b8d4" opacity="0.4" />
      </svg>
    ),
  },
];

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { loginPageMessage } = useUser();
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      await createSessionCookie();
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      alert(String(error));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await createSessionCookie();
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      alert(String(error) || 'Google login failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-sans"
      style={{ background: 'linear-gradient(135deg, #060d1a, #011d4d, #034078)' }}
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Accent glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(18,130,162,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Two-column layout */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Left panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #1282a2, #22b8d4)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="9" width="3.5" height="8" rx="1" fill="white" />
                <rect x="6.5" y="5" width="3.5" height="12" rx="1" fill="white" opacity="0.85" />
                <rect x="12" y="1" width="3.5" height="16" rx="1" fill="white" opacity="0.7" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold tracking-wide text-white">TERE</span>
              <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Team Reporting Engine v2.0
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white xl:text-5xl">
            Your team&apos;s data, finally{' '}
            <span style={{ color: '#22b8d4' }}>fun to look at.</span>
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-lg text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            TERE consolidates sprint tracking, productivity analytics, bug monitoring, and leave
            management into one unified dashboard your team will actually enjoy using.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(34,184,212,0.08)', border: '1px solid rgba(34,184,212,0.15)' }}
                >
                  {f.icon}
                </div>
                <span className="text-sm text-white/80">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Sign-in card */}
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
          <div className="w-full max-w-md">
            {/* Glassmorphic card */}
            <div
              className="rounded-[24px] p-8 sm:p-10"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
              }}
            >
              {/* Mobile logo */}
              <div className="mb-6 flex items-center gap-2 lg:hidden">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #1282a2, #22b8d4)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="9" width="3.5" height="8" rx="1" fill="white" />
                    <rect x="6.5" y="5" width="3.5" height="12" rx="1" fill="white" opacity="0.85" />
                    <rect x="12" y="1" width="3.5" height="16" rx="1" fill="white" opacity="0.7" />
                  </svg>
                </div>
                <span className="text-base font-bold tracking-wide text-white">TERE</span>
              </div>

              {loginPageMessage && (
                <div
                  className="mb-6 rounded-lg border-l-4 p-4"
                  style={{
                    borderColor: '#1282a2',
                    background: 'rgba(18,130,162,0.1)',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: '#22b8d4' }}>
                    {loginPageMessage}
                  </p>
                </div>
              )}

              <h2 className="mb-2 text-2xl font-bold text-white">
                Welcome back <span className="inline-block">&#x1F44B;</span>
              </h2>
              <p className="mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Sign in to access your team dashboard
              </p>

              {/* Google SSO - Primary */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || success}
                className="group relative flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: success
                    ? 'linear-gradient(135deg, #059669, #10b981)'
                    : 'linear-gradient(135deg, #1282a2, #22b8d4)',
                  boxShadow: '0 4px 24px rgba(18,130,162,0.3)',
                }}
              >
                {googleLoading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                ) : success ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                {success ? 'Redirecting to dashboard...' : 'Continue with Google'}
              </button>

              <p className="mt-3 text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Recommended &mdash; use your company Google account
              </p>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-white/20"
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    background: 'transparent',
                  }}
                >
                  Sign in with email instead
                </button>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  {/* Email input */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:ring-2"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        // focus ring handled via onFocus/onBlur
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1282a2';
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(18,130,162,0.25)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Password input */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-white/50" htmlFor="password">
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-xs font-medium transition-colors duration-200 hover:underline"
                        style={{ color: '#22b8d4' }}
                      >
                        Forgot?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#1282a2';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(18,130,162,0.25)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign in button */}
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: success
                        ? 'linear-gradient(135deg, #059669, #10b981)'
                        : 'linear-gradient(135deg, #1282a2, #22b8d4)',
                      boxShadow: '0 4px 24px rgba(18,130,162,0.25)',
                    }}
                  >
                    {success ? 'Redirecting...' : loading ? 'Signing in...' : 'Sign in'}
                  </button>

                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-center text-xs transition-colors duration-200 hover:underline"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Back to Google sign in
                  </button>
                </form>
              )}

              {/* Footer */}
              <div className="mt-8 flex items-center justify-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <a href="#" className="transition-colors hover:text-white/50">Terms</a>
                <span>|</span>
                <a href="#" className="transition-colors hover:text-white/50">Privacy</a>
              </div>
            </div>

            {/* Below card note */}
            <p
              className="mt-6 text-center text-xs italic"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Your data is safe. Unlike your WP score on a bad sprint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
