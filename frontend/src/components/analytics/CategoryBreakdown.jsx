// frontend/src/components/analytics/CategoryBreakdown.jsx
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CategoryBreakdown = ({ data }) => {
  const chartData = {
    labels: data.map(d => d._id),
    datasets: [
      {
        label: 'Storage by Category',
        data: data.map(d => d.totalSize),
        backgroundColor: [
          '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Storage by File Type' },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-96">
      {data.length > 0 ? (
        <Doughnut data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No category data to display.</p>
        </div>
      )}
    </div>
  );
};
export default CategoryBreakdown;