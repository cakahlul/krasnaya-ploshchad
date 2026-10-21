'use client';

import { useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { login, signInWithGoogle } from '@src/lib/auth';
import { getAuth } from 'firebase/auth';
import useUser from '@src/hooks/useUser';
import { useRouter } from 'next/navigation';
import LegalModal, { type LegalModalType } from '@src/components/LegalModal';
import { useLoginTheme, type LoginTheme } from '@src/hooks/useLoginTheme';

const Stat3DScene = dynamic(() => import('./Stat3DScene'), {
  ssr: false,
  loading: () => null,
});

async function createSessionCookie() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error('Your account is not authorized. Contact your administrator.');
}

const FEATURE_CHIPS = [
  { label: 'Sprint WP tracking', icon: '📊' },
  { label: 'Productivity analytics', icon: '⚡' },
  { label: 'Bug monitoring', icon: '🐛' },
  { label: 'Leave & holidays', icon: '🗓️' },
];

const LOGIN_THEME_OPTIONS: Array<{ value: LoginTheme; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function LoginThemeSelector({
  value,
  onChange,
}: {
  value: LoginTheme;
  onChange: (value: LoginTheme) => void;
}) {
  return (
    <fieldset className="login-theme-selector">
      <legend className="login-theme-legend">Login theme</legend>
      <div className="login-theme-options">
        {LOGIN_THEME_OPTIONS.map((option) => (
          <label className="login-theme-option" key={option.value}>
            <input
              type="radio"
              name="login-theme"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);
  const { selectedTheme, setSelectedTheme, effectiveTheme } = useLoginTheme();
  const { loginPageMessage } = useUser();
  const router = useRouter();

  // 3D card tilt — tracks cursor over card and tilts in 3D based on offset
  // from center. Activated after the intro animation completes so initial
  // load isn't fighting motion values.
  const [cardInteractive, setCardInteractive] = useState(false);
  const cardMouseX = useMotionValue(0);
  const cardMouseY = useMotionValue(0);
  const cardSpringX = useSpring(cardMouseX, { stiffness: 160, damping: 18 });
  const cardSpringY = useSpring(cardMouseY, { stiffness: 160, damping: 18 });
  const cardRotateY = useTransform(cardSpringX, [-200, 200], [-9, 9]);
  const cardRotateX = useTransform(cardSpringY, [-200, 200], [7, -7]);
  // Cursor-following highlight position (% within the card)
  const glareX = useTransform(cardMouseX, [-220, 220], ['10%', '90%']);
  const glareY = useTransform(cardMouseY, [-280, 280], ['10%', '90%']);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(127,216,238,0.13) 0%, rgba(167,139,250,0.06) 30%, transparent 55%)`;

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    cardMouseX.set(e.clientX - rect.left - rect.width / 2);
    cardMouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleCardMouseLeave = () => {
    cardMouseX.set(0);
    cardMouseY.set(0);
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardInteractive) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    cardMouseX.set(touch.clientX - rect.left - rect.width / 2);
    cardMouseY.set(touch.clientY - rect.top - rect.height / 2);
  };

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
      className="login-page relative min-h-screen w-full overflow-x-hidden overflow-y-auto font-sans"
      data-login-theme={effectiveTheme}
      style={{ background: 'var(--login-page-background)' }}
    >
      {/* Grid overlay — denser on mobile, looser on desktop */}
      <div
        className="pointer-events-none absolute inset-0 bg-[length:40px_40px] sm:bg-[length:60px_60px]"
        style={{
          backgroundImage:
            'linear-gradient(var(--login-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--login-grid-line) 1px, transparent 1px)',
        }}
      />

      {/* Accent glow orb — scales with viewport */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] lg:h-[600px] lg:w-[600px] rounded-full"
        style={{
          background: 'var(--login-glow)',
        }}
      />

      {/* Full-page 3D layer — sits behind content. pointer-events:none on the wrapper
          so DOM stays clickable; R3F uses document.body as event source so bars
          still raycast hover/click correctly when cursor is over them. Visible on
          all screen sizes — the scene auto-repositions for mobile vs desktop. */}
      <div className="pointer-events-none fixed inset-0 z-[5]">
        <Stat3DScene />
      </div>

      {/* Two-column layout */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Left panel — branding. Tight on mobile, comfortable on tablet,
            full hero on desktop. */}
        <div className="relative flex w-full lg:w-1/2 flex-col px-5 pt-6 pb-1 sm:px-8 sm:pt-8 md:px-10 lg:px-12 xl:px-16 lg:pt-10 lg:pb-2">
          {/* Logo - top */}
          <div className="flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
            <div
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--login-logo-background)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="h-4 w-4 sm:h-[18px] sm:w-[18px]">
                <rect x="1" y="9" width="3.5" height="8" rx="1" fill="white" />
                <rect x="6.5" y="5" width="3.5" height="12" rx="1" fill="white" opacity="0.85" />
                <rect x="12" y="1" width="3.5" height="16" rx="1" fill="white" opacity="0.7" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="login-text-primary text-base sm:text-lg font-bold tracking-wide">TERE</span>
              <span
                className="hidden md:inline text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--login-hero-muted)' }}
              >
                Team Reporting Engine
              </span>
            </div>
          </div>

          {/* Info block — centered on mobile/tablet, left-aligned vertically
              centered on desktop. Bars peek behind this text region. */}
          <div className="mt-4 sm:mt-5 lg:my-auto flex flex-col gap-2.5 sm:gap-3 lg:gap-5 items-center lg:items-start text-center lg:text-left">
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1"
              style={{
                background: 'var(--login-badge-background)',
                border: '1px solid var(--login-badge-border)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--login-accent-bright)', boxShadow: '0 0 8px var(--login-accent-bright)' }}
              />
              <span
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ color: 'var(--login-accent-soft)' }}
              >
                v2.0 · Now Live
              </span>
            </div>

            <h1
              className="login-text-primary max-w-xl text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
              style={{ textShadow: 'var(--login-hero-shadow)' }}
            >
              Your team&apos;s data,{' '}
              <span
                style={{
                  background: 'var(--login-hero-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                finally fun to look at.
              </span>
            </h1>

            <p
              className="hidden sm:block max-w-md text-xs md:text-sm leading-relaxed"
              style={{
                color: 'var(--login-hero-copy)',
                textShadow: 'var(--login-hero-copy-shadow)',
              }}
            >
              Sprint tracking, productivity, bug monitoring & leave — one dashboard your team will actually
              enjoy opening.
            </p>

            <div className="hidden md:flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2">
              {FEATURE_CHIPS.map((f) => (
                <div
                  key={f.label}
                  className="login-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs transition-colors duration-200"
                  style={{
                    background: 'var(--login-chip-background)',
                    border: '1px solid var(--login-chip-border)',
                    color: 'var(--login-chip-text)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span className="text-sm leading-none">{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Sign-in card */}
        <div
          className="flex w-full items-center justify-center overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8 md:px-10 lg:w-1/2 lg:px-16 lg:py-12"
          style={{ perspective: '1400px' }}
        >
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Glassmorphic card — smooth blur-in fade. Card materializes from
                blurred to sharp with subtle lift, then becomes interactively
                tiltable on cursor + glare highlight follows the pointer. */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.45,
              }}
              onAnimationComplete={() => setCardInteractive(true)}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onTouchMove={handleCardTouchMove}
              onTouchEnd={handleCardMouseLeave}
              onTouchCancel={handleCardMouseLeave}
              className="relative overflow-hidden rounded-2xl sm:rounded-[24px] p-5 sm:p-7 lg:p-10"
              style={{
                background: 'var(--login-card-background)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--login-card-border)',
                boxShadow: 'var(--login-card-shadow)',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                ...(cardInteractive
                  ? { rotateY: cardRotateY, rotateX: cardRotateX }
                  : {}),
              }}
            >
              {/* Cursor-following highlight overlay — adds the "glass card has
                  depth" feel when interacting */}
              {cardInteractive && (
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: glareBackground,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    mixBlendMode: 'plus-lighter',
                  }}
                />
              )}
              {loginPageMessage && (
                <div
                  className="mb-4 sm:mb-6 rounded-lg border-l-4 p-3 sm:p-4"
                  style={{
                    borderColor: 'var(--login-accent)',
                    background: 'var(--login-message-background)',
                  }}
                >
                  <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--login-message-text)' }}>
                    {loginPageMessage}
                  </p>
                </div>
              )}

              <h2 className="login-text-primary mb-2 text-xl sm:text-2xl font-bold">
                Welcome back <span className="inline-block">&#x1F44B;</span>
              </h2>
              <p className="mb-6 sm:mb-8 text-xs sm:text-sm" style={{ color: 'var(--login-copy-muted)' }}>
                Sign in to access your team dashboard
              </p>

              <LoginThemeSelector value={selectedTheme} onChange={setSelectedTheme} />

              {/* Google SSO - Primary */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || success}
                className="login-button group relative flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: success
                    ? 'linear-gradient(135deg, #059669, #10b981)'
                    : 'var(--login-button-background)',
                  boxShadow: 'var(--login-button-shadow)',
                }}
              >
                {googleLoading ? (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                ) : success ? (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                {success ? 'Redirecting to dashboard...' : 'Continue with Google'}
              </button>

              <p className="mt-2 sm:mt-3 text-center text-[10px] sm:text-xs" style={{ color: 'var(--login-copy-subtle)' }}>
                Recommended &mdash; use your company Google account
              </p>

              {/* Divider */}
              <div className="my-5 sm:my-7 flex items-center gap-3 sm:gap-4">
                <div className="h-px flex-1" style={{ background: 'var(--login-divider)' }} />
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--login-copy-quiet)' }}>or</span>
                <div className="h-px flex-1" style={{ background: 'var(--login-divider)' }} />
              </div>

              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="login-email-toggle w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200"
                  style={{
                    color: 'var(--login-control-muted)',
                    border: '1px dashed var(--login-toggle-border)',
                    background: 'transparent',
                  }}
                >
                  Sign in with email instead
                </button>
              ) : (
                <form className="space-y-3 sm:space-y-4" onSubmit={handleLogin}>
                  {/* Email input */}
                  <div>
                    <label className="login-label mb-1 sm:mb-1.5 block text-[10px] sm:text-xs font-medium" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none transition-all duration-200 focus:ring-2"
                      style={{
                        background: 'var(--login-control-background)',
                        border: '1px solid var(--login-control-border)',
                        // focus ring handled via onFocus/onBlur
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--login-accent)';
                        e.currentTarget.style.boxShadow = 'var(--login-control-focus-ring)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--login-control-border)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Password input */}
                  <div>
                    <div className="mb-1 sm:mb-1.5 flex items-center justify-between">
                      <label className="login-label text-[10px] sm:text-xs font-medium" htmlFor="password">
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-[10px] sm:text-xs font-medium transition-colors duration-200 hover:underline"
                        style={{ color: 'var(--login-accent-bright)' }}
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
                        className="login-input w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 pr-9 sm:pr-10 text-xs sm:text-sm outline-none transition-all duration-200"
                        style={{
                          background: 'var(--login-control-background)',
                          border: '1px solid var(--login-control-border)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--login-accent)';
                          e.currentTarget.style.boxShadow = 'var(--login-control-focus-ring)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--login-control-border)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="login-icon-button absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
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
                    className="login-button w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: success
                        ? 'linear-gradient(135deg, #059669, #10b981)'
                        : 'var(--login-button-background)',
                      boxShadow: 'var(--login-submit-shadow)',
                    }}
                  >
                    {success ? 'Redirecting...' : loading ? 'Signing in...' : 'Sign in'}
                  </button>

                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="login-secondary-link w-full text-center text-[10px] sm:text-xs transition-colors duration-200 hover:underline"
                  >
                    Back to Google sign in
                  </button>
                </form>
              )}

              {/* Footer */}
              <div className="login-footer mt-6 sm:mt-8 flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="login-footer-link transition-colors"
                >
                  Terms
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="login-footer-link transition-colors"
                >
                  Privacy
                </button>
              </div>
            </motion.div>

            {/* Below card note */}
            <p
              className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs italic px-2"
              style={{ color: 'var(--login-copy-faint)' }}
            >
              Your data is safe. Unlike your WP score on a bad sprint.
            </p>
          </div>
        </div>
      </div>

      {/* Legal modals */}
      {legalModal && (
        <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}
