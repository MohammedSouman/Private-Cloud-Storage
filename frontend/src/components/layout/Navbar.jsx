import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Cloud, Files, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = "flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700";
  const activeLinkClass = "flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-900 bg-gray-100";

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={isAuthenticated ? "/files" : "/"} className="flex-shrink-0 flex items-center text-indigo-600">
              <Cloud size={28} />
              <span className="ml-2 font-bold text-xl">PrivacyCloud</span>
            </Link>
            {/* Navigation Links for logged-in users */}
            {isAuthenticated && (
                <div className="hidden md:flex items-center space-x-4 ml-10">
                    <NavLink to="/files" className={({isActive}) => isActive ? activeLinkClass : linkClass}>
                       <Files size={16} className="mr-2" /> My Files
                    </NavLink>
                    <NavLink to="/dashboard" className={({isActive}) => isActive ? activeLinkClass : linkClass}>
                       <LayoutDashboard size={16} className="mr-2" /> Dashboard
                    </NavLink>
                </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <LogOut size={20} className="mr-1" />
                Logout
              </button>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-gray-500 hover:text-gray-700">Login</Link>
                <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;