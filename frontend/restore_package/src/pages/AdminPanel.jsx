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

const MySwal = withReactContent(Swal);

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 5;
  const navigate = useNavigate();

  const playSound = () => {
    const audio = new Audio('/sounds/ding.mp3');
    audio.play().catch(err => console.log('Autoplay prevented:', err));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        playSound();
        toast.success(`🎉 Welcome Admin: ${currentUser.email}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(to right, #8e2de2, #4a00e0)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
          },
          icon: '🔒',
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/api/admin/contacts');
      setContacts(response.data.contacts.reverse());
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleExitAdmin = async () => {
    const result = await MySwal.fire({
      title: 'Exit Admin Mode?',
      text: 'You will return to main site.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7C3AED',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Exit',
      background: '#f9fafb',
    });

    if (result.isConfirmed) {
      playSound();
      MySwal.fire('Exited', 'You have exited Admin Panel.', 'success');
      toast.success('Admin panel exited.', {
        style: {
          background: 'linear-gradient(to right, #FF5733, #FF8000)',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '10px'
        },
      });
      navigate('/');
    }
  };

  const totalSubmissions = contacts.length;
  const lastSubmissionTime = contacts[0]?.createdAt ? new Date(contacts[0].createdAt).toLocaleString() : 'N/A';
  const lastUserEmail = contacts[0]?.email || 'N/A';

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

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: 'Delete Contact?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e3342f',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/admin/contacts/${id}`);
        fetchContacts();
        toast.success('✅ Contact Deleted!', {
          position: 'top-center',
          style: { background: 'linear-gradient(to right, #ff416c, #ff4b2b)', color: '#fff' }
        });
      } catch (error) {
        console.error('Error deleting contact:', error);
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

  if (!user) return (
    <div className="flex justify-center items-center min-h-screen text-lg text-purple-500">
      Loading Admin Panel...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-black dark:text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          {/* <h1 className="text-3xl font-bold text-purple-600 text-center">Admin Panel!</h1> */}
          
        </div>



        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 mb-8">
  {/* Left: Welcome Panel */}
  <div>
    <h2 className="text-2xl font-semibold mb-2 font-bold text-purple-600">🎉 Welcome, Admin!</h2>
    {user.photoURL && <img src={user.photoURL} alt="Admin" className="w-12 h-12 rounded-full" />}
    <p><strong>Email:</strong> {user.email}</p>
    <p className="text-gray-600 dark:text-gray-400 mt-2">
      You now have access to manage contacts, view submissions, download reports, and more.
    </p>
  </div>

  {/* Right: Exit Admin Button */}
  <button
    onClick={handleExitAdmin}
    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
  >
    Exit Admin
  </button>
</div>




        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-purple-600">Admin Dashboard</h1>
            <p className="text-lg mt-2">Manage your contacts and submissions easily ✨</p>
          </div>
          <button onClick={downloadCSV} className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg">
            Download CSV
          </button>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white text-center" whileHover={{ scale: 1.05 }}>
            <h2 className="text-3xl font-bold mb-2">{totalSubmissions}</h2>
            <p>Total Submissions</p>
          </motion.div>
          <motion.div className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center" whileHover={{ scale: 1.05 }}>
            <h2 className="text-xl font-bold mb-2">{lastSubmissionTime}</h2>
            <p>Last Submission</p>
          </motion.div>
          <motion.div className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-green-400 to-green-600 text-white text-center" whileHover={{ scale: 1.05 }}>
            <h2 className="text-xl font-bold mb-2">{lastUserEmail}</h2>
            <p>Latest User</p>
          </motion.div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Message</th>
                <th className="py-3 px-6">Submitted At</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentContacts.map((c, idx) => (
                <motion.tr key={idx} className="bg-white dark:bg-gray-800 border-b hover:scale-[1.01] transition-transform" whileHover={{ scale: 1.02 }}>
                  <td className="py-4 px-6">{c.name}</td>
                  <td className="py-4 px-6">{c.email}</td>
                  <td className="py-4 px-6">{c.message}</td>
                  <td className="py-4 px-6">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <button onClick={() => handleDelete(c._id)} className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-full">Delete</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.ceil(filteredContacts.length / contactsPerPage) }, (_, idx) => (
            <button
              key={idx}
              onClick={() => paginate(idx + 1)}
              className={`py-1 px-3 rounded-full ${currentPage === idx + 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'} transition-all duration-300`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
