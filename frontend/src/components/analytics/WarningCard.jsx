// frontend/src/components/analytics/WarningCard.jsx
import React from 'react';

const WarningCard = ({ icon, title, color, children }) => {
  return (
    <div className={`bg-${color}-50 border-l-4 border-${color}-400 p-4 rounded-md shadow-sm mb-6`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-bold text-${color}-800`}>{title}</p>
        </div>
      </div>
      <div className="mt-2 ml-8">
        {children}
      </div>
    </div>
  );
};
export default WarningCard;