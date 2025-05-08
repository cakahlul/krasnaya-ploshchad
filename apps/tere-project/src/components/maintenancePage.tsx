'use client';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-accent via-muted to-white text-center px-6 relative overflow-hidden">
      <div className="animate-slot-in mb-8 text-6xl">🛠️</div>

      <h1 className="text-3xl font-bold text-primary animate-slot-in mb-2">
        We’re Fixing Things Up!
      </h1>

      <p className="text-secondary text-base max-w-md animate-slot-in delay-200">
        This page is currently under maintenance. We’re brewing fresh code,
        chasing bugs, and probably arguing over dark mode vs light mode. Come
        back later — it’ll be worth it 🚀
      </p>

      <div className="mt-10 animate-slot-in delay-300">
        <button
          onClick={() => window.location.reload()}
          className="bg-secondary hover:bg-primary text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 active:scale-95"
        >
          Try Again Later 🔄
        </button>
      </div>
    </div>
  );
}
