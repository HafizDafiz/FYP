import { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';

const Shipment = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating shipment
  const [formData, setFormData] = useState({
    salesOrderId: '',
    carrier: 'FedEx',
    shippingMethod: 'Standard',
    trackingNumber: '',
    estimatedDelivery: '',
    shippingCost: '',
    weight: '',
    priority: 'Normal',
    notes: '',
    signatureRequired: false,
    insuranceValue: '',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchShipments();
    fetchSalesOrders();
  }, [user, navigate]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/shipments`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch shipments.');
        setShipments([]);
      } else {
        setShipments(data);
        setError(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Something went wrong while fetching shipments.');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sales`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Filter sales orders that can be shipped (Confirmed or Processing)
        const shippableOrders = data.filter(order => 
          ['Confirmed', 'Processing'].includes(order.status)
        );
        setSalesOrders(shippableOrders);
      }
    } catch (err) {
      console.error('Error fetching sales orders:', err);
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${apiUrl}/api/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          shippingCost: parseFloat(formData.shippingCost),
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          insuranceValue: formData.insuranceValue ? parseFloat(formData.insuranceValue) : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create shipment.');
      } else {
        setShipments([data, ...shipments]);
        setShowCreateModal(false);
        resetForm();
        setError(null);
      }
    } catch (err) {
      console.error('Create error:', err);
      setError('Something went wrong while creating shipment.');
    }
  };

  const handleUpdateStatus = async (shipmentId, newStatus, location = '', notes = '') => {
    try {
      const response = await fetch(`${apiUrl}/api/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, location, notes })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update status.');
      } else {
        setShipments(shipments.map(shipment => 
          shipment._id === shipmentId ? data : shipment
        ));
        setError(null);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Something went wrong while updating status.');
    }
  };

  const handleTrackingLookup = async (e) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/shipments/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Tracking number not found.');
        setTrackingInfo(null);
      } else {
        setTrackingInfo(data);
        setError(null);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Something went wrong while tracking shipment.');
      setTrackingInfo(null);
    }
  };

  const resetForm = () => {
    setFormData({
      salesOrderId: '',
      carrier: 'FedEx',
      shippingMethod: 'Standard',
      trackingNumber: '',
      estimatedDelivery: '',
      shippingCost: '',
      weight: '',
      priority: 'Normal',
      notes: '',
      signatureRequired: false,
      insuranceValue: '',
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#f59e0b',
      'Preparing': '#3b82f6',
      'Ready to Ship': '#10b981',
      'Shipped': '#6366f1',
      'In Transit': '#8b5cf6',
      'Out for Delivery': '#f97316',
      'Delivered': '#10b981',
      'Failed Delivery': '#ef4444',
      'Returned': '#ef4444',
      'Cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Normal': '#3b82f6',
      'High': '#f59e0b',
      'Urgent': '#ef4444'
    };
    return colors[priority] || '#3b82f6';
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.shipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && shipment.status === filterStatus;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading shipments...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', 
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#1f2937', 
              margin: '0 0 8px 0' 
            }}>
              Shipment Management
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280', 
              margin: '0 0 16px 0' 
            }}>
              Track and manage product shipments and deliveries
            </p>
            
            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search shipments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  🔍
                </div>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready to Ship">Ready to Ship</option>
                <option value="Shipped">Shipped</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed Delivery">Failed Delivery</option>
                <option value="Returned">Returned</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowTrackingModal(true)}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📍 Track Shipment
            </button>
            
            {user.role === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Create Shipment
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '16px 24px', 
            backgroundColor: '#fee2e2', 
            borderLeft: '4px solid #ef4444',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Shipments Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  SHIPMENT #
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
                  SALES ORDER
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
                  CUSTOMER
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
                  CARRIER
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
                  TRACKING #
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
                  STATUS
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
                  PRIORITY
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
                  EST. DELIVERY
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
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedShipments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ 
                    padding: '48px 24px', 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    fontSize: '16px' 
                  }}>
                    {searchTerm || filterStatus !== 'all' ? 'No shipments found matching your criteria.' : 'No shipments available. Create your first shipment to get started.'}
                  </td>
                </tr>
              ) : (
                sortedShipments.map((shipment, index) => (
                  <tr 
                    key={shipment._id} 
                    style={{ 
                      borderBottom: index < sortedShipments.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.parentElement.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      {shipment.shipmentNumber}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      {shipment.salesOrderNumber}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937' }}>
                      {shipment.customerName}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      {shipment.carrier}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                      {shipment.trackingNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(shipment.status)}20`,
                        color: getStatusColor(shipment.status),
                        border: `1px solid ${getStatusColor(shipment.status)}40`
                      }}>
                        {shipment.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: `${getPriorityColor(shipment.priority)}20`,
                        color: getPriorityColor(shipment.priority),
                        border: `1px solid ${getPriorityColor(shipment.priority)}40`
                      }}>
                        {shipment.priority}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                      {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {user.role === 'admin' && !['Delivered', 'Cancelled', 'Returned'].includes(shipment.status) && (
                          <select
                            value={shipment.status}
                            onChange={(e) => handleUpdateStatus(shipment._id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              outline: 'none'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready to Ship">Ready to Ship</option>
                            <option value="Shipped">Shipped</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Failed Delivery">Failed Delivery</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {sortedShipments.length > 0 && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontSize: '14px',
            color: '#6b7280',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              Showing {sortedShipments.length} of {shipments.length} shipments
              {(searchTerm || filterStatus !== 'all') && (
                <span style={{ marginLeft: '8px', color: '#3b82f6' }}>
                  (filtered)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#10b981' }}>
                {shipments.filter(s => s.status === 'Delivered').length} delivered
              </span>
              <span style={{ color: '#6366f1' }}>
                {shipments.filter(s => ['Shipped', 'In Transit', 'Out for Delivery'].includes(s.status)).length} in transit
              </span>
              <span style={{ color: '#f59e0b' }}>
                {shipments.filter(s => ['Pending', 'Preparing', 'Ready to Ship'].includes(s.status)).length} pending
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Create New Shipment
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Sales Order *
                </label>
                <select
                  required
                  value={formData.salesOrderId}
                  onChange={(e) => setFormData({...formData, salesOrderId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Sales Order</option>
                  {salesOrders.map(order => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber} - {order.customerName} (${order.total.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Carrier *
                  </label>
                  <select
                    required
                    value={formData.carrier}
                    onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Local Delivery">Local Delivery</option>
                    <option value="Customer Pickup">Customer Pickup</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Shipping Method *
                  </label>
                  <select
                    required
                    value={formData.shippingMethod}
                    onChange={(e) => setFormData({...formData, shippingMethod: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Express">Express</option>
                    <option value="Next Day">Next Day</option>
                    <option value="Two Day">Two Day</option>
                    <option value="Ground">Ground</option>
                    <option value="Overnight">Overnight</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Shipping Address *
                </label>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Street Address"
                    required
                    value={formData.shippingAddress.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      shippingAddress: {...formData.shippingAddress, street: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={formData.shippingAddress.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: {...formData.shippingAddress, city: e.target.value}
                      })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      required
                      value={formData.shippingAddress.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: {...formData.shippingAddress, state: e.target.value}
                      })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      required
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        shippingAddress: {...formData.shippingAddress, zipCode: e.target.value}
                      })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Estimated Delivery
                  </label>
                  <input
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({...formData, estimatedDelivery: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Shipping Cost * ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({...formData, shippingCost: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Notes
                </label>
                <textarea
                  placeholder="Enter any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={formData.signatureRequired}
                    onChange={(e) => setFormData({...formData, signatureRequired: e.target.checked})}
                    style={{ margin: 0 }}
                  />
                  Signature Required
                </label>

                <div style={{ marginLeft: 'auto' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Insurance Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.insuranceValue}
                    onChange={(e) => setFormData({...formData, insuranceValue: e.target.value})}
                    style={{
                      width: '120px',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Track Shipment
              </h2>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingNumber('');
                  setTrackingInfo(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleTrackingLookup} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#6366f1',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Track
                </button>
              </div>
            </form>

            {trackingInfo && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                      {trackingInfo.shipmentNumber}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      {trackingInfo.customerName} - {trackingInfo.salesOrderNumber}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: `${getStatusColor(trackingInfo.status)}20`,
                    color: getStatusColor(trackingInfo.status),
                    border: `1px solid ${getStatusColor(trackingInfo.status)}40`
                  }}>
                    {trackingInfo.status}
                  </span>
                </div>

                <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>CARRIER</p>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{trackingInfo.carrier}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>METHOD</p>
                    <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{trackingInfo.shippingMethod}</p>
                  </div>
                  {trackingInfo.estimatedDelivery && (
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>EST. DELIVERY</p>
                      <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                        {new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {trackingInfo.actualDelivery && (
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>DELIVERED</p>
                      <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>
                        {new Date(trackingInfo.actualDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {trackingInfo.trackingHistory && trackingInfo.trackingHistory.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>
                      Tracking History
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {trackingInfo.trackingHistory.map((entry, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: index < trackingInfo.trackingHistory.length - 1 ? '1px solid #f3f4f6' : 'none'
                        }}>
                          <div>
                            <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 2px 0' }}>
                              {entry.status}
                            </p>
                            {entry.location && (
                              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                                {entry.location}
                              </p>
                            )}
                            {entry.notes && (
                              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                                {entry.notes}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default Shipment;
