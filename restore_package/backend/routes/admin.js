const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const adminAuth = require('../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all contacts
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// Delete a single contact
router.delete('/contact/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ message: 'Error deleting contact' });
  }
});

// Bulk delete contacts
router.delete('/contacts/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty contact IDs' });
    }
    
    const result = await Contact.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: 'Contacts deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error bulk deleting contacts:', error);
    res.status(500).json({ message: 'Error deleting contacts' });
  }
});

// Get contact statistics
router.get('/stats', async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayContacts = await Contact.countDocuments({
      createdAt: { $gte: today }
    });
    
    res.json({
      totalContacts,
      todayContacts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router; 