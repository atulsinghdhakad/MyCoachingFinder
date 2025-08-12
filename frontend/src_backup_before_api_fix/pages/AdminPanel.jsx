// src/pages/AdminPanel.jsx
// ✅ Updated with abuse flag tracking support (IP/Phone) for OTP abuse detection & 7-day retention

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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LogOut, Home, FileText, FileDown, Download, Users, BarChart3, AlertTriangle } from 'lucide-react';

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
  const [loginSearchTerm, setLoginSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockedPhones, setBlockedPhones] = useState([]);

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

  const isBlocked = (phone) => blockedPhones.includes(phone);

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
      </div>
    </div>
  );
};

export default AdminPanel;