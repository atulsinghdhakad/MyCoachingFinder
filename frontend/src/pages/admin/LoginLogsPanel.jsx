// src/pages/admin/LoginLogsPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Input, Select, DatePicker, Pagination } from 'antd';
import { CalendarDays, User, Mail } from 'lucide-react';
const { RangePicker } = DatePicker;

const LoginLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', provider: '', dateRange: [] });

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get('/api/admin/login-logs', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          provider: filters.provider,
          startDate: filters.dateRange[0],
          endDate: filters.dateRange[1]
        }
      });
      setLogs(data.logs);
      setPagination(prev => ({ ...prev, total: data.pagination.total }));
    } catch (err) {
      console.error('Failed to fetch login logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const columns = [
    {
      title: <User className="inline mr-1 w-4 h-4" />,
      dataIndex: 'displayName',
      key: 'displayName'
    },
    {
      title: <Mail className="inline mr-1 w-4 h-4" />,
      dataIndex: 'emailOrPhone',
      key: 'emailOrPhone'
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider'
    },
    {
      title: <CalendarDays className="inline mr-1 w-4 h-4" />,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => new Date(date).toLocaleString()
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Login Logs</h2>

      <div className="flex gap-4 mb-4 flex-wrap">
        <Input
          placeholder="Search user or email/phone"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="w-64"
        />
        <Select
          placeholder="Provider"
          value={filters.provider || undefined}
          onChange={val => setFilters(f => ({ ...f, provider: val }))}
          allowClear
          className="w-48"
          options={[
            { value: 'google', label: 'Google' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'password', label: 'Email/Password' },
            { value: 'phone', label: 'Phone' }
          ]}
        />
        <RangePicker
          onChange={(dates) =>
            setFilters(f => ({
              ...f,
              dateRange: dates?.length === 2
                ? [dates[0].startOf('day').toISOString(), dates[1].endOf('day').toISOString()]
                : []
            }))
          }
        />
      </div>

      <Table
        dataSource={logs}
        columns={columns}
        pagination={false}
        rowKey="_id"
      />
      <div className="mt-4 flex justify-end">
        <Pagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={page => setPagination(p => ({ ...p, page }))}
        />
      </div>
    </div>
  );
};

export default LoginLogsPanel;


