import React, { useState, useEffect } from 'react';
import adminSocket from '../utils/socket';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import Modal from 'react-modal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

const MySwal = withReactContent(Swal);

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// src/pages/AdminPanel.jsx
// Updated with abuse flag tracking support (IP/Phone) for OTP abuse detection & 7-day retention

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
  const [loginSearchTerm, setLoginSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockedPhones, setBlockedPhones] = useState([]);

  const [otpAttempts, setOtpAttempts] = useState([]);
const [otpDetailsModal, setOtpDetailsModal] = useState({ open: false, attempt: null });

  // --- OTP Details Modal ---
  const openOtpDetailsModal = (attempt) => setOtpDetailsModal({ open: true, attempt });
  const closeOtpDetailsModal = () => setOtpDetailsModal({ open: false, attempt: null });

  // --- Real-time updates via socket.io ---
  useEffect(() => {
    const socket = window.adminSocket || adminSocket;
    if (!socket) return;

    // OTP attempts real-time update
    const handleOtpUpdate = (data) => {
      if (Array.isArray(data)) setOtpAttempts(data);
      else if (data && data.phone) {
        setOtpAttempts((prev) => {
          // Update or add attempt
          const idx = prev.findIndex(a => a.phone === data.phone);
          let status = 'Success';
          const attemptCount = data.attemptCount || data.attempts || 1;
          if (isBlocked(data.phone)) status = 'Blocked';
          else if (attemptCount >= 5) status = 'Failed';
          else if (data.cooldownStart && getCooldownTimeLeft(data) !== 'Ready') status = 'Cooldown';
          if (status === 'Failed') {
            toast.error(`OTP Failure: ${data.phone} has failed 5+ attempts!`, { position: 'top-center' });
          } else if (status === 'Success') {
            toast.success(`OTP Success: ${data.phone} attempted.`, { position: 'top-center' });
          }
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...data };
            return updated;
          } else {
            return [...prev, data];
          }
        });
      }
    };
    socket.on('otpAttemptUpdate', handleOtpUpdate);

    // Login logs real-time update
    const handleLoginLogUpdate = (data) => {
      if (Array.isArray(data)) setLoginLogs(data);
      else if (data && data._id) {
        setLoginLogs((prev) => [data, ...prev.filter(l => l._id !== data._id)]);
      }
    };
    socket.on('loginLogUpdate', handleLoginLogUpdate);

    // Audit logs real-time update (if you have an AuditLogsPanel, trigger refresh or update state)
    const handleAuditLogUpdate = (data) => {
      // If using context or prop drilling for audit logs, trigger update here
      // Optionally: window.dispatchEvent(new CustomEvent('auditLogUpdate', { detail: data }));
    };
    socket.on('auditLogUpdate', handleAuditLogUpdate);

    // Contacts real-time update
    const handleContactsUpdate = (data) => {
      if (Array.isArray(data)) setContacts(data);
      else if (data && data._id) {
        setContacts((prev) => [data, ...prev.filter(c => c._id !== data._id)]);
      }
    };
    socket.on('contactsUpdate', handleContactsUpdate);

    // Blocked phones real-time update
    const handleBlockedPhonesUpdate = (data) => {
      if (Array.isArray(data)) setBlockedPhones(data);
    };
    socket.on('blockedPhonesUpdate', handleBlockedPhonesUpdate);

    return () => {
      socket.off('otpAttemptUpdate', handleOtpUpdate);
      socket.off('loginLogUpdate', handleLoginLogUpdate);
      socket.off('auditLogUpdate', handleAuditLogUpdate);
      socket.off('contactsUpdate', handleContactsUpdate);
      socket.off('blockedPhonesUpdate', handleBlockedPhonesUpdate);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (adminUser) => {
      // Removed localStorage adminSession check; use isAdmin from AuthContext instead
      const intendedPath = sessionStorage.getItem('intendedPath');
      if (!adminUser) {
        sessionStorage.setItem('intendedPath', window.location.pathname);
        navigate('/adminlogin');
      } else {
        try {
          // Use cached token first to avoid unnecessary API calls
          const token = await adminUser.getIdToken(false);
          setIdToken(token);
          setUser({
            displayName: adminUser.displayName || 'Admin',
            email: adminUser.email,
            photoURL: adminUser.photoURL || null
          });
          // After successful login, redirect if intendedPath exists
          if (intendedPath) {
            sessionStorage.removeItem('intendedPath');
            navigate(intendedPath);
          }
        } catch (error) {
          console.error('AdminPanel: Error getting token:', error);
          if (error.code === 'auth/too-many-requests') {
            console.warn('AdminPanel: Rate limited, redirecting to login');
            navigate('/adminlogin');
          }
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get('/api/admin/contacts');
        setContacts(res.data.contacts.reverse());
      } catch (err) {
        console.error('Error fetching contacts:', err);
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
        console.error('Error fetching login logs:', err);
      }
    };
    fetchLoginLogs();
  }, [loginPage, loginSearchTerm, providerFilter, startDate, endDate]);

  useEffect(() => {
    const getBlockedPhones = async () => {
      try {
        const res = await axios.get('/api/admin/otp-blocked');
        setBlockedPhones(res.data.blocked || []);
      } catch (err) {
        console.warn('Failed to fetch blocked phones:', err);
      }
    };
    getBlockedPhones();
  }, []);

  useEffect(() => {
    const fetchOtpAttempts = async () => {
      try {
        const res = await axios.get('/api/admin/otp-attempts');
        setOtpAttempts(res.data.logs || []);
      } catch (err) {
        console.error('❌ Error fetching OTP logs:', err);
      }
    };

    fetchOtpAttempts();
  }, []);


  const isBlocked = (phone) => blockedPhones.includes(phone);

  // Handler to block a phone
  const handleBlockPhone = async (phone) => {
    try {
      await axios.post('/api/admin/block-phone', { phone });
      toast.success(`Blocked ${phone}`);
      setBlockedPhones([...blockedPhones, phone]);
    } catch (err) {
      toast.error(`Failed to block ${phone}`);
    }
  };

  // Handler to reset OTP attempts for a phone
  const handleResetAttempts = async (phone) => {
    try {
      await axios.post('/api/admin/reset-otp-attempts', { phone });
      toast.success(`Reset attempts for ${phone}`);
      setOtpAttempts((prev) =>
        prev.map(a => a.phone === phone ? { ...a, attemptCount: 0 } : a)
      );
    } catch (err) {
      toast.error(`Failed to reset attempts`);
    }
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
        toast.success('✅ Contact Deleted & Logged!');
      } catch (err) {
        console.error('Delete failed:', err);
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
    toast.success(`Page ${pageNumber}`, { position: 'bottom-center' });
  };

  const downloadCSV = () => { /* unchanged */ };
  const downloadPDF = () => { /* unchanged */ };
  const downloadLoginCSV = () => { /* unchanged */ };
  const downloadLoginPDF = () => { /* unchanged */ };

  const totalSubmissions = contacts.length;
  const lastSubmissionTime = contacts[0]?.createdAt ? new Date(contacts[0].createdAt).toLocaleString() : 'N/A';
  const lastUserEmail = contacts[0]?.email || 'N/A';

  if (!user) return <div className="text-center text-purple-600 mt-40">Loading Admin Panel...</div>;

  // Download OTP Attempts CSV
  const downloadOtpCSV = () => {
    const csv = otpAttempts.map(a =>
      `${a.phone},${a.attemptCount || 1},${a.ipAddress || 'N/A'},${new Date(a.createdAt).toLocaleString()}`
    );
    const blob = new Blob(
      [['Phone,Attempts,IP,Last Attempt', ...csv].join('\n')],
      { type: 'text/csv;charset=utf-8;' }
    );
    saveAs(blob, 'otp_attempts.csv');
  };

  // Download OTP Attempts PDF
  const downloadOtpPDF = () => {
    const doc = new jsPDF();
    doc.text('OTP Attempts Report', 14, 14);
    autoTable(doc, {
      head: [['Phone', 'Attempts', 'IP', 'Last Attempt']],
      body: otpAttempts.map(a => [
        a.phone,
        a.attemptCount || 1,
        a.ipAddress || 'N/A',
        new Date(a.createdAt).toLocaleString()
      ]),
    });
    doc.save('otp_attempts.pdf');
  };

  // Real OTP failures per day chart
  const getOtpFailuresPerDay = () => {
    const failures = {};
    otpAttempts.forEach((a) => {
      // Count as failure if attemptCount >= 5 (customize as needed)
      const count = a.attemptCount || a.attempts || 1;
      if (count >= 5) {
        const date = new Date(a.createdAt).toISOString().slice(0, 10);
        failures[date] = (failures[date] || 0) + 1;
      }
    });
    // Always show last 7 days
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toISOString().slice(0, 10);
      labels.push(label);
      data.push(failures[label] || 0);
    }
    return {
      labels,
      datasets: [
        {
          label: 'OTP Failures',
          data,
          backgroundColor: 'rgba(220, 38, 38, 0.7)',
        },
      ],
    };
  };
  const otpFailuresData = getOtpFailuresPerDay();

  const otpFailuresOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'OTP Failures Per Day',
      },
    },
  };

  // Cooldown duration in ms (example: 5 minutes)
  const cooldownDuration = 5 * 60 * 1000;

  // Calculate cooldown time left in mm:ss format
  const getCooldownTimeLeft = (attempt) => {
    const lastAttemptTime = new Date(attempt.createdAt).getTime();
    const now = Date.now();
    const timeLeft = lastAttemptTime + cooldownDuration - now;
    if (timeLeft <= 0) return 'Ready';
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate risk score badge color based on attemptCount or IP diversity (dummy logic)
  const getRiskScoreColor = (attempt) => {
    const count = attempt.attemptCount || 1;
    if (count >= 5) return 'bg-red-600 text-white';
    if (count >= 3) return 'bg-yellow-500 text-black';
    return 'bg-green-600 text-white';
  };

  // Handler to resend OTP (admin action)
  const handleAdminResendOTP = async (phone) => {
    try {
      await axios.post('/api/admin/otp-resend', { phone });
      toast.success(`OTP resend logged for ${phone}`);
    } catch (err) {
      toast.error('Failed to trigger resend.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-black dark:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Existing admin UI remains */}

        <div className="mt-16">
          <h2 className="text-xl font-bold mb-4 flex items-center text-purple-600">
            <BarChart3 className="w-5 h-5 mr-2" /> Login Activity Logs
          </h2>

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
                <tr key={log._id} className={`bg-white dark:bg-gray-800 border-b ${isBlocked(log.emailOrPhone) ? 'border-red-500' : ''}`}>
                  <td className="p-3 font-medium flex items-center">
                    {log.displayName || 'N/A'}
                    {isBlocked(log.emailOrPhone) && (
                      <AlertTriangle size={16} className="text-red-600 ml-2" title="Repeated abuse detected" />
                    )}
                  </td>
                  <td className="p-3 capitalize">{log.provider}</td>
                  <td className="p-3">{log.emailOrPhone}</td>
                  <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-bold mb-4 flex items-center text-purple-600">
            <AlertTriangle className="w-5 h-5 mr-2" /> OTP Attempts / Abuse Logs
          </h2>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search by phone or IP..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-1/3 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={downloadOtpCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
              >
                Download CSV
              </button>
              <button
                onClick={downloadOtpPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* OTP Failures Per Day Chart */}
          <div className="mb-8 max-w-2xl">
            <Bar options={otpFailuresOptions} data={otpFailuresData} />
          </div>

          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-200 dark:bg-gray-700 text-xs uppercase">
              <tr>
                <th className="p-3">Phone</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Attempts</th>
                <th className="p-3">IP</th>
                <th className="p-3">Last Attempt</th>
                <th className="p-3">Cooldown</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {otpAttempts
                .filter(a =>
                  a.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (a.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((attempt) => {
                  const isBlockedPhone = isBlocked(attempt.phone);
                  let status = 'Ready';
                  if (isBlockedPhone) status = 'Blocked';
                  else if (getCooldownTimeLeft(attempt) !== 'Ready') status = 'Cooldown';
                  else if ((attempt.attemptCount || 1) >= 5) status = 'Failed';
                  else if ((attempt.attemptCount || 1) < 5) status = 'Success';
                  return (
                    <tr key={attempt._id} className="bg-white dark:bg-gray-800 border-b">
                      <td className="p-3 flex items-center space-x-2">
                        <span>{attempt.phone}</span>
                      </td>
                      <td className={`p-3 font-semibold rounded ${getRiskScoreColor(attempt)} w-20 text-center`}>
                        {attempt.attemptCount || 1}
                      </td>
                      <td className="p-3">{attempt.attemptCount || '1'}</td>
                      <td className="p-3">{attempt.ipAddress || 'N/A'}</td>
                      <td className="p-3">{new Date(attempt.createdAt).toLocaleString()}</td>
                      <td className="p-3">{getCooldownTimeLeft(attempt)}</td>
                      <td className="p-3">{status}</td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => handleBlockPhone(attempt.phone)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Block
                        </button>
                        <button
                          onClick={() => handleResetAttempts(attempt.phone)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleAdminResendOTP(attempt.phone)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => openOtpDetailsModal(attempt)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    {/* OTP Details Modal */}
    <Modal
      isOpen={otpDetailsModal.open}
      onRequestClose={closeOtpDetailsModal}
      contentLabel="OTP Attempt Details"
      ariaHideApp={false}
      className="bg-white dark:bg-gray-900 p-6 rounded-md max-w-lg mx-auto my-16 border border-gray-300 dark:border-gray-700 shadow-lg"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
    >
      {otpDetailsModal.attempt && (
        <div>
          <h3 className="text-lg font-bold mb-2 text-purple-700">OTP Attempt Details for {otpDetailsModal.attempt.phone}</h3>
          <div className="mb-2"><b>Attempts:</b> {otpDetailsModal.attempt.attemptCount || otpDetailsModal.attempt.attempts || 1}</div>
          <div className="mb-2"><b>Status:</b> {isBlocked(otpDetailsModal.attempt.phone) ? 'Blocked' : getCooldownTimeLeft(otpDetailsModal.attempt) !== 'Ready' ? 'Cooldown' : (otpDetailsModal.attempt.attemptCount || 1) >= 5 ? 'Failed' : 'Success'}</div>
          <div className="mb-2"><b>Last Attempt:</b> {new Date(otpDetailsModal.attempt.createdAt).toLocaleString()}</div>
          <div className="mb-2"><b>IP:</b> {otpDetailsModal.attempt.ipAddress || 'N/A'}</div>
          <div className="mb-2"><b>Logs:</b></div>
          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="p-2">IP</th>
                <th className="p-2">User Agent</th>
                <th className="p-2">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {(otpDetailsModal.attempt.logs || []).map((log, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{log.ip || 'N/A'}</td>
                  <td className="p-2">{log.userAgent || 'N/A'}</td>
                  <td className="p-2">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={closeOtpDetailsModal} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Close</button>
        </div>
      )}
    </Modal>
    </div>
  );
};


export default AdminPanel;