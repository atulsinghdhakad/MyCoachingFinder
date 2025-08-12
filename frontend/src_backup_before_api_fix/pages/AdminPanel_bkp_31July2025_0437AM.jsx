// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { getIdToken } from 'firebase/auth';
import AuditLogsPanel from './AuditLogsPanel';
import OTPResendLogsPanel from './OTPResendLogsPanel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LogOut, Home, FileText, FileDown, Download, Users, BarChart3 } from 'lucide-react';




const MySwal = withReactContent(Swal);

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [idToken, setIdToken] = useState(null);
  const contactsPerPage = 5;
  const navigate = useNavigate();

  const [loginLogs, setLoginLogs] = useState([]);
  const [loginPage, setLoginPage] = useState(1);
  const [loginTotalPages, setLoginTotalPages] = useState(1);
  // Filters for login logs
  const [loginSearchTerm, setLoginSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (adminUser) => {
      const isAdminSession = localStorage.getItem('adminSession') === 'true';
      if (!adminUser || !isAdminSession) {
        navigate('/adminlogin');
      } else {
        const token = await adminUser.getIdToken(true);
        setIdToken(token);
        setUser({
          displayName: adminUser.displayName || 'Admin',
          email: adminUser.email,
          photoURL: adminUser.photoURL || null
        });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get('/api/admin/contacts');
        setContacts(response.data.contacts.reverse());
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    const fetchLoginLogs = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: loginPage,
          limit: 10,
          search: loginSearchTerm,
          provider: providerFilter,
          startDate,
          endDate
        });
        const res = await axios.get(`/api/admin/login-logs?${queryParams.toString()}`);
        setLoginLogs(res.data.logs);
        setLoginTotalPages(res.data.pagination.pages);
      } catch (err) {
        console.error("Error fetching login logs:", err);
      }
    };
    fetchLoginLogs();
  }, [loginPage, loginSearchTerm, providerFilter, startDate, endDate]);

  const downloadLoginCSV = () => {
    const csvRows = [
      ['User', 'Provider', 'Email/Phone', 'Login Time'],
      ...loginLogs.map(log => [
        `"${log.displayName || 'N/A'}"`,
        `"${log.provider}"`,
        `"${log.emailOrPhone}"`,
        `"${new Date(log.createdAt).toLocaleString()}"`
      ])
    ];
    const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'login_logs.csv');
    toast.success('🔐 Login Logs CSV Downloaded!', {
      position: 'top-center',
      style: {
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        color: '#fff',
        fontWeight: 'bold'
      }
    });
  };

  const downloadLoginPDF = () => {
    const doc = new jsPDF();
    doc.text('Login Logs Report', 14, 15);
    const rows = loginLogs.map(log => [
      log.displayName || 'N/A',
      log.provider,
      log.emailOrPhone,
      new Date(log.createdAt).toLocaleString()
    ]);
    autoTable(doc, {
      startY: 20,
      head: [['User', 'Provider', 'Email/Phone', 'Login Time']],
      body: rows,
    });
    doc.save('login_logs.pdf');
    toast.success('🔐 Login Logs PDF Downloaded!', {
      position: 'top-center',
      style: {
        background: 'linear-gradient(to right, #ff9966, #ff5e62)',
        color: '#fff',
        fontWeight: 'bold'
      }
    });
  };

  const handleLogout = async () => {
    const result = await MySwal.fire({
      title: 'Logout from Admin Panel?',
      text: 'You will be logged out of the admin panel only.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Logout',
      background: '#f9fafb',
    });
    if (result.isConfirmed) {
      localStorage.removeItem('adminSession');
      sessionStorage.removeItem('adminVerified');
      toast.success('👋 Admin logged out.');
      navigate('/adminlogin');
    }
  };

  const handleExit = () => {
    // Preserve admin session and just exit to home
    // Don't remove adminSession - keep it for when admin returns
    toast.success('🚪 Exited admin panel. You can return anytime!', {
      position: 'top-center',
      style: {
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        color: '#fff',
        fontWeight: 'bold'
      }
    });
    navigate('/');
  };

  const downloadCSV = () => {
    const csvRows = [
      ['Name', 'Email', 'Message', 'Submitted At'],
      ...contacts.map(c => [
        `"${c.name}"`, `"${c.email}"`, `"${c.message}"`, `"${new Date(c.createdAt).toLocaleString()}"`
      ])
    ];
    const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'contacts.csv');
    toast.success('📅 CSV Downloaded!', {
      style: {
        background: 'linear-gradient(to right, #00b09b, #96c93d)',
        color: '#fff',
        fontWeight: 'bold'
      },
      position: 'top-center'
    });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Contact Submissions Report', 14, 15);
    const rows = contacts.map(c => [c.name, c.email, c.message, new Date(c.createdAt).toLocaleString()]);
    autoTable(doc, {
      startY: 20,
      head: [['Name', 'Email', 'Message', 'Submitted At']],
      body: rows,
    });
    doc.save('contacts.pdf');
    toast.success('📄 PDF Downloaded!', {
      style: {
        background: 'linear-gradient(to right, #1d976c, #93f9b9)',
        color: '#fff',
        fontWeight: 'bold'
      },
      position: 'top-center'
    });
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: 'Delete Contact?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e3342f',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete!',
      background: '#f9fafb',
    });

    if (result.isConfirmed) {
      try {
        const deleted = contacts.find(c => c._id === id);
        await axios.delete(`/api/admin/contacts/${id}`);
        await axios.post('/api/admin/audit-log', {
          action: `Deleted contact from ${deleted.email}`,
          actor: user.email,
          timestamp: new Date().toISOString(),
        });
        const socket = window.adminSocket;
        if (socket) {
          socket.emit('adminAction', {
            type: 'CONTACT_DELETED',
            email: deleted.email,
            name: deleted.name,
            actor: user.email,
          });
        }
        setContacts(contacts.filter(c => c._id !== id));
        toast.success('✅ Contact Deleted & Logged!', {
          position: 'top-center',
          style: {
            background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
            color: '#fff'
          }
        });
      } catch (error) {
        console.error('Error deleting contact:', error);
        toast.error('Failed to delete contact.');
      }
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentContacts = filteredContacts.slice((currentPage - 1) * contactsPerPage, currentPage * contactsPerPage);
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    toast.success(`Page ${pageNumber}`, {
      position: 'bottom-center',
      style: { fontWeight: 'bold' }
    });
  };

  const totalSubmissions = contacts.length;
  const lastSubmissionTime = contacts[0]?.createdAt ? new Date(contacts[0].createdAt).toLocaleString() : 'N/A';
  const lastUserEmail = contacts[0]?.email || 'N/A';

  if (!user) return <div className="text-center text-purple-600 mt-40">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-black dark:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Welcome and Actions */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-purple-600">🎉 Welcome, Admin!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">You can manage contacts, users, and audit logs here.</p>
            <p className="mt-1 text-sm">Logged in as: <strong>{user.email}</strong></p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleExit} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-1">
              <Home size={16} /> <span>Exit</span>
            </button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-1">
              <LogOut size={16} /> <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-purple-600 text-white rounded-lg shadow text-center">
            <h3 className="text-3xl font-bold">{totalSubmissions}</h3>
            <p>Total Submissions</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-blue-600 text-white rounded-lg shadow text-center">
            <h3 className="text-lg">{lastSubmissionTime}</h3>
            <p>Last Submission</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-green-600 text-white rounded-lg shadow text-center">
            <h3 className="text-lg">{lastUserEmail}</h3>
            <p>Last User</p>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex justify-between mb-6">
          <input
            type="text"
            placeholder="Search by name/email..."
            className="w-full max-w-sm p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex space-x-2">
            <button onClick={downloadCSV} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-1">
              <FileDown size={16} /> <span>CSV</span>
            </button>
            <button onClick={downloadPDF} className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-1">
              <FileText size={16} /> <span>PDF</span>
            </button>
            <button onClick={downloadLoginCSV} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center space-x-1">
              <FileDown size={16} /> <span>Login CSV</span>
            </button>
            <button onClick={downloadLoginPDF} className="bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center space-x-1">
              <FileText size={16} /> <span>Login PDF</span>
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Message</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentContacts.map(c => (
                <tr key={c._id} className="bg-white dark:bg-gray-800 border-b">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.message}</td>
                  <td className="p-3">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(c._id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Logs */}
        {idToken && <AuditLogsPanel idToken={idToken} />}

        <div className="mt-16">
          <h2 className="text-xl font-bold mb-4 flex items-center text-purple-600">
            <BarChart3 className="w-5 h-5 mr-2" /> Login Activity Logs
          </h2>
          <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">Total: {loginLogs.length} logins on page {loginPage}</p>
          {/* Login Logs Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 space-y-3 md:space-y-0 md:space-x-4">
            <input
              type="text"
              placeholder="Search email/phone..."
              className="w-full max-w-xs p-2 rounded border dark:border-gray-700 dark:bg-gray-800"
              value={loginSearchTerm}
              onChange={(e) => setLoginSearchTerm(e.target.value)}
            />
            <select
              className="p-2 rounded border dark:border-gray-700 dark:bg-gray-800"
              onChange={(e) => setProviderFilter(e.target.value)}
              value={providerFilter}
            >
              <option value="">All Providers</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="password">Email</option>
              <option value="phone">Phone</option>
            </select>
            <input
              type="date"
              className="p-2 rounded border dark:border-gray-700 dark:bg-gray-800"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="p-2 rounded border dark:border-gray-700 dark:bg-gray-800"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Email / Phone</th>
                  <th className="p-3">Login Time</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => (
                  <tr key={log._id} className="bg-white dark:bg-gray-800 border-b">
                    <td className="p-3 font-medium">{log.displayName || 'N/A'}</td>
                    <td className="p-3 capitalize">{log.provider}</td>
                    <td className="p-3">{log.emailOrPhone}</td>
                    <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: loginTotalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setLoginPage(i + 1)}
                className={`px-3 py-1 rounded-full ${loginPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>


        {/* OTP Resend Logs */}
        <div className="mt-20">
          <OTPResendLogsPanel />
        </div>
        {/* Pagination */}
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: Math.ceil(filteredContacts.length / contactsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`px-3 py-1 rounded-full ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
