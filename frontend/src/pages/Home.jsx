// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Secure Cloud</h1>
      <p className="text-lg text-gray-600 mb-8">Client-side encryption for ultimate privacy. Your files, your keys.</p>
      <div className="space-x-4">
        <Link to="/login" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Login</Link>
        <Link to="/register" className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Register</Link>
      </div>
    </div>
  );
};

export default Home;