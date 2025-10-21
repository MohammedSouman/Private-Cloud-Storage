import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import StatCard from '../components/analytics/StatCard';
import CategoryBreakdown from '../components/analytics/CategoryBreakdown';
import WarningCard from '../components/analytics/WarningCard';
import ActivityLogTable from '../components/analytics/ActivityLogTable';
import { File, HardDrive, AlertTriangle, Copy, Zap, Snowflake, BarChart2, RefreshCw, Loader2 } from 'lucide-react';

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Dashboard = () => {
    const [stats, setStats] = useState(null); // Start with null to better handle loading
    const [loading, setLoading] = useState(true);

    // This is our data fetching function
    const fetchAllStats = useCallback(async () => {
        setLoading(true); // Set loading true at the start of fetch
        try {
            const [summaryRes, duplicatesRes, largeFilesRes, usageRes, categoriesRes, logsRes] = await Promise.all([
                api.get('/analytics/storage-summary'),
                api.get('/analytics/duplicates'),
                api.get('/analytics/large-files'),
                api.get('/analytics/usage-stats'),
                api.get('/analytics/categories'),
                api.get('/analytics/logs?limit=10'),
            ]);
            setStats({
                summary: summaryRes.data,
                duplicates: duplicatesRes.data,
                largeFiles: largeFilesRes.data,
                usage: usageRes.data,
                categories: categoriesRes.data,
                logs: logsRes.data.logs,
            });
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data on initial component load
    useEffect(() => {
        fetchAllStats();
    }, [fetchAllStats]);

    if (!stats) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
                </div>
            </div>
        );
    }

    const duplicateStorageWasted = stats.duplicates.reduce((acc, group) => acc + (group.docs[0].size * (group.count - 1)), 0);

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="py-10">
                <header>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900">Analytics Dashboard</h1>
                        {/* --- THE REFRESH BUTTON --- */}
                        <button
                            onClick={fetchAllStats}
                            disabled={loading}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                        >
                            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto sm:px-6 lg:px-8 mt-8 space-y-8">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<HardDrive size={24} />} title="Total Storage Used" value={formatBytes(stats.summary?.totalSize)} color="bg-blue-100 text-blue-600" />
                        <StatCard icon={<File size={24} />} title="Total Files" value={stats.summary?.totalFiles} color="bg-green-100 text-green-600" />
                        <StatCard icon={<BarChart2 size={24} />} title="Duplicate Sets" value={stats.duplicates.length} color="bg-yellow-100 text-yellow-600" />
                    </div>

                    {/* Warning Sections */}
                    {stats.duplicates.length > 0 && (
                        <WarningCard icon={<Copy size={20} className="text-orange-500" />} title={`Found ${stats.duplicates.length} sets of duplicate files wasting ${formatBytes(duplicateStorageWasted)}`} color="orange">
                            <ul className="text-sm text-orange-700 list-disc pl-5 space-y-1">
                                {stats.duplicates.slice(0, 3).map(dup => (
                                    <li key={dup._id.originalFilename}>"{dup._id.originalFilename}" ({dup.count} copies)</li>
                                ))}
                            </ul>
                        </WarningCard>
                    )}
                    {stats.largeFiles.length > 0 && (
                        <WarningCard icon={<AlertTriangle size={20} className="text-red-500" />} title={`Found ${stats.largeFiles.length} large files (> 10MB)`} color="red">
                             <p className="text-sm text-red-700">Consider compressing these files to save space. Largest file: "{stats.largeFiles[0].originalFilename}" ({formatBytes(stats.largeFiles[0].size)})</p>
                        </WarningCard>
                    )}
                    
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                           <ActivityLogTable logs={stats.logs} />
                        </div>
                        <div>
                           <CategoryBreakdown data={stats.categories} />
                        </div>
                    </div>
                    
                    {/* Usage Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                           <h3 className="text-lg font-semibold mb-4 flex items-center"><Zap size={20} className="text-green-500 mr-2" /> Hot Files (Recently Accessed)</h3>
                           <ul className="space-y-2 text-sm">
                               {stats.usage?.hotFiles.map(file => <li key={file._id} className="flex justify-between"><span>{file.originalFilename}</span><span className="text-gray-500">{new Date(file.lastAccessed).toLocaleDateString()}</span></li>)}
                           </ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                           <h3 className="text-lg font-semibold mb-4 flex items-center"><Snowflake size={20} className="text-blue-500 mr-2" /> Cold Files (Not Accessed {'>'} 90 days)</h3>
                           <ul className="space-y-2 text-sm">
                               {stats.usage?.coldFiles.map(file => <li key={file._id} className="flex justify-between"><span>{file.originalFilename}</span><span className="text-gray-500">{new Date(file.lastAccessed).toLocaleDateString()}</span></li>)}
                           </ul>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;