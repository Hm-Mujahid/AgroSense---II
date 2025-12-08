import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, History, BarChart3, FlaskConical } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Predict', icon: FlaskConical },
    { path: '/history', label: 'History', icon: History },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="main-layout">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary-50" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Plant Disease</h1>
              <p className="text-xs text-slate-400 font-mono">Diagnostic System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 font-mono space-y-1">
            <p>Version 1.0.0</p>
            <p>ML Model: RandomForest</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;