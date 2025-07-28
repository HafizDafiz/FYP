import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import Modal from 'react-modal';

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
    shippingCost: 0,
    carrier: '',
    expectedDelivery: '',
    notes: ''
  });

  // Item selection states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Add state for detail modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Shipping carriers and their estimated costs (in SGD)
  const shippingOptions = {
    'pickup': { name: 'Customer Pickup', baseCost: 0, weightMultiplier: 0 },
    'local-delivery': { name: 'Local Delivery (Same Day)', baseCost: 8.50, weightMultiplier: 0 },
    'singpost-standard': { name: 'SingPost Standard', baseCost: 2.50, weightMultiplier: 1.20 },
    'singpost-express': { name: 'SingPost Express', baseCost: 5.80, weightMultiplier: 1.50 },
    'dhl-express': { name: 'DHL Express', baseCost: 15.00, weightMultiplier: 2.80 },
    'fedex-international': { name: 'FedEx International', baseCost: 18.50, weightMultiplier: 3.20 },
    'ups-express': { name: 'UPS Express', baseCost: 16.80, weightMultiplier: 2.95 },
    'ninja-van': { name: 'Ninja Van', baseCost: 3.50, weightMultiplier: 0.80 },
    'shopee-express': { name: 'Shopee Express', baseCost: 2.90, weightMultiplier: 0.70 },
    'grab-express': { name: 'Grab Express', baseCost: 12.00, weightMultiplier: 0 },
    'lalamove': { name: 'Lalamove', baseCost: 9.50, weightMultiplier: 0 }
  };

  // Calculate shipping cost based on carrier and order weight
  const calculateShippingCost = (carrier, orderItems = []) => {
    if (!carrier || !shippingOptions[carrier]) return 0;
    
    const option = shippingOptions[carrier];
    
    // Estimate total weight (assuming 0.5kg per item as default)
    const totalWeight = orderItems.reduce((weight, item) => weight + (item.quantity * 0.5), 0);
    
    return option.baseCost + (totalWeight * option.weightMultiplier);
  };

  // Handle carrier selection
  const handleCarrierChange = (selectedCarrier) => {
    const shippingCost = calculateShippingCost(selectedCarrier, formData.items);
    setFormData({ 
      ...formData, 
      carrier: selectedCarrier,
      shippingCost: shippingCost
    });
  };

  // Calculate 9% tax automatically
  const calculateTax = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return subtotal * 0.09; // 9% tax
  };

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
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sales`, {
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
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/inventory/items`, {
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
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sales`, {
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
          shippingCost: 0,
          carrier: '',
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
    let updatedItems;
    
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += selectedQuantity;
    } else {
      // Add new item
      const newItem = {
        productId: selectedProduct,
        productName: product.name,
        sku: product.sku,
        quantity: selectedQuantity,
        unitPrice: product.rate
      };
      updatedItems = [...formData.items, newItem];
    }

    // Recalculate shipping cost if carrier is selected
    const newShippingCost = formData.carrier ? calculateShippingCost(formData.carrier, updatedItems) : 0;
    
    // Calculate 9% tax automatically
    const newTax = calculateTax(updatedItems);
    
    setFormData({ 
      ...formData, 
      items: updatedItems,
      shippingCost: newShippingCost,
      tax: newTax
    });

    setSelectedProduct('');
    setSelectedQuantity(1);
    setError(null);
  };

  const removeItemFromOrder = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    // Recalculate shipping cost if carrier is selected
    const newShippingCost = formData.carrier ? calculateShippingCost(formData.carrier, updatedItems) : 0;
    
    // Calculate 9% tax automatically
    const newTax = calculateTax(updatedItems);
    
    setFormData({ 
      ...formData, 
      items: updatedItems,
      shippingCost: newShippingCost,
      tax: newTax
    });
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sales/${orderId}/status`, {
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
    const apiUrl = process.env.REACT_APP_API_URL;
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
    return subtotal + (formData.tax || 0) + (formData.shippingCost || 0) - (formData.discount || 0);
  };

  // Fetch order detail by ID
  const fetchOrderDetail = async (orderId) => {
    setDetailLoading(true);
    setDetailError(null);
    setOrderDetail(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sales/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setDetailError(data.error || 'Failed to fetch order details.');
      } else {
        setOrderDetail(data);
      }
    } catch (err) {
      setDetailError('Something went wrong while fetching order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle row click
  const handleRowClick = (orderId) => {
    setScrollPosition(window.scrollY);
    setSelectedOrderId(orderId);
    fetchOrderDetail(orderId);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setDetailError(null);
    setDetailLoading(false);
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
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
            <div className="table-container" style={{ 
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
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
                    ORDER NUMBER
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
                    ITEMS
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
                    TOTAL
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
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    ORDER DATE
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
                {filteredAndSortedOrders.map((order, index) => (
                  <tr key={order._id} style={{ 
                    borderBottom: index < filteredAndSortedOrders.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleRowClick(order._id)}
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
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order._id, e.target.value);
                        }}
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
            </div>
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
                    Shipping Carrier
                  </label>
                  <select
                    value={formData.carrier}
                    onChange={(e) => handleCarrierChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select shipping method</option>
                    {Object.entries(shippingOptions).map(([key, option]) => (
                      <option key={key} value={key}>
                        {option.name} - S${option.baseCost.toFixed(2)}{option.weightMultiplier > 0 ? ' + weight' : ''}
                      </option>
                    ))}
                  </select>
                  {formData.carrier && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      Estimated shipping cost: S${formData.shippingCost.toFixed(2)}
                    </div>
                  )}
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
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '44px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
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
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  minHeight: '44px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Tax (S$) - 9% Auto-calculated
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#f9fafb',
                        color: '#6b7280'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Discount (S$)
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
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Shipping (S$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shippingCost}
                      onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: formData.carrier ? '#f9fafb' : 'white'
                      }}
                      placeholder={formData.carrier ? 'Auto-calculated' : 'Manual entry'}
                    />
                  </div>
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Subtotal:</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      S${formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Tax:</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>S${(formData.tax || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Shipping:</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>S${(formData.shippingCost || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Discount:</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>-S${(formData.discount || 0).toFixed(2)}</span>
                  </div>
                  <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Total:</span>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      S${calculateOrderTotal().toFixed(2)}
                    </span>
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

      {/* Sales Order Details Modal */}
      <Modal
        isOpen={!!selectedOrderId}
        onRequestClose={handleCloseModal}
        contentLabel="Sales Order Details"
        style={{
          overlay: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 },
          content: {
            maxWidth: '700px',
            margin: 'auto',
            borderRadius: '8px',
            padding: '32px',
            inset: '40px',
            overflow: 'auto',
          },
        }}
        ariaHideApp={false}
      >
        <button onClick={handleCloseModal} style={{ float: 'right', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: 16 }}>Sales Order Details</h2>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <div style={{ color: '#6b7280', marginTop: 12 }}>Loading order details...</div>
          </div>
        ) : detailError ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 6 }}>
            {detailError}
          </div>
        ) : orderDetail ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>Order Number:</strong> {orderDetail.orderNumber || 'N/A'}<br />
              <strong>Date:</strong> {orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleString() : 'N/A'}<br />
              <strong>Status:</strong> {orderDetail.status || 'N/A'}<br />
              <strong>Total:</strong> S$${orderDetail.total ? orderDetail.total.toFixed(2) : '0.00'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Customer:</strong> {orderDetail.customerName || 'N/A'}<br />
              <strong>Email:</strong> {orderDetail.customerEmail || 'N/A'}<br />
              <strong>Phone:</strong> {orderDetail.customerPhone || 'N/A'}<br />
              <strong>Address:</strong> {orderDetail.customerAddress || 'N/A'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Items:</strong>
              <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Product</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetail.items && orderDetail.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 8 }}>{item.productName || (item.productId && item.productId.name) || 'N/A'}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>${item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>${item.totalPrice ? item.totalPrice.toFixed(2) : (item.quantity && item.unitPrice ? (item.quantity * item.unitPrice).toFixed(2) : '0.00')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Subtotal:</strong> S$${orderDetail.subtotal ? orderDetail.subtotal.toFixed(2) : '0.00'}<br />
              <strong>Tax:</strong> S$${orderDetail.tax ? orderDetail.tax.toFixed(2) : '0.00'}<br />
              <strong>Shipping:</strong> S$${orderDetail.shippingCost ? orderDetail.shippingCost.toFixed(2) : '0.00'}
              {orderDetail.carrier && (
                <span style={{ color: '#6b7280', fontSize: '14px' }}> ({orderDetail.carrier})</span>
              )}<br />
              <strong>Discount:</strong> S$${orderDetail.discount ? orderDetail.discount.toFixed(2) : '0.00'}<br />
              <strong>Total:</strong> S$${orderDetail.total ? orderDetail.total.toFixed(2) : '0.00'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Notes:</strong> {orderDetail.notes || 'N/A'}
            </div>
          </div>
        ) : null}
      </Modal>
    </main>
  );
};

export default Sales;
