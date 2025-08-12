import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { saveAs } from 'file-saver'; // Install `file-saver` package

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(10);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/contacts?page=${currentPage}&limit=${contactsPerPage}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      setContacts(response.data);
    } catch (error) {
      toast.error('Failed to fetch contacts');
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/contact/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
          },
        });
        toast.success('Deleted successfully');
        fetchContacts();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(currentPage + 1);
  };

  const handleExportCSV = () => {
    const csvData = contacts.map((contact) => ({
      Name: contact.name,
      Email: contact.email,
      Message: contact.message,
      Date: new Date(contact.createdAt).toLocaleString(),
    }));
    const csvHeader = ['Name', 'Email', 'Message', 'Date'];
    const csvRows = [csvHeader, ...csvData.map((contact) => Object.values(contact))];
    const csvString = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    saveAs(blob, 'contacts.csv');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-600">Admin Dashboard</h1>

        <input
          type="text"
          placeholder="Search by name, email or message..."
          className="w-full p-3 mb-6 rounded-lg border bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {contacts.length === 0 ? (
          <p className="text-center text-gray-500">No contacts found.</p>
        ) : (
          <div className="grid gap-6">
            {contacts.map((contact) => (
              <div key={contact._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <p><span className="font-bold">Name:</span> {contact.name}</p>
                <p><span className="font-bold">Email:</span> {contact.email}</p>
                <p><span className="font-bold">Message:</span> {contact.message}</p>
                <p className="text-xs text-gray-400 mt-2">Submitted on: {new Date(contact.createdAt).toLocaleString()}</p>
                <button
                  onClick={() => handleDelete(contact._id)}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-md"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Load More
          </button>
        </div>

        {/* Export CSV Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleExportCSV}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;