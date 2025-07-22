const Document = require('../models/documentModel');
const User = require('../models/userModel');

// Get all documents for admin, only user's documents for non-admin
const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search, startDate, endDate } = req.query;
    const { _id: userId, role } = req.user;

    // Build query
    let query = {};
    
    // Role-based access: admin and staff see all, other users see only their own
    /* Temporarily disabling role check for debugging
    if (role !== 'admin' && role !== 'staff') {
      query.generatedBy = userId;
    }
    */

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    // Only show non-archived documents by default
    query.isArchived = false;

    const documents = await Document.find(query)
      .populate('generatedBy', 'name email')
      .select('-fileData') // Exclude file data from list view for performance
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.status(200).json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get a specific document by ID
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user;

    let query = { _id: id };
    
    // Role-based access: admin and staff see all, other users see only their own
    if (role !== 'admin' && role !== 'staff') {
      query.generatedBy = userId;
    }

    const document = await Document.findOne(query)
      .populate('generatedBy', 'name email');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.status(200).json(document);

  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Save a new document
const saveDocument = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      dateRange,
      fileData,
      fileName,
      fileSize,
      metadata,
      tags
    } = req.body;

    const { _id: userId } = req.user;

    // Validate required fields
    if (!title || !type || !fileData || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, type, fileData, fileName' 
      });
    }

    // Create new document
    const document = new Document({
      title,
      type,
      description: description || '',
      dateRange,
      fileData,
      fileName,
      fileSize: fileSize || 0,
      generatedBy: userId,
      metadata,
      tags: tags || []
    });

    await document.save();

    // Return document without file data for response
    const savedDocument = await Document.findById(document._id)
      .populate('generatedBy', 'name email')
      .select('-fileData');

    res.status(201).json(savedDocument);

  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ error: 'Failed to save document' });
  }
};

// Update document metadata (not file content)
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, type } = req.body;
    const { _id: userId, role } = req.user;

    let query = { _id: id };
    
    // Role-based access: admin and staff can update all, users can update only their own
    if (role !== 'admin' && role !== 'staff') {
      query.generatedBy = userId;
    }

    const document = await Document.findOneAndUpdate(
      query,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(tags && { tags }),
        ...(type && { type })
      },
      { new: true }
    ).populate('generatedBy', 'name email').select('-fileData');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.status(200).json(document);

  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

// Archive/unarchive document
const toggleArchiveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user;

    let query = { _id: id };
    
    // Role-based access: admin and staff can archive all, users can archive only their own
    if (role !== 'admin' && role !== 'staff') {
      query.generatedBy = userId;
    }

    const document = await Document.findOne(query);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.isArchived = !document.isArchived;
    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('generatedBy', 'name email')
      .select('-fileData');

    res.status(200).json(updatedDocument);

  } catch (error) {
    console.error('Error archiving document:', error);
    res.status(500).json({ error: 'Failed to archive document' });
  }
};

// Delete document permanently (admin only)
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    // Only admin can permanently delete documents
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete documents' });
    }

    const document = await Document.findByIdAndDelete(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.status(200).json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Download document file
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user;

    let query = { _id: id };
    
    // Role-based access: admin and staff can download all, users can download only their own
    if (role !== 'admin' && role !== 'staff') {
      query.generatedBy = userId;
    }

    const document = await Document.findOne(query);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Return the file data as base64
    res.status(200).json({
      fileData: document.fileData,
      fileName: document.fileName,
      fileSize: document.fileSize
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

// Get document statistics
const getDocumentStats = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;

    let matchQuery = { isArchived: false };
    
    // Role-based access: admin and staff see all, users see only their own
    /* Temporarily disabling role check for debugging
    if (role !== 'admin' && role !== 'staff') {
      matchQuery.generatedBy = userId;
    }
    */

    const stats = await Document.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: '$count' },
          totalSize: { $sum: '$totalSize' },
          typeBreakdown: {
            $push: {
              type: '$_id',
              count: '$count',
              size: '$totalSize'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalDocuments: 0,
      totalSize: 0,
      typeBreakdown: []
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
};

module.exports = {
  getDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  toggleArchiveDocument,
  deleteDocument,
  downloadDocument,
  getDocumentStats
};
