'use client';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">

      <h1 className="mb-2 text-3xl font-bold text-primary">
        Maintenance in progress
      </h1>

      <p className="max-w-md text-base text-slate-600 dark:text-slate-300">
        This service is temporarily unavailable while maintenance is performed.
      </p>

      <div className="mt-10">
        <button
          onClick={() => window.location.reload()}
          className="bg-secondary hover:bg-primary text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 active:scale-95"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
