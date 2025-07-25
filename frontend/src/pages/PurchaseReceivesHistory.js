import { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

const PurchaseReceivesHistory = () => {
  const { user } = useAuthContext();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('receivedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchReceivingReceipts();
  }, [user]);

  const fetchReceivingReceipts = async () => {
    if (!user) {
      setError('You must be logged in to view receiving receipts.');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/receiving-receipts`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch receiving receipts.');
        setReceipts([]);
      } else {
        setReceipts(data);
        setError(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Something went wrong while fetching receiving receipts.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailsModal(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setShowOptionsDropdown(false);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Receipt Number,PO Number,Vendor,Status,Delivery Date,Total Items,Total Value,Received By\n" +
      filteredAndSortedReceipts.map(receipt => {
        const totalItems = receipt.items.reduce((sum, item) => sum + item.quantityReceived, 0);
        const receivedBy = receipt.receivedBy?.name || receipt.receivedBy?.email || 'N/A';
        return `"${receipt.receiptNumber}","${receipt.poNumber}","${receipt.vendorName}","${receipt.status}","${new Date(receipt.deliveryDate).toLocaleDateString()}","${totalItems}","${receipt.totalValue}","${receivedBy}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "receiving_receipts_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptionsDropdown(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Received': return { bg: '#e0f2fe', color: '#0277bd' };
      case 'Inspected': return { bg: '#fff3e0', color: '#f57c00' };
      case 'Approved': return { bg: '#e8f5e8', color: '#2e7d32' };
      case 'Rejected': return { bg: '#ffebee', color: '#c62828' };
      case 'Partial': return { bg: '#f3e5f5', color: '#7b1fa2' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Good': return { bg: '#e8f5e8', color: '#2e7d32' };
      case 'Damaged': return { bg: '#fff3e0', color: '#f57c00' };
      case 'Defective': return { bg: '#ffebee', color: '#c62828' };
      case 'Partial': return { bg: '#f3e5f5', color: '#7b1fa2' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = (receipt.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receipt.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receipt.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receipt.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAndSortedReceipts = [...filteredReceipts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'receivedAt' || sortBy === 'deliveryDate') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading receiving receipts...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '600', 
                color: '#1f2937',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>📋</span>
                Receiving History
              </h1>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                margin: '0'
              }}>
                View and manage all receiving receipts
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ⚙️ Options
              </button>
              {showOptionsDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  minWidth: '160px',
                  marginTop: '4px'
                }}>
                  <button
                    onClick={() => handleSort('receivedAt')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    📅 Sort by Date
                  </button>
                  <button
                    onClick={() => handleSort('vendorName')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    🏢 Sort by Vendor
                  </button>
                  <button
                    onClick={() => handleSort('totalValue')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    💰 Sort by Value
                  </button>
                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <button
                    onClick={handleExportCSV}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '24px' 
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>📦</div>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Total Receipts</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                  {receipts.length}
                </p>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>💰</div>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Total Value</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                  ${receipts.reduce((sum, receipt) => sum + receipt.totalValue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>✅</div>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Approved</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                  {receipts.filter(receipt => receipt.status === 'Approved').length}
                </p>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>🔍</div>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Pending Inspection</p>
                <p style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0' }}>
                  {receipts.filter(receipt => receipt.status === 'Received').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by receipt number, PO number, vendor, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Status</option>
                <option value="Received">Received</option>
                <option value="Inspected">Inspected</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#dc2626', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Receiving Receipts Table */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {filteredAndSortedReceipts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
              <h3 style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                No Receiving Receipts Found
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                No receiving receipts match your current filters.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Receipt Number
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      PO Number
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Vendor
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Items
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Delivery Date
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Total Value
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedReceipts.map((receipt, index) => {
                    const totalItems = receipt.items.reduce((sum, item) => sum + item.quantityReceived, 0);
                    
                    return (
                      <tr key={receipt._id} style={{ 
                        borderBottom: index < filteredAndSortedReceipts.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                          {receipt.receiptNumber || 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                          {receipt.poNumber || 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                          <div style={{ fontWeight: '500' }}>{receipt.vendorName || 'N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {receipt.trackingNumber ? `Tracking: ${receipt.trackingNumber}` : 'No tracking'}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: getStatusColor(receipt.status || 'Received').bg,
                            color: getStatusColor(receipt.status || 'Received').color
                          }}>
                            {receipt.status || 'Received'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#1f2937' }}>
                          <div style={{ fontWeight: '500' }}>{totalItems}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {receipt.items.length} line{receipt.items.length > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                          {receipt.deliveryDate ? new Date(receipt.deliveryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', textAlign: 'right', fontWeight: '500' }}>
                          ${receipt.totalValue ? receipt.totalValue.toFixed(2) : '0.00'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleViewDetails(receipt)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#2563eb'}
                            onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Details Modal */}
      {showDetailsModal && selectedReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '95%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>
                  Receipt Details - {selectedReceipt.receiptNumber}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
                  PO: {selectedReceipt.poNumber} | Vendor: {selectedReceipt.vendorName}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Receipt Information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>
                  Receipt Information
                </h3>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 4px 0' }}>
                  <strong>Status:</strong> {selectedReceipt.status}
                </p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 4px 0' }}>
                  <strong>Delivery Date:</strong> {new Date(selectedReceipt.deliveryDate).toLocaleDateString()}
                </p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 4px 0' }}>
                  <strong>Total Value:</strong> ${selectedReceipt.totalValue.toFixed(2)}
                </p>
              </div>
              
              <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>
                  Shipping Information
                </h3>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 4px 0' }}>
                  <strong>Tracking:</strong> {selectedReceipt.trackingNumber || 'N/A'}
                </p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 4px 0' }}>
                  <strong>Carrier:</strong> {selectedReceipt.carrier || 'N/A'}
                </p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 4px 0' }}>
                  <strong>Location:</strong> {selectedReceipt.receivingLocation || 'N/A'}
                </p>
              </div>
            </div>

            {/* Items Received */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                Items Received
              </h3>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                        Product
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                        Ordered
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                        Received
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                        Condition
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: index < selectedReceipt.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            SKU: {item.sku}
                          </div>
                          {item.batchNumber && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Batch: {item.batchNumber}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#1f2937' }}>
                          {item.quantityOrdered}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#1f2937' }}>
                          {item.quantityReceived}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: getConditionColor(item.condition).bg,
                            color: getConditionColor(item.condition).color
                          }}>
                            {item.condition}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                          ${item.totalValue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {(selectedReceipt.notes || selectedReceipt.discrepancyNotes) && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                  Notes
                </h3>
                {selectedReceipt.notes && (
                  <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: '0' }}>
                      <strong>General Notes:</strong> {selectedReceipt.notes}
                    </p>
                  </div>
                )}
                {selectedReceipt.discrepancyNotes && (
                  <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px' }}>
                    <p style={{ fontSize: '14px', color: '#d97706', margin: '0' }}>
                      <strong>Discrepancy Notes:</strong> {selectedReceipt.discrepancyNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default PurchaseReceivesHistory;
