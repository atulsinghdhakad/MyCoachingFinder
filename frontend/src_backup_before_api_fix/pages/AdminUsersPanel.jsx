import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Trash2, Pencil } from 'lucide-react';

const USERS_PER_PAGE = 5;

const AdminUsersPanel = ({ idToken }) => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
      // Silently handle the error without showing toast notification
    }
  };

  useEffect(() => {
    if (idToken) fetchUsers();
  }, [idToken]);

  const handleDelete = async (uid, email) => {
    const confirm = await Swal.fire({
      title: `Delete user ${email}?`,
      text: 'This action is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e3342f',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      background: '#f9fafb',
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      await axios.post('/api/admin/audit-log', {
        action: `Deleted user: ${email}`,
        actor: 'Admin',
        timestamp: new Date().toISOString(),
      });

      toast.success('✅ User deleted');
      setUsers(users.filter((u) => u.uid !== uid));

      const socket = window.adminSocket;
      if (socket) {
        socket.emit('adminAction', {
          type: 'USER_DELETED',
          email,
          uid,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  const handleEdit = async (user) => {
    const { value: newName } = await Swal.fire({
      title: `Edit Name for ${user.email}`,
      input: 'text',
      inputLabel: 'New Name',
      inputValue: user.displayName || '',
      showCancelButton: true,
      confirmButtonText: 'Update',
    });

    if (newName && newName !== user.displayName) {
      try {
        await axios.put(`/api/admin/users/${user.uid}`, { displayName: newName }, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        await axios.post('/api/admin/audit-log', {
          action: `Updated user name to "${newName}" for ${user.email}`,
          actor: 'Admin',
          timestamp: new Date().toISOString(),
        });

        toast.success('✅ Name updated');
        fetchUsers();

        const socket = window.adminSocket;
        if (socket) {
          socket.emit('adminAction', {
            type: 'USER_EDITED',
            email: user.email,
            newName,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Error updating user');
      }
    }
  };

  // Pagination
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + USERS_PER_PAGE);
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-12">
      <h3 className="text-xl font-bold mb-4 text-purple-600">👥 Admin Users</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.uid} className="border-b bg-white dark:bg-gray-900">
                <td className="p-3">{user.displayName || '—'}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.uid, user.email)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from({ length: totalPages }, (_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded-full ${currentPage === idx + 1
              ? 'bg-purple-600 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white'
              }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPanel;
