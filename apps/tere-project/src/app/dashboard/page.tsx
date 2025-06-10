'use client';
import useUser from '@src/hooks/useUser';

export default function Dashboard() {
  const { getDisplayName } = useUser();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-accent via-muted text-center space-y-6 px-4">
      <h1 className="text-5xl font-extrabold text-primary transition-transform duration-500 hover:scale-110 hover:rotate-1">
        👋 Yo! {getDisplayName()}!
      </h1>

      <p className="text-xl text-secondary font-medium transition-all duration-300 hover:tracking-wider hover:text-primary">
        Ready to rock this day? Let’s code and conquer 💻🔥
      </p>

      <div className="mt-6 bg-muted px-6 py-4 rounded-2xl shadow-xl text-gray-800 text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:rotate-1">
        <span className="inline-block animate-bounce text-2xl">📊</span>
        <span className="ml-2">
          Click the menu and make some magic happen ✨
        </span>
      </div>

      <p className="text-sm text-gray-500 italic animate-pulse">
        Try hovering over elements for some fun surprises! 🎉
      </p>
    </div>
  );
}
