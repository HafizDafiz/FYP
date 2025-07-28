import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const PurchaseReceives = () => {
  const { user } = useAuthContext();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receivingData, setReceivingData] = useState({
    receivedItems: [],
    trackingNumber: '',
    carrier: '',
    actualDelivery: '',
    notes: ''
  });

  // Mapping from purchase order carrier keys to display names
  const carrierMapping = {
    'pickup': 'Vendor Pickup',
    'local-delivery': 'Local Delivery (Same Day)',
    'singpost-standard': 'SingPost Standard',
    'singpost-express': 'SingPost Express',
    'dhl-express': 'DHL Express',
    'fedex-international': 'FedEx International',
    'ups-express': 'UPS Express',
    'ninja-van': 'Ninja Van',
    'shopee-express': 'Shopee Express',
    'grab-express': 'Grab Express',
    'lalamove': 'Lalamove'
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [user]);

  const fetchPurchaseOrders = async () => {
    if (!user) {
      setError('You must be logged in to view purchase orders.');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/purchase-orders`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch purchase orders.');
        setPurchaseOrders([]);
      } else {
        // Filter to only show orders that need receiving (Sent, Acknowledged, Partially Received)
        const receivableOrders = data.filter(order => 
          ['Sent', 'Acknowledged', 'Partially Received'].includes(order.status)
        );
        setPurchaseOrders(receivableOrders);
        setError(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Something went wrong while fetching purchase orders.');
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveItems = (order) => {
    setSelectedOrder(order);
    
    // Map carrier key to display name for auto-population
    const mappedCarrier = order.carrier ? (carrierMapping[order.carrier] || order.carrier) : '';
    
    // Initialize receiving data with order items
    const initialReceivingData = {
      receivedItems: order.items.map(item => ({
        itemId: item._id,
        productName: item.productName,
        sku: item.sku,
        orderedQuantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        pendingQuantity: item.pendingQuantity,
        quantityReceived: 0,
        condition: 'Good',
        notes: ''
      })),
      trackingNumber: order.trackingNumber || '',
      carrier: mappedCarrier,
      actualDelivery: order.actualDelivery ? new Date(order.actualDelivery).toISOString().split('T')[0] : '',
      notes: ''
    };
    
    setReceivingData(initialReceivingData);
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrder) return;
    
    // Filter items with quantity received > 0
    const itemsToReceive = receivingData.receivedItems.filter(item => item.quantityReceived > 0);
    
    if (itemsToReceive.length === 0) {
      setError('Please specify quantities to receive for at least one item.');
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      console.log('Making request to:', `${apiUrl}/api/purchase-orders/${selectedOrder._id}/receive`);
      console.log('Request body:', {
        receivedItems: itemsToReceive,
        trackingNumber: receivingData.trackingNumber,
        carrier: receivingData.carrier,
        actualDelivery: receivingData.actualDelivery,
        notes: receivingData.notes
      });
      
      const response = await fetch(`${apiUrl}/api/purchase-orders/${selectedOrder._id}/receive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receivedItems: itemsToReceive,
          trackingNumber: receivingData.trackingNumber,
          carrier: receivingData.carrier,
          actualDelivery: receivingData.actualDelivery,
          notes: receivingData.notes
        }),
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        setError(data.error || `Failed to receive items. Status: ${response.status}`);
      } else {
        setShowReceiveModal(false);
        setSelectedOrder(null);
        setReceivingData({
          receivedItems: [],
          trackingNumber: '',
          carrier: '',
          actualDelivery: '',
          notes: ''
        });
        fetchPurchaseOrders();
        setError(null);
      }
    } catch (err) {
      console.error('Receive error:', err);
      setError(`Something went wrong while receiving items: ${err.message}`);
    }
  };

  const updateReceivingQuantity = (itemId, quantityReceived) => {
    setReceivingData(prev => ({
      ...prev,
      receivedItems: prev.receivedItems.map(item =>
        item.itemId === itemId 
          ? { ...item, quantityReceived: parseInt(quantityReceived) || 0 }
          : item
      )
    }));
  };

  const updateItemCondition = (itemId, condition) => {
    setReceivingData(prev => ({
      ...prev,
      receivedItems: prev.receivedItems.map(item =>
        item.itemId === itemId 
          ? { ...item, condition }
          : item
      )
    }));
  };

  const updateItemNotes = (itemId, notes) => {
    setReceivingData(prev => ({
      ...prev,
      receivedItems: prev.receivedItems.map(item =>
        item.itemId === itemId 
          ? { ...item, notes }
          : item
      )
    }));
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
      "PO Number,Vendor,Status,Order Date,Expected Delivery,Total Items,Pending Items,Total Amount\n" +
      filteredAndSortedOrders.map(order => {
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const pendingItems = order.items.reduce((sum, item) => sum + item.pendingQuantity, 0);
        return `"${order.poNumber}","${order.vendorName}","${order.status}","${new Date(order.orderDate).toLocaleDateString()}","${order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'N/A'}","${totalItems}","${pendingItems}","${order.total}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "purchase_receives.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptionsDropdown(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sent': return { bg: '#e0f2fe', color: '#0277bd' };
      case 'Acknowledged': return { bg: '#fff3e0', color: '#f57c00' };
      case 'Partially Received': return { bg: '#f3e5f5', color: '#7b1fa2' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return { bg: '#f0f9ff', color: '#0369a1' };
      case 'Medium': return { bg: '#fef3c7', color: '#d97706' };
      case 'High': return { bg: '#fee2e2', color: '#dc2626' };
      case 'Urgent': return { bg: '#fecaca', color: '#b91c1c' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = (order.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.vendorEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAndSortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'orderDate' || sortBy === 'expectedDelivery') {
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
      <main className="main-content purchase-receives-container">
        <div className="purchase-receives-loading-container">
          <div className="purchase-receives-loading-spinner"></div>
          <p className="purchase-receives-loading-text">Loading purchase orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="purchase-receives-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px',
          background: 'white',
          padding: 'clamp(16px, 3vw, 20px)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h1 style={{ 
              fontSize: 'clamp(20px, 4vw, 24px)', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>📥</span>
              Purchase Receives
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '0'
            }}>
              Receive and inspect items from purchase orders
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/purchases/receives-history" 
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
            >
              <span style={{ fontSize: '16px' }}>📋</span>
              View History
            </Link>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  minHeight: '44px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                ⚙️
              </button>
              {showOptionsDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  minWidth: '180px',
                  marginTop: '4px'
                }}>
                  <div style={{ padding: '8px 0' }}>
                    <button
                      onClick={() => handleSort('orderDate')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'orderDate' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      📅 Sort by Date {sortBy === 'orderDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('vendorName')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'vendorName' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      🏢 Sort by Vendor {sortBy === 'vendorName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('priority')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'priority' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      🚨 Sort by Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #f3f4f6' }} />
                    <button
                      onClick={handleExportCSV}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>📊</span>
                      Export CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          background: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by PO number, vendor name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '44px',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#312F56'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '44px',
                  minWidth: '150px',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#312F56'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="all">All Status</option>
                <option value="Sent">Sent</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Partially Received">Partially Received</option>
              </select>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', minWidth: 'fit-content' }}>
              {filteredAndSortedOrders.length} orders found
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Purchase Orders Table */}
        <div className="purchase-receives-table-container">
          {filteredAndSortedOrders.length === 0 ? (
            <div className="purchase-receives-empty-state">
              <div className="purchase-receives-empty-icon">📥</div>
              <h3 className="purchase-receives-empty-title">
                No Purchase Orders to Receive
              </h3>
              <p className="purchase-receives-empty-text">
                There are no purchase orders ready for receiving at this time.
              </p>
            </div>
          ) : (
            <div className="purchase-receives-table-scroll">
              <table className="purchase-receives-table">
                <thead>
                  <tr className="purchase-receives-table-header">
                    <th className="purchase-receives-table-th">
                      PO Number
                    </th>
                    <th className="purchase-receives-table-th">
                      Vendor
                    </th>
                    <th className="purchase-receives-table-th purchase-receives-table-th-center">
                      Status
                    </th>
                    <th className="purchase-receives-table-th purchase-receives-table-th-center">
                      Priority
                    </th>
                    <th className="purchase-receives-table-th purchase-receives-table-th-center">
                      Items
                    </th>
                    <th className="purchase-receives-table-th purchase-receives-table-th-center">
                      Expected Delivery
                    </th>
                    <th className="purchase-receives-table-th purchase-receives-table-th-right">
                      Total Amount
                    </th>
                    <th className="purchase-receives-table-th purchase-receives-table-th-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedOrders.map((order, index) => {
                    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    const receivedItems = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                    const pendingItems = order.items.reduce((sum, item) => sum + item.pendingQuantity, 0);
                    
                    return (
                      <tr 
                        key={order._id} 
                        className={`purchase-receives-table-row ${index < filteredAndSortedOrders.length - 1 ? 'purchase-receives-table-row-border' : ''}`}
                      >
                        <td className="purchase-receives-table-td purchase-receives-table-td-bold">
                          {order.poNumber || 'N/A'}
                        </td>
                        <td className="purchase-receives-table-td">
                          <div className="purchase-receives-vendor-name">{order.vendorName || 'N/A'}</div>
                          <div className="purchase-receives-vendor-email">{order.vendorEmail || 'N/A'}</div>
                        </td>
                        <td className="purchase-receives-table-td purchase-receives-table-td-center">
                          <span 
                            className="purchase-receives-status-badge"
                            style={{
                              background: getStatusColor(order.status || 'Draft').bg,
                              color: getStatusColor(order.status || 'Draft').color
                            }}
                          >
                            {order.status || 'Draft'}
                          </span>
                        </td>
                        <td className="purchase-receives-table-td purchase-receives-table-td-center">
                          <span 
                            className="purchase-receives-status-badge"
                            style={{
                              background: getPriorityColor(order.priority || 'Medium').bg,
                              color: getPriorityColor(order.priority || 'Medium').color
                            }}
                          >
                            {order.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="purchase-receives-table-td purchase-receives-table-td-center">
                          <div className="purchase-receives-items-count">
                            {receivedItems}/{totalItems}
                          </div>
                          <div className="purchase-receives-items-pending">
                            {pendingItems} pending
                          </div>
                        </td>
                        <td className="purchase-receives-table-td purchase-receives-table-td-center" style={{ color: '#6b7280' }}>
                          {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="purchase-receives-table-td purchase-receives-table-td-right purchase-receives-table-td-bold">
                          ${order.total ? order.total.toFixed(2) : '0.00'}
                        </td>
                        <td className="purchase-receives-table-td purchase-receives-table-td-center">
                          <button
                            onClick={() => handleReceiveItems(order)}
                            className="purchase-receives-receive-button"
                          >
                            📥 Receive
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

      {/* Receive Items Modal */}
      {showReceiveModal && selectedOrder && (
        <div className="purchase-receives-modal-overlay">
          <div className="purchase-receives-modal">
            <div className="purchase-receives-modal-header">
              <div>
                <h2 className="purchase-receives-modal-title">
                  Receive Items - {selectedOrder.poNumber}
                </h2>
                <p className="purchase-receives-modal-subtitle">
                  Vendor: {selectedOrder.vendorName}
                </p>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="purchase-receives-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit}>
              {/* Items to Receive */}
              <div className="purchase-receives-modal-section">
                <h3 className="purchase-receives-modal-section-title">
                  Items to Receive
                </h3>
                <div className="purchase-receives-modal-table-container">
                  <table className="purchase-receives-modal-table">
                    <thead>
                      <tr className="purchase-receives-modal-table-header">
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-left">
                          Product
                        </th>
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-center">
                          Ordered
                        </th>
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-center">
                          Received
                        </th>
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-center">
                          Pending
                        </th>
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-center">
                          Receiving Now
                        </th>
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-center">
                          Condition
                        </th>
                        <th className="purchase-receives-modal-table-th purchase-receives-modal-table-th-left">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivingData.receivedItems.map((item, index) => (
                        <tr key={item.itemId} className="purchase-receives-modal-table-row">
                          <td className="purchase-receives-modal-table-td">
                            <div className="purchase-receives-modal-product-name">
                              {item.productName}
                            </div>
                            <div className="purchase-receives-modal-product-sku">
                              SKU: {item.sku}
                            </div>
                          </td>
                          <td className="purchase-receives-modal-table-td purchase-receives-modal-table-td-center">
                            {item.orderedQuantity}
                          </td>
                          <td className="purchase-receives-modal-table-td purchase-receives-modal-table-td-center">
                            {item.receivedQuantity}
                          </td>
                          <td className="purchase-receives-modal-table-td purchase-receives-modal-table-td-center">
                            {item.pendingQuantity}
                          </td>
                          <td className="purchase-receives-modal-table-td" style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max={item.pendingQuantity}
                              value={item.quantityReceived}
                              onChange={(e) => updateReceivingQuantity(item.itemId, e.target.value)}
                              className="purchase-receives-modal-quantity-input"
                            />
                          </td>
                          <td className="purchase-receives-modal-table-td" style={{ textAlign: 'center' }}>
                            <select
                              value={item.condition}
                              onChange={(e) => updateItemCondition(item.itemId, e.target.value)}
                              className="purchase-receives-modal-condition-select"
                            >
                              <option value="Good">Good</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Defective">Defective</option>
                              <option value="Partial">Partial</option>
                            </select>
                          </td>
                          <td className="purchase-receives-modal-table-td">
                            <input
                              type="text"
                              placeholder="Notes..."
                              value={item.notes}
                              onChange={(e) => updateItemNotes(item.itemId, e.target.value)}
                              className="purchase-receives-modal-notes-input"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="purchase-receives-modal-section">
                <h3 className="purchase-receives-modal-section-title">
                  Delivery Information
                </h3>
                <div className="purchase-receives-modal-grid">
                  <div className="purchase-receives-modal-form-group">
                    <label className="purchase-receives-modal-label">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={receivingData.trackingNumber}
                      onChange={(e) => setReceivingData({ ...receivingData, trackingNumber: e.target.value })}
                      placeholder="Enter tracking number"
                      className="purchase-receives-modal-input"
                    />
                  </div>
                  <div className="purchase-receives-modal-form-group">
                    <label className="purchase-receives-modal-label">
                      Carrier
                    </label>
                    <select
                      value={receivingData.carrier}
                      onChange={(e) => setReceivingData({ ...receivingData, carrier: e.target.value })}
                      className="purchase-receives-modal-select"
                    >
                      <option value="">Select carrier</option>
                      <option value="Vendor Pickup">Vendor Pickup</option>
                      <option value="Local Delivery (Same Day)">Local Delivery (Same Day)</option>
                      <option value="SingPost Standard">SingPost Standard</option>
                      <option value="SingPost Express">SingPost Express</option>
                      <option value="DHL Express">DHL Express</option>
                      <option value="FedEx International">FedEx International</option>
                      <option value="UPS Express">UPS Express</option>
                      <option value="Ninja Van">Ninja Van</option>
                      <option value="Shopee Express">Shopee Express</option>
                      <option value="Grab Express">Grab Express</option>
                      <option value="Lalamove">Lalamove</option>
                      <option value="Other">Other</option>
                    </select>
                    {selectedOrder && selectedOrder.carrier && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        💡 Auto-populated from purchase order. You can change if actual carrier differs.
                      </div>
                    )}
                  </div>
                  <div className="purchase-receives-modal-form-group">
                    <label className="purchase-receives-modal-label">
                      Actual Delivery Date
                    </label>
                    <input
                      type="date"
                      value={receivingData.actualDelivery}
                      onChange={(e) => setReceivingData({ ...receivingData, actualDelivery: e.target.value })}
                      className="purchase-receives-modal-input"
                    />
                  </div>
                </div>
              </div>

              {/* Receiving Notes */}
              <div className="purchase-receives-modal-section">
                <label className="purchase-receives-modal-label">
                  Receiving Notes
                </label>
                <textarea
                  value={receivingData.notes}
                  onChange={(e) => setReceivingData({ ...receivingData, notes: e.target.value })}
                  placeholder="Enter any notes about the delivery or receiving process..."
                  rows="3"
                  className="purchase-receives-modal-textarea"
                />
              </div>

              {/* Action Buttons */}
              <div className="purchase-receives-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="purchase-receives-modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="purchase-receives-modal-submit-btn"
                >
                  📥 Receive Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default PurchaseReceives;
