import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Capriccio
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/catalog" className="text-gray-700 hover:text-gray-900">
              Каталог
            </Link>
            <Link to="/account" className="text-gray-700 hover:text-gray-900">
              Аккаунт
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="text-gray-400">© 2026 Capriccio</div>
        </div>
      </footer>
    </div>
  );
}
