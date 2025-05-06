export default function Home() {
  const username = 'Esasjana';
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <h1 className="text-5xl font-extrabold text-primary">
        Hi, welcome {username}!
      </h1>
      <p className="text-xl text-gray-600">Let’s make today productive 💪</p>
      <div className="mt-6 bg-muted px-6 py-4 rounded-lg shadow-md text-gray-800">
        Explore your dashboard from the side menu 🚀
      </div>
    </div>
  );
}
