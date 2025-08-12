import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { saveAs } from 'file-saver';

const AuditLogsPanel = ({ setUnreadLogs }) => {
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/audit-logs');
      const sorted = res.data.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(sorted);
      if (setUnreadLogs) setUnreadLogs(sorted.length);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 15000); // refresh every 15s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredLogs = logs.filter(log => {
    const logTime = new Date(log.timestamp);
    return (!fromDate || logTime >= new Date(fromDate)) &&
           (!toDate || logTime <= new Date(toDate + 'T23:59:59'));
  });

  const exportToCSV = () => {
    const headers = ['Action', 'Actor', 'Timestamp'];
    const rows = filteredLogs.map(log => [
      `"${log.action}"`, `"${log.actor}"`, `"${new Date(log.timestamp).toLocaleString()}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'audit_logs.csv');
    toast.success('📥 CSV exported');
  };

  return (
    <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-600">📋 Audit Logs</h2>
        <div className="flex space-x-2">
          <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Export CSV
          </button>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(prev => !prev)}
              className="form-checkbox"
            />
            <span className="text-gray-700 dark:text-gray-200">Auto-refresh</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full p-2 rounded border dark:bg-gray-700"
          />
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {filteredLogs.map((log, index) => (
          <motion.div
            key={index}
            className="p-4 border-l-4 border-purple-500 bg-gray-50 dark:bg-gray-700 rounded shadow"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm text-gray-800 dark:text-gray-100">
              <strong>{log.actor}</strong> performed <strong>{log.action}</strong>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </motion.div>
        ))}
        {filteredLogs.length === 0 && (
          <p className="text-gray-500 text-center">No logs found for selected date range.</p>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPanel;
