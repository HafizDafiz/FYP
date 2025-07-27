import { useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

const Documents = () => {
  const { user } = useAuthContext();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Fetch documents
  const fetchDocuments = async (page = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      console.log('Fetching documents with URL:', `/api/documents?${queryParams}`);
      console.log('User token:', user.token ? 'Present' : 'Missing');

      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/documents?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Documents data received:', data);
        setDocuments(data.documents);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        const errorData = await response.text();
        console.error('Error response:', response.status, errorData);
        setError(`Failed to fetch documents: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(`Network error: ${error.message}. Make sure the backend server is running on port 4000.`);
    } finally {
      setLoading(false);
    }
  };

  // Test API connectivity
  const testAPIConnection = async () => {
    try {
      console.log('Testing API connection...');
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/user/test`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      console.log('API test response:', response.status);
      
      if (response.ok) {
        console.log('API is reachable');
      } else {
        console.log('API responded with error:', response.status);
      }
    } catch (error) {
      console.error('API connection test failed:', error.message);
      setError(`Backend server appears to be down. Error: ${error.message}`);
    }
  };
  const fetchStats = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/documents/stats`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Download document
  const downloadDocument = async (documentId, fileName) => {
    if (!user) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Convert base64 to blob and download
        const byteCharacters = atob(data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Error downloading document');
    }
  };

  // Delete document (admin only)
  const deleteDocument = async (documentId) => {
    if (!user || user.role !== 'admin') return;

    if (window.confirm('Are you sure you want to permanently delete this document?')) {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await fetch(`${apiUrl}/api/documents/${documentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (response.ok) {
          fetchDocuments(currentPage);
          fetchStats();
        } else {
          setError('Failed to delete document');
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        setError('Error deleting document');
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  // Apply filters
  const applyFilters = () => {
    fetchDocuments(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: 'all',
      search: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (user) {
      testAPIConnection();
      fetchDocuments(currentPage);
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage]);

  if (!user) {
    return <div>Please log in to access documents.</div>;
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px',
          background: 'white',
          padding: 'clamp(16px, 3vw, 20px)',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h1 style={{ 
              fontSize: 'clamp(20px, 4vw, 28px)', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              📄 Documents
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '0'
            }}>
              {user.role === 'admin' 
                ? 'Manage all generated documents and reports' 
                : 'Access your generated documents and reports'
              }
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="documents-grid" style={{
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: 'clamp(16px, 3vw, 20px)',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', margin: '0 0 8px 0' }}>
                Total Documents
              </h3>
              <p style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', margin: 0 }}>
                {stats.totalDocuments}
              </p>
              <small style={{ opacity: 0.8, fontSize: '12px' }}>documents</small>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: 'clamp(16px, 3vw, 20px)',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', margin: '0 0 8px 0' }}>
                Total Size
              </h3>
              <p style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', margin: 0 }}>
                {formatFileSize(stats.totalSize)}
              </p>
              <small style={{ opacity: 0.8, fontSize: '12px' }}>storage</small>
            </div>

            {stats.typeBreakdown.map((type, index) => (
              <div key={type.type} style={{
                background: index % 2 === 0 
                  ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                  : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                padding: 'clamp(16px, 3vw, 20px)',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', margin: '0 0 8px 0' }}>
                  {type.type.charAt(0).toUpperCase() + type.type.slice(1)} Files
                </h3>
                <p style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '600', margin: 0 }}>
                  {type.count}
                </p>
                <small style={{ opacity: 0.8, fontSize: '12px' }}>files</small>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: 'clamp(16px, 3vw, 20px)',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#1f2937', fontSize: '16px', fontWeight: '500' }}>Filters</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          {/* Type Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Document Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}
            >
              <option value="all">All Types</option>
              <option value="report">Reports</option>
              <option value="invoice">Invoices</option>
              <option value="receipt">Receipts</option>
              <option value="order">Orders</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by title, description, or filename"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* Start Date Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={applyFilters}
            style={{
              background: '#4299e1',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            style={{
              background: '#e2e8f0',
              color: '#4a5568',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fed7d7',
          color: '#c53030',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>❌ Failed to fetch documents</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>{error}</div>
          <div style={{ fontSize: '12px', background: '#fbd5d5', padding: '8px', borderRadius: '4px' }}>
            <strong>Troubleshooting:</strong><br/>
            1. Make sure the backend server is running on port 4000<br/>
            2. Check console for detailed error logs<br/>
            3. Verify you're logged in with valid authentication<br/>
            4. Try refreshing the page or logging out and back in
          </div>
        </div>
      )}

        {/* Documents List */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading documents...</div>
            </div>
          </div>
        ) : documents.length === 0 && !error ? (
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            color: '#6b7280'
          }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>No documents found</div>
          <div style={{ fontSize: '16px', marginBottom: '16px' }}>
            Documents will appear here when you generate reports from the Reports page.
          </div>
          <div style={{ 
            fontSize: '14px', 
            background: '#f7fafc', 
            padding: '12px', 
            borderRadius: '6px',
            textAlign: 'left',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <strong>📝 To get started:</strong><br/>
            1. Make sure the backend server is running (port 4000)<br/>
            2. Go to the Reports page and generate a report<br/>
            3. The generated report will automatically be saved here<br/>
            4. You can then view, download, or manage your documents
          </div>
        </div>
      ) : (
        <div className="table-container" style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {/* Documents Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Document
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Type
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Generated By
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Created
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Size
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                          {doc.title}
                        </div>
                        {doc.description && (
                          <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
                            {doc.description}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                          {doc.fileName}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: doc.type === 'report' ? '#e6fffa' : '#f0fff4',
                        color: doc.type === 'report' ? '#047857' : '#065f46',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px', color: '#2d3748' }}>
                        {doc.generatedBy.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#718096' }}>
                      {formatDate(doc.createdAt)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#718096' }}>
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {/* Download Button */}
                        <button
                          onClick={() => downloadDocument(doc._id, doc.fileName)}
                          style={{
                            background: '#4299e1',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Download"
                        >
                          📥
                        </button>

                        {/* Delete Button (Admin Only) */}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => deleteDocument(doc._id)}
                            style={{
                              background: '#e53e3e',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: currentPage === 1 ? '#f7fafc' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              
              <span style={{ color: '#718096' }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? '#f7fafc' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </main>
  );
};

export default Documents;
