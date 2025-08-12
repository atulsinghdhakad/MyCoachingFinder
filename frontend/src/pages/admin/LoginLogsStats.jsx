// src/pages/admin/LoginLogStats.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from 'antd';
import { BarChart2, Clock } from 'lucide-react';

const LoginLogStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/api/admin/login-log-stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Stats fetch error', err));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
      <Card>
        <div className="flex items-center space-x-3">
          <BarChart2 className="text-purple-600" />
          <div>
            <p className="text-sm">Total Logins</p>
            <p className="text-lg font-semibold">{stats.totalLogins}</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center space-x-3">
          <Clock className="text-blue-600" />
          <div>
            <p className="text-sm">Last Login</p>
            <p className="text-lg font-semibold">{new Date(stats.lastLogin?.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </Card>
      <Card>
        <div>
          <p className="text-sm mb-2">Provider Breakdown</p>
          {stats.providerCounts.map(item => (
            <p key={item._id} className="text-sm text-gray-700">
              {item._id}: <span className="font-semibold">{item.count}</span>
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LoginLogStats;
