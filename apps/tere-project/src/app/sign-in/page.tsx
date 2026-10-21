"use client";

import { useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { login, signInWithGoogle } from "@src/lib/auth";
import { getAuth } from "firebase/auth";
import useUser from "@src/hooks/useUser";
import { useRouter } from "next/navigation";
import LegalModal, { type LegalModalType } from "@src/components/LegalModal";

const Stat3DScene = dynamic(() => import("./Stat3DScene"), {
  ssr: false,
  loading: () => null,
});

async function createSessionCookie() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok)
    throw new Error(
      "Your account is not authorized. Contact your administrator.",
    );
}

const FEATURE_CHIPS = [
  { label: "Sprint WP tracking", icon: "📊" },
  { label: "Productivity analytics", icon: "⚡" },
  { label: "Bug monitoring", icon: "🐛" },
  { label: "Leave & holidays", icon: "🗓️" },
];

type LoginTheme = "system" | "light" | "dark";
type ResolvedLoginTheme = Exclude<LoginTheme, "system">;

type LoginThemeTokens = {
  pageBackground: string;
  gridLine: string;
  accentGlow: string;
  brandMuted: string;
  badgeBackground: string;
  badgeBorder: string;
  badgeText: string;
  headingText: string;
  headingShadow: string;
  headingGradient: string;
  bodyText: string;
  bodyShadow: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  messageBackground: string;
  messageText: string;
  primaryText: string;
  mutedText: string;
  buttonBackground: string;
  buttonShadow: string;
  subtleText: string;
  divider: string;
  labelText: string;
  controlText: string;
  controlBorder: string;
  controlBackground: string;
  inputText: string;
  iconText: string;
  accent: string;
  accentBright: string;
  focusRing: string;
  secondaryText: string;
  footerText: string;
  copyFaint: string;
  modal: {
    backdrop: string;
    panel: string;
    border: string;
    shadow: string;
    handle: string;
    divider: string;
    title: string;
    muted: string;
    close: string;
    heading: string;
    body: string;
    footer: string;
    buttonBackground: string;
    buttonShadow: string;
  };
  sceneTooltip: {
    background: string;
    border?: string;
    accent?: string;
    text: string;
  };
};

const DARK_LOGIN_THEME: LoginThemeTokens = {
  pageBackground: "linear-gradient(135deg, #060d1a, #011d4d, #034078)",
  gridLine: "rgba(255,255,255,0.03)",
  accentGlow:
    "radial-gradient(circle, rgba(18,130,162,0.15) 0%, transparent 70%)",
  brandMuted: "rgba(255,255,255,0.4)",
  badgeBackground: "rgba(34,184,212,0.08)",
  badgeBorder: "rgba(34,184,212,0.18)",
  badgeText: "#7fd8ee",
  headingText: "#ffffff",
  headingShadow: "0 2px 14px rgba(0,0,0,0.5)",
  headingGradient: "linear-gradient(135deg, #a78bfa, #7fd8ee, #fbb6ce)",
  bodyText: "rgba(255,255,255,0.75)",
  bodyShadow: "0 1px 8px rgba(0,0,0,0.45)",
  chipBackground: "rgba(255,255,255,0.04)",
  chipBorder: "rgba(255,255,255,0.08)",
  chipText: "rgba(255,255,255,0.75)",
  cardBackground: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  cardShadow: "0 8px 48px rgba(0,0,0,0.4)",
  messageBackground: "rgba(18,130,162,0.1)",
  messageText: "#22b8d4",
  primaryText: "#ffffff",
  mutedText: "rgba(255,255,255,0.45)",
  buttonBackground: "linear-gradient(135deg, #1282a2, #22b8d4)",
  buttonShadow: "0 4px 24px rgba(18,130,162,0.3)",
  subtleText: "rgba(255,255,255,0.35)",
  divider: "rgba(255,255,255,0.1)",
  labelText: "rgba(255,255,255,0.5)",
  controlText: "rgba(255,255,255,0.6)",
  controlBorder: "rgba(255,255,255,0.15)",
  controlBackground: "rgba(255,255,255,0.05)",
  inputText: "#ffffff",
  iconText: "rgba(255,255,255,0.3)",
  accent: "#1282a2",
  accentBright: "#22b8d4",
  focusRing: "0 0 0 2px rgba(18,130,162,0.25)",
  secondaryText: "rgba(255,255,255,0.4)",
  footerText: "rgba(255,255,255,0.25)",
  copyFaint: "rgba(255,255,255,0.2)",
  modal: {
    backdrop: "rgba(0,0,0,0.65)",
    panel: "linear-gradient(160deg, #0b1a30 0%, #051025 100%)",
    border: "rgba(255,255,255,0.08)",
    shadow: "0 24px 80px rgba(0,0,0,0.6)",
    handle: "rgba(255,255,255,0.15)",
    divider: "rgba(255,255,255,0.07)",
    title: "#ffffff",
    muted: "rgba(255,255,255,0.45)",
    close: "rgba(255,255,255,0.5)",
    heading: "#22b8d4",
    body: "rgba(255,255,255,0.6)",
    footer: "rgba(255,255,255,0.2)",
    buttonBackground: "linear-gradient(135deg, #1282a2, #22b8d4)",
    buttonShadow: "0 4px 16px rgba(18,130,162,0.25)",
  },
  sceneTooltip: {
    background: "rgba(6, 13, 26, 0.85)",
    text: "rgba(255,255,255,0.88)",
  },
};

