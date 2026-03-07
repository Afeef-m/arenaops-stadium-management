// src/app/(dashboard)/manager/layout.tsx

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-semibold mb-4">Manager Panel</h2>
        <nav className="space-y-2">
          <a href="/manager/stadiums/generator" className="block hover:text-green-400">
            Stadium Generator
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}