// frontend/src/components/analytics/ActivityLogTable.jsx
import React from 'react';
import { Upload, Download, Eye, Trash2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const iconMap = {
  upload: <Upload size={16} className="text-blue-500" />,
  download: <Download size={16} className="text-green-500" />,
  view: <Eye size={16} className="text-purple-500" />,
  delete: <Trash2 size={16} className="text-orange-500" />,
  restore: <RotateCcw size={16} className="text-teal-500" />,
  permanent_delete: <Trash2 size={16} className="text-red-500" />,
};

const ActivityLogTable = ({ logs }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log._id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {iconMap[log.actionType]}
                    <span className="text-sm font-medium capitalize">{log.actionType.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{log.filename}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {log.status === 'success' ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ActivityLogTable;