const LIGHT_LOGIN_THEME: LoginThemeTokens = {
  pageBackground: "linear-gradient(135deg, #f5fbfd, #e1f1f5, #cfe8ef)",
  gridLine: "rgba(14,116,144,0.1)",
  accentGlow:
    "radial-gradient(circle, rgba(18,130,162,0.18) 0%, transparent 70%)",
  brandMuted: "rgba(19,59,76,0.68)",
  badgeBackground: "rgba(14,116,144,0.12)",
  badgeBorder: "rgba(14,116,144,0.28)",
  badgeText: "#0e7490",
  headingText: "#133b4c",
  headingShadow: "0 2px 14px rgba(255,255,255,0.55)",
  headingGradient: "linear-gradient(135deg, #5b3fb7, #0e7490, #b83264)",
  bodyText: "#244b5d",
  bodyShadow: "0 1px 8px rgba(255,255,255,0.55)",
  chipBackground: "rgba(255,255,255,0.5)",
  chipBorder: "rgba(14,116,144,0.22)",
  chipText: "#245267",
  cardBackground: "rgba(255,255,255,0.72)",
  cardBorder: "rgba(14,116,144,0.22)",
  cardShadow: "0 8px 48px rgba(19,59,76,0.18)",
  messageBackground: "rgba(14,116,144,0.1)",
  messageText: "#0e7490",
  primaryText: "#102a43",
  mutedText: "#426779",
  buttonBackground: "linear-gradient(135deg, #0e7490, #22b8d4)",
  buttonShadow: "0 4px 24px rgba(14,116,144,0.3)",
  subtleText: "#577787",
  divider: "rgba(14,116,144,0.22)",
  labelText: "#426779",
  controlText: "#426779",
  controlBorder: "rgba(14,116,144,0.28)",
  controlBackground: "rgba(255,255,255,0.76)",
  inputText: "#102a43",
  iconText: "#426779",
  accent: "#0e7490",
  accentBright: "#0e7490",
  focusRing: "0 0 0 2px rgba(14,116,144,0.3)",
  secondaryText: "#426779",
  footerText: "#577787",
  copyFaint: "#6f8f9d",
  modal: {
    backdrop: "rgba(9,44,58,0.45)",
    panel: "linear-gradient(160deg, #ffffff 0%, #e8f4f7 100%)",
    border: "rgba(14,116,144,0.22)",
    shadow: "0 24px 80px rgba(19,59,76,0.28)",
    handle: "rgba(14,116,144,0.25)",
    divider: "rgba(14,116,144,0.18)",
    title: "#102a43",
    muted: "#557887",
    close: "#426779",
    heading: "#0e7490",
    body: "#2d5667",
    footer: "#6f8f9d",
    buttonBackground: "linear-gradient(135deg, #0e7490, #22b8d4)",
    buttonShadow: "0 4px 16px rgba(14,116,144,0.25)",
  },
  sceneTooltip: {
    background: "rgba(255,255,255,0.96)",
    border: "rgba(14,116,144,0.32)",
    accent: "#0e7490",
    text: "#102a43",
  },
};

