import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaProjectDiagram, FaTasks, FaChartLine, FaFileAlt } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: <FaHome />, text: 'Dashboard' },
    { path: '/clients', icon: <FaUsers />, text: 'Clients' },
    { path: '/projects', icon: <FaProjectDiagram />, text: 'Projects' },
    { path: '/tasks', icon: <FaTasks />, text: 'Tasks' },
    { path: '/finances', icon: <FaChartLine />, text: 'Finances' },
    { path: '/reports', icon: <FaFileAlt />, text: 'Reports' }
  ];

  return (
    <nav className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="text-2xl font-bold mb-8">Client Manager</div>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-700 ${
                isActive(item.path) ? 'bg-gray-700' : ''
              }`}
            >
              {item.icon}
              <span>{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar; 