import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, DollarSign, CheckSquare } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <nav className="w-64 bg-white shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Client Manager</h1>
        </div>
        <ul className="space-y-2 p-4">
          <li>
            <Link
              to="/"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActivePath('/') 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/clients"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActivePath('/clients') 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <span>Clients</span>
            </Link>
          </li>
          <li>
            <Link
              to="/projects"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActivePath('/projects') 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={20} />
              <span>Projects</span>
            </Link>
          </li>
          <li>
            <Link
              to="/tasks"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActivePath('/tasks') 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CheckSquare size={20} />
              <span>Tasks</span>
            </Link>
          </li>
          <li>
            <Link
              to="/finances"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActivePath('/finances') 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign size={20} />
              <span>Finances</span>
            </Link>
          </li>
          <li>
            <Link
              to="/reports"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActivePath('/reports') 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={20} />
              <span>Reports</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 