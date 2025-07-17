import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const Sales = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [salesOrders, setSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    items: [],
    tax: 0,
    discount: 0,
    expectedDelivery: '',
    notes: ''
  });

  // Item selection states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    fetchSalesOrders();
    fetchProducts();
  }, [user]);

  const fetchSalesOrders = async () => {
    if (!user) {
      setError('You must be logged in to view sales orders.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/sales', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch sales orders.');
        setSalesOrders([]);
      } else {
        setSalesOrders(data);
        setError(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Something went wrong while fetching sales orders.');
      setSalesOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/inventory/items', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      setError('Please add at least one item to the order.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create sales order.');
      } else {
        setShowCreateForm(false);
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: '',
          items: [],
          tax: 0,
          discount: 0,
          expectedDelivery: '',
          notes: ''
        });
        fetchSalesOrders();
        fetchProducts(); // Refresh products to show updated stock
        setError(null);
      }
    } catch (err) {
      console.error('Create error:', err);
      setError('Something went wrong while creating the order.');
    }
  };

  const addItemToOrder = () => {
    if (!selectedProduct) return;

    const product = products.find(p => p._id === selectedProduct);
    if (!product) return;

    if (selectedQuantity > product.quantity) {
      setError(`Not enough stock. Available: ${product.quantity}`);
      return;
    }

    const existingItemIndex = formData.items.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += selectedQuantity;
      setFormData({ ...formData, items: updatedItems });
    } else {
      // Add new item
      const newItem = {
        productId: selectedProduct,
        productName: product.name,
        sku: product.sku,
        quantity: selectedQuantity,
        unitPrice: product.rate
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }

    setSelectedProduct('');
    setSelectedQuantity(1);
    setError(null);
  };

  const removeItemFromOrder = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`http://localhost:4000/api/sales/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchSalesOrders();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
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
      "Order Number,Customer Name,Customer Email,Status,Total,Order Date\n" +
      filteredAndSortedOrders.map(order => 
        `"${order.orderNumber}","${order.customerName}","${order.customerEmail}","${order.status}","${order.total}","${new Date(order.orderDate).toLocaleDateString()}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptionsDropdown(false);
  };

  const filteredOrders = salesOrders.filter(order => {
    const matchesSearch = (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAndSortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle undefined values
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';
    
    if (sortBy === 'orderDate' || sortBy === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return { bg: '#fef3c7', color: '#d97706' };
      case 'Confirmed': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Processing': return { bg: '#fde68a', color: '#f59e0b' };
      case 'Shipped': return { bg: '#d1fae5', color: '#10b981' };
      case 'Delivered': return { bg: '#d1fae5', color: '#16a34a' };
      case 'Cancelled': return { bg: '#fee2e2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const calculateOrderTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return subtotal + (formData.tax || 0) - (formData.discount || 0);
  };

  if (loading) {
    return (
      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
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
            <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading sales orders...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 8px 0'
            }}>
              Sales Orders
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '0'
            }}>
              Manage customer orders and track sales
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              New Order
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
              >
                ⋯
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
                    <div style={{ 
                      padding: '8px 16px', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      Sort by
                    </div>
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
                      Order Date {sortBy === 'orderDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('customerName')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'customerName' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      Customer {sortBy === 'customerName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSort('total')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: sortBy === 'total' ? '#f3f4f6' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                      Export to CSV
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
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                placeholder="Search orders..."
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
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
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

        {/* Sales Orders Table */}
        <div style={{ 
          background: 'white', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {filteredAndSortedOrders.length === 0 ? (
            <div style={{ 
              padding: '60px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                No sales orders found
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first sales order.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Your First Order
                </button>
              )}
            </div>
          ) : (
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
                    Order Number
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
                    Customer
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
                    Items
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
                    Total
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
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Order Date
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
                {filteredAndSortedOrders.map((order, index) => (
                  <tr key={order._id} style={{ 
                    borderBottom: index < filteredAndSortedOrders.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      {order.orderNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                      <div style={{ fontWeight: '500' }}>{order.customerName || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.customerEmail || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {order.items ? order.items.length : 0} item{(order.items && order.items.length > 1) ? 's' : ''}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', textAlign: 'right', fontWeight: '500' }}>
                      ${order.total ? order.total.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: getStatusColor(order.status || 'Pending').bg,
                        color: getStatusColor(order.status || 'Pending').color
                      }}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <select
                        value={order.status || 'Pending'}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateForm && (
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
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Create New Sales Order</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              {/* Customer Information */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Customer Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      required
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
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Expected Delivery
                    </label>
                    <input
                      type="date"
                      value={formData.expectedDelivery}
                      onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
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
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Add Items */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Add Items</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Product
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - ${product.rate} (Stock: {product.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '120px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
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
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Order Items */}
              {formData.items.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Order Items</h3>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Product</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Price</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Total</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : 'none' }}>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#1f2937' }}>{item.productName}</td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', textAlign: 'right' }}>{item.quantity}</td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#1f2937', textAlign: 'right', fontWeight: '500' }}>
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeItemFromOrder(index)}
                                style={{
                                  background: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Order Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Tax ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Discount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
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
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '6px',
                  textAlign: 'right' 
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    Total: ${calculateOrderTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay for dropdown */}
      {showOptionsDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowOptionsDropdown(false)}
        />
      )}
    </main>
  );
};

export default Sales;
