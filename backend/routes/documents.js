const express = require('express');
const {
  getDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  toggleArchiveDocument,
  deleteDocument,
  downloadDocument,
  getDocumentStats
} = require('../controllers/documentsController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all routes
router.use(requireAuth);

// GET /api/documents - Get all documents with pagination and filters
router.get('/', getDocuments);

// GET /api/documents/stats - Get document statistics
router.get('/stats', getDocumentStats);

// GET /api/documents/:id - Get specific document
router.get('/:id', getDocument);

// GET /api/documents/:id/download - Download document file
router.get('/:id/download', downloadDocument);

// POST /api/documents - Save new document
router.post('/', saveDocument);

// PATCH /api/documents/:id - Update document metadata
router.patch('/:id', updateDocument);

// PATCH /api/documents/:id/archive - Archive/unarchive document
router.patch('/:id/archive', toggleArchiveDocument);

// DELETE /api/documents/:id - Delete document (admin only)
router.delete('/:id', deleteDocument);

module.exports = router;
