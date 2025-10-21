// frontend/src/components/analytics/StatCard.jsx
import React from 'react';

const StatCard = ({ icon, title, value, color }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
      <div className={`rounded-full p-3 mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};
export default StatCard;