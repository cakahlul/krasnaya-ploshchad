'use client';

import { useState, FormEvent, useEffect } from 'react';
import { login, signInWithGoogle } from '@src/lib/auth';
import useUser from '@src/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { loginPageMessage } = useUser();
  const router = useRouter();
  
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      alert(String(error));
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans h-screen flex flex-col md:flex-row overflow-hidden text-text-main-light dark:text-text-main-dark transition-colors duration-300">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden animated-mesh items-center justify-center">
        <div className="floating-shape bg-blue-400 w-96 h-96 top-1/4 left-1/4 animate-float-login"></div>
        <div className="floating-shape bg-indigo-500 w-80 h-80 bottom-1/4 right-1/4 animate-float-login" style={{ animationDelay: '-2s' }}></div>
        <div className="floating-shape bg-purple-500 w-64 h-64 top-1/2 left-1/2 animate-float-login" style={{ animationDelay: '-4s' }}></div>
        
        <div className="relative z-10 glass-effect bg-white/10 dark:bg-black/10 border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md text-white backdrop-blur-md transform transition-transform hover:scale-105 duration-500">
          <h2 className="text-4xl font-bold mb-4 drop-shadow-md">Tere Project</h2>
          <p className="text-lg text-gray-200 leading-relaxed">
            Team Reporting and Application Monitoring Summary. Track productivity, bugs, and performance seamlessly.
          </p>
          <div className="mt-6 flex space-x-2">
            <div className="h-1 w-12 bg-white rounded-full opacity-100"></div>
            <div className="h-1 w-12 bg-white rounded-full opacity-50"></div>
            <div className="h-1 w-12 bg-white rounded-full opacity-50"></div>
          </div>
        </div>
        
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}
        ></div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center p-6 md:p-12 lg:p-24 bg-card-light dark:bg-card-dark relative">
        <button 
          type="button"
          onClick={() => setIsDark(!isDark)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-text-sub-light dark:text-text-sub-dark"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className="w-full max-w-md animate-slide-up-login space-y-8">
          {loginPageMessage && (
            <div className="bg-primary-brand/10 border-l-4 border-primary-brand p-4 rounded-md">
              <p className="text-primary-brand text-sm font-medium">{loginPageMessage}</p>
            </div>
          )}

          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold text-primary-brand flex items-center justify-center md:justify-start gap-2">
              👋 Welcome Back!
            </h1>
            <p className="text-text-sub-light dark:text-text-sub-dark">
              Login to continue your journey
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-sub-light dark:text-text-sub-dark group-focus-within:text-primary-brand transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-input-border-light dark:border-input-border-dark rounded-lg leading-5 bg-background-light dark:bg-background-dark placeholder-text-sub-light dark:placeholder-text-sub-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-2 focus:ring-primary-brand focus:border-primary-brand sm:text-sm transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-medium text-primary-brand hover:text-primary-hover transition-colors" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-sub-light dark:text-text-sub-dark group-focus-within:text-primary-brand transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-input-border-light dark:border-input-border-dark rounded-lg leading-5 bg-background-light dark:bg-background-dark placeholder-text-sub-light dark:placeholder-text-sub-dark text-text-main-light dark:text-text-main-dark focus:outline-none focus:ring-2 focus:ring-primary-brand focus:border-primary-brand sm:text-sm transition-all duration-200 shadow-sm"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || success}
              className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white shadow-lg shadow-primary-brand/30 transform transition-all duration-200 ${
                success 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-primary-brand hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
              } disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed`}
            >
              {success ? 'Login Successful! Redirecting...' : loading ? 'Logging in...' : 'Login 🚀'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-input-border-light dark:border-input-border-dark"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card-light dark:bg-card-dark text-text-sub-light dark:text-text-sub-dark">
                or
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={async () => {
              setLoading(true);
              try {
                await signInWithGoogle();
                setSuccess(true);
                setTimeout(() => {
                  router.push('/dashboard');
                }, 1000);
              } catch (error) {
                alert(String(error) || 'Google login failed');
                setLoading(false);
              }
            }}
            disabled={loading || success}
            className="w-full flex items-center justify-center py-3 px-4 border border-input-border-light dark:border-input-border-dark rounded-lg shadow-sm bg-white dark:bg-background-dark text-sm font-medium text-text-main-light dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <svg aria-hidden="true" className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Login with Google ✨
          </button>
          
          <p className="mt-8 text-center text-xs text-text-sub-light dark:text-text-sub-dark animate-fade-in delay-150">
            Made with ✨ and 0 bugs (hopefully) by{' '}
            <a 
              href="https://github.com/cakahlul" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold text-primary-brand hover:underline"
            >
              Esasjana 🚀
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