const LOGIN_THEME_TOKENS: Record<ResolvedLoginTheme, LoginThemeTokens> = {
  dark: DARK_LOGIN_THEME,
  light: LIGHT_LOGIN_THEME,
};

const LOGIN_THEME_STORAGE_KEY = "tere-login-theme";

function isLoginTheme(value: string | null): value is LoginTheme {
  return value === "system" || value === "light" || value === "dark";
}

function readStoredLoginTheme(): LoginTheme {
  try {
    const storedTheme = window.localStorage.getItem(LOGIN_THEME_STORAGE_KEY);
    return isLoginTheme(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function useLoginTheme() {
  const [selectedTheme, setSelectedTheme] = useState<LoginTheme>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedLoginTheme>("dark");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setSelectedTheme(readStoredLoginTheme());
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const scheduleSystemTheme = (theme: ResolvedLoginTheme) => {
      Promise.resolve().then(() => {
        if (active) setSystemTheme(theme);
      });
    };

    if (selectedTheme !== "system") {
      return () => {
        active = false;
      };
    }

    try {
      if (typeof window.matchMedia !== "function") {
        scheduleSystemTheme("dark");
        return () => {
          active = false;
        };
      }

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateSystemTheme = () => {
        try {
          scheduleSystemTheme(mediaQuery.matches ? "dark" : "light");
        } catch {
          scheduleSystemTheme("dark");
        }
      };

      updateSystemTheme();

      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", updateSystemTheme);
        return () => {
          active = false;
          try {
            mediaQuery.removeEventListener("change", updateSystemTheme);
          } catch {
            // Browser media APIs can throw during teardown.
          }
        };
      }

      if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(updateSystemTheme);
        return () => {
          active = false;
          try {
            mediaQuery.removeListener(updateSystemTheme);
          } catch {
            // Browser media APIs can throw during teardown.
          }
        };
      }
    } catch {
      scheduleSystemTheme("dark");
    }

    return () => {
      active = false;
    };
  }, [selectedTheme]);

  const changeTheme = (theme: LoginTheme) => {
    setSelectedTheme(theme);
    try {
      window.localStorage.setItem(LOGIN_THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains active for this session when storage is unavailable.
    }
  };

  return {
    selectedTheme,
    resolvedTheme: selectedTheme === "system" ? systemTheme : selectedTheme,
    changeTheme,
  };
}

