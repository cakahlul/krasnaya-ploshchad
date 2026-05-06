'use client';

import { useEffect, useCallback } from 'react';

export type LegalModalType = 'terms' | 'privacy';

interface LegalModalProps {
  type: LegalModalType;
  onClose: () => void;
}

// --------------------------------------------------------------------------
// Content definitions
// --------------------------------------------------------------------------

const TERMS_CONTENT = {
  title: 'Terms of Use',
  subtitle: 'The short version: be cool, do good work.',
  sections: [
    {
      heading: 'Who can use TERE',
      body: "TERE is built for teams — specifically, teams that actually care about their WP scores. If you're here, you're already one of the good ones. Access is granted by your organization's admin. No rogue sign-ups, no chaos.",
    },
    {
      heading: 'What you can do',
      body: 'Track sprints, monitor bugs, manage leaves, and stare at productivity charts until they start making existential sense. Use TERE to get things done, not to game the metrics — your teammates will notice.',
    },
    {
      heading: 'What you cannot do',
      body: "Scrape the data, reverse-engineer the dashboard, or blame TERE for your sprint going sideways. Also: don't share your credentials. Not even with your rubber duck.",
    },
    {
      heading: 'Data & accuracy',
      body: "TERE pulls data from your connected tools. We display what we get. If the numbers look suspicious, check the source — we're just the messenger (a very good-looking messenger).",
    },
    {
      heading: 'Changes to these terms',
      body: "We'll update this when things change. We'll also tell your admin when we do. No surprise rewrites, no fine print that suddenly means you owe us a kidney.",
    },
  ],
} as const;

const PRIVACY_CONTENT = {
  title: 'Privacy Policy',
  subtitle: "Your data belongs to you. We're just looking after it.",
  sections: [
    {
      heading: 'What we collect',
      body: "Your email, name, and the work data you bring in — sprint records, leave logs, bug counts. We collect what's needed to run the dashboard and nothing more. No sneaky side-channel stuff.",
    },
    {
      heading: 'Why we collect it',
      body: "To show you your team's data. That's it. We don't sell it, we don't train AI models on your sprint velocity (unless you've explicitly agreed to something else — which you haven't).",
    },
    {
      heading: 'Who can see your data',
      body: 'Your teammates and admins, within the access level your org sets up. Our infrastructure team may access logs for debugging. We treat that access like a surgeon treats a scalpel — carefully, and only when needed.',
    },
    {
      heading: 'How we protect it',
      body: 'Authentication via Google OAuth and session cookies with server-side validation. Data in transit is encrypted. We take security seriously — especially since your bug count is already stressful enough.',
    },
    {
      heading: 'Your rights',
      body: "Want to know what we store about you? Ask. Want it deleted when you leave the org? We'll do it. Your data is yours — we're just the steward, not the owner.",
    },
  ],
} as const;

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const content = type === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(160deg, #0b1a30 0%, #051025 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile feel) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-6 pb-4 pt-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">{content.title}</h2>
            <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {content.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-white/10"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h3
                  className="mb-1.5 text-sm font-semibold"
                  style={{ color: '#22b8d4' }}
                >
                  {section.heading}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p
            className="mt-8 text-center text-xs italic"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {type === 'terms'
              ? 'Last updated: whenever we had a good sprint.'
              : 'Last updated: right after we cleaned up our own data hygiene.'}
          </p>
        </div>

        {/* CTA */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #1282a2, #22b8d4)',
              boxShadow: '0 4px 16px rgba(18,130,162,0.25)',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
