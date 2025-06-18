import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Briefcase, DollarSign, CheckSquare, Menu, X, BarChart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tasks, setTasks] = useState([]);

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error('Error fetching tasks:', err));
  }, []);

  const navigationItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/clients', icon: <Users size={20} />, label: 'Clients' },
    { path: '/projects', icon: <Briefcase size={20} />, label: 'Projects' },
    { path: '/tasks', icon: <CheckSquare size={20} />, label: 'Tasks' },
    { path: '/finances', icon: <DollarSign size={20} />, label: 'Finances' },
    { path: '/reports', icon: <BarChart size={20} />, label: 'Reports' },
  ];

  const NavLinks = () => (
    <ul className="space-y-2">
      {navigationItems.map((item) => (
        <li key={item.path}>
          <Link
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              isActivePath(item.path) 
                ? 'bg-primary-50 text-primary-600 font-medium' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Desktop */}
      <nav className="hidden lg:block w-64 bg-white shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Client Manager</h1>
        </div>
        <div className="p-4">
          <NavLinks />
        </div>
      </nav>

      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <nav className="fixed inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-200 ease-in-out">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800">Client Manager</h1>
            </div>
            <div className="p-4">
              <NavLinks />
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 