export default function SignIn() {
  const { selectedTheme, resolvedTheme, changeTheme } = useLoginTheme();
  const theme = LOGIN_THEME_TOKENS[resolvedTheme];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);
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
  const glareX = useTransform(cardMouseX, [-220, 220], ["10%", "90%"]);
  const glareY = useTransform(cardMouseY, [-280, 280], ["10%", "90%"]);
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
        router.push("/dashboard");
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
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      alert(String(error) || "Google login failed");
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto font-sans"
      style={{ background: theme.pageBackground }}
    >
      {/* Grid overlay — denser on mobile, looser on desktop */}
      <div
        className="pointer-events-none absolute inset-0 bg-[length:40px_40px] sm:bg-[length:60px_60px]"
        style={{
          backgroundImage: `linear-gradient(${theme.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridLine} 1px, transparent 1px)`,
        }}
      />

      {/* Accent glow orb — scales with viewport */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] lg:h-[600px] lg:w-[600px] rounded-full"
        style={{
          background: theme.accentGlow,
        }}
      />

      {/* Full-page 3D layer — sits behind content. pointer-events:none on the wrapper
          so DOM stays clickable; R3F uses document.body as event source so bars
          still raycast hover/click correctly when cursor is over them. Visible on
          all screen sizes — the scene auto-repositions for mobile vs desktop. */}
      <div className="pointer-events-none fixed inset-0 z-[5]">
        <Stat3DScene tooltipTheme={theme.sceneTooltip} />
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
              style={{
                background: "linear-gradient(135deg, #1282a2, #22b8d4)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              >
                <rect x="1" y="9" width="3.5" height="8" rx="1" fill="white" />
                <rect
                  x="6.5"
                  y="5"
                  width="3.5"
                  height="12"
                  rx="1"
                  fill="white"
                  opacity="0.85"
                />
                <rect
                  x="12"
                  y="1"
                  width="3.5"
                  height="16"
                  rx="1"
                  fill="white"
                  opacity="0.7"
                />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-base sm:text-lg font-bold tracking-wide"
                style={{ color: theme.headingText }}
              >
                TERE
              </span>
              <span
                className="hidden md:inline text-[10px] uppercase tracking-[0.18em]"
                style={{ color: theme.brandMuted }}
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
                background: theme.badgeBackground,
                border: `1px solid ${theme.badgeBorder}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#22b8d4", boxShadow: "0 0 8px #22b8d4" }}
              />
              <span
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ color: theme.badgeText }}
              >
                v2.0 · Now Live
              </span>
            </div>

            <h1
              className="max-w-xl text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight"
              style={{
                color: theme.headingText,
                textShadow: theme.headingShadow,
              }}
            >
              Your team&apos;s data,{" "}
              <span
                style={{
                  background: theme.headingGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                finally fun to look at.
              </span>
            </h1>

            <p
              className="hidden sm:block max-w-md text-xs md:text-sm leading-relaxed"
              style={{
                color: theme.bodyText,
                textShadow: theme.bodyShadow,
              }}
            >
              Sprint tracking, productivity, bug monitoring & leave — one
              dashboard your team will actually enjoy opening.
            </p>

            <div className="hidden md:flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2">
              {FEATURE_CHIPS.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs transition-colors duration-200 hover:bg-white/10"
                  style={{
                    background: theme.chipBackground,
                    border: `1px solid ${theme.chipBorder}`,
                    color: theme.chipText,
                    backdropFilter: "blur(8px)",
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
          style={{ perspective: "1400px" }}
        >
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Glassmorphic card — smooth blur-in fade. Card materializes from
                blurred to sharp with subtle lift, then becomes interactively
                tiltable on cursor + glare highlight follows the pointer. */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
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
                background: theme.cardBackground,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${theme.cardBorder}`,
                boxShadow: theme.cardShadow,
                transformStyle: "preserve-3d",
                willChange: "transform",
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
                    position: "absolute",
                    inset: 0,
                    background: glareBackground,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    mixBlendMode: "plus-lighter",
                  }}
                />
              )}
              {loginPageMessage && (
                <div
                  className="mb-4 sm:mb-6 rounded-lg border-l-4 p-3 sm:p-4"
                  style={{
                    borderColor: theme.accent,
                    background: theme.messageBackground,
                  }}
                >
                  <p
                    className="text-xs sm:text-sm font-medium"
                    style={{ color: theme.messageText }}
                  >
                    {loginPageMessage}
                  </p>
                </div>
              )}

              <div className="mb-5 flex items-center justify-between gap-3">
                <label
                  className="text-[10px] sm:text-xs font-medium"
                  htmlFor="login-theme"
                  style={{ color: theme.labelText }}
                >
                  Login theme
                </label>
                <select
                  id="login-theme"
                  value={selectedTheme}
                  onChange={(event) => {
                    const nextTheme = event.target.value;
                    if (isLoginTheme(nextTheme)) changeTheme(nextTheme);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors focus:ring-2"
                  style={{
                    color: theme.controlText,
                    background: theme.controlBackground,
                    border: `1px solid ${theme.controlBorder}`,
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.borderColor = theme.accent;
                    event.currentTarget.style.boxShadow = theme.focusRing;
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.borderColor = theme.controlBorder;
                    event.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <h2
                className="mb-2 text-xl sm:text-2xl font-bold"
                style={{ color: theme.primaryText }}
              >
                Welcome back <span className="inline-block">&#x1F44B;</span>
              </h2>
              <p
                className="mb-6 sm:mb-8 text-xs sm:text-sm"
                style={{ color: theme.mutedText }}
              >
                Sign in to access your team dashboard
              </p>

              {/* Google SSO - Primary */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || success}
                className="group relative flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: success
                    ? "linear-gradient(135deg, #059669, #10b981)"
                    : theme.buttonBackground,
                  boxShadow: theme.buttonShadow,
                }}
              >
                {googleLoading ? (
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="31.4 31.4"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : success ? (
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {success
                  ? "Redirecting to dashboard..."
                  : "Continue with Google"}
              </button>

              <p
                className="mt-2 sm:mt-3 text-center text-[10px] sm:text-xs"
                style={{ color: theme.subtleText }}
              >
                Recommended &mdash; use your company Google account
              </p>

              {/* Divider */}
              <div className="my-5 sm:my-7 flex items-center gap-3 sm:gap-4">
                <div
                  className="h-px flex-1"
                  style={{ background: theme.divider }}
                />
                <span
                  className="text-[10px] sm:text-xs"
                  style={{ color: theme.subtleText }}
                >
                  or
                </span>
                <div
                  className="h-px flex-1"
                  style={{ background: theme.divider }}
                />
              </div>

              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:border-white/20"
                  style={{
                    color: theme.controlText,
                    border: `1px dashed ${theme.controlBorder}`,
                    background: "transparent",
                  }}
                >
                  Sign in with email instead
                </button>
              ) : (
                <form className="space-y-3 sm:space-y-4" onSubmit={handleLogin}>
                  {/* Email input */}
                  <div>
                    <label
                      className="mb-1 sm:mb-1.5 block text-[10px] sm:text-xs font-medium"
                      htmlFor="email"
                      style={{ color: theme.labelText }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none transition-all duration-200 focus:ring-2 ${
                        resolvedTheme === "light"
                          ? "placeholder-slate-500"
                          : "placeholder-white/25"
                      }`}
                      style={{
                        color: theme.inputText,
                        background: theme.controlBackground,
                        border: `1px solid ${theme.controlBorder}`,
                        // focus ring handled via onFocus/onBlur
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = theme.accent;
                        e.currentTarget.style.boxShadow = theme.focusRing;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = theme.controlBorder;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Password input */}
                  <div>
                    <div className="mb-1 sm:mb-1.5 flex items-center justify-between">
                      <label
                        className="text-[10px] sm:text-xs font-medium"
                        htmlFor="password"
                        style={{ color: theme.labelText }}
                      >
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-[10px] sm:text-xs font-medium transition-colors duration-200 hover:underline"
                        style={{ color: theme.accentBright }}
                      >
                        Forgot?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 pr-9 sm:pr-10 text-xs sm:text-sm outline-none transition-all duration-200 ${
                          resolvedTheme === "light"
                            ? "placeholder-slate-500"
                            : "placeholder-white/25"
                        }`}
                        style={{
                          color: theme.inputText,
                          background: theme.controlBackground,
                          border: `1px solid ${theme.controlBorder}`,
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = theme.accent;
                          e.currentTarget.style.boxShadow = theme.focusRing;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            theme.controlBorder;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                          resolvedTheme === "light"
                            ? "hover:text-slate-700"
                            : "hover:text-white/60"
                        }`}
                        style={{ color: theme.iconText }}
                      >
                        {showPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                              clipRule="evenodd"
                            />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign in button */}
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: success
                        ? "linear-gradient(135deg, #059669, #10b981)"
                        : theme.buttonBackground,
                      boxShadow: theme.buttonShadow,
                    }}
                  >
                    {success
                      ? "Redirecting..."
                      : loading
                        ? "Signing in..."
                        : "Sign in"}
                  </button>

                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-center text-[10px] sm:text-xs transition-colors duration-200 hover:underline"
                    style={{ color: theme.secondaryText }}
                  >
                    Back to Google sign in
                  </button>
                </form>
              )}

              {/* Footer */}
              <div
                className="mt-6 sm:mt-8 flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs"
                style={{ color: theme.footerText }}
              >
                <button
                  type="button"
                  onClick={() => setLegalModal("terms")}
                  className={`transition-colors hover:underline ${
                    resolvedTheme === "light"
                      ? "hover:text-slate-700"
                      : "hover:text-white/50"
                  }`}
                >
                  Terms
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setLegalModal("privacy")}
                  className={`transition-colors hover:underline ${
                    resolvedTheme === "light"
                      ? "hover:text-slate-700"
                      : "hover:text-white/50"
                  }`}
                >
                  Privacy
                </button>
              </div>
            </motion.div>

            {/* Below card note */}
            <p
              className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs italic px-2"
              style={{ color: theme.copyFaint }}
            >
              Your data is safe. Unlike your WP score on a bad sprint.
            </p>
          </div>
        </div>
      </div>

      {/* Legal modals */}
      {legalModal && (
        <LegalModal
          type={legalModal}
          onClose={() => setLegalModal(null)}
          theme={theme.modal}
        />
      )}
    </div>
  );
}
