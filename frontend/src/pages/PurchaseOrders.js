import { useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import Modal from 'react-modal';

const PurchaseOrders = () => {
  const { user } = useAuthContext();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAddress: '',
    items: [],
    tax: 0,
    discount: 0,
    shippingCost: 0,
    carrier: '',
    expectedDelivery: '',
    notes: '',
    internalNotes: '',
    priority: 'Medium',
    paymentTerms: 'Net 30',
    department: '',
    deliveryLocation: ''
  });

  // Item selection states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedUnitPrice, setSelectedUnitPrice] = useState(0);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');

  // Receive items state
  const [receivingItems, setReceivingItems] = useState([]);

  // Add these state for detail modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Shipping carriers and their estimated costs (in SGD)
  const shippingOptions = {
    'pickup': { name: 'Vendor Pickup', baseCost: 0, weightMultiplier: 0 },
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
    fetchPurchaseOrders();
    fetchProducts();
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
        setPurchaseOrders(data);
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

  const handleCreatePO = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      setError('Please add at least one item to the purchase order.');
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/purchase-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create purchase order.');
      } else {
        setShowCreateForm(false);
        setFormData({
          vendorName: '',
          vendorEmail: '',
          vendorPhone: '',
          vendorAddress: '',
          items: [],
          tax: 0,
          discount: 0,
          shippingCost: 0,
          carrier: '',
          expectedDelivery: '',
          notes: '',
          internalNotes: '',
          priority: 'Medium',
          paymentTerms: 'Net 30',
          department: '',
          deliveryLocation: ''
        });
        fetchPurchaseOrders();
        setError(null);
      }
    } catch (err) {
      console.error('Create error:', err);
      setError('Something went wrong while creating the purchase order.');
    }
  };

  const addItemToPO = () => {
    if (selectedProduct) {
      // Adding existing product
      const product = products.find(p => p._id === selectedProduct);
      if (!product) return;

      const newItem = {
        productId: selectedProduct,
        productName: product.name,
        sku: product.sku,
        description: product.description || '',
        quantity: selectedQuantity,
        unitPrice: selectedUnitPrice || product.rate
      };
      
      const updatedItems = [...formData.items, newItem];
      const newShippingCost = formData.carrier ? calculateShippingCost(formData.carrier, updatedItems) : formData.shippingCost;
      const newTax = calculateTax(updatedItems);
      
      setFormData({ ...formData, items: updatedItems, shippingCost: newShippingCost, tax: newTax });
      setSelectedProduct('');
      setSelectedQuantity(1);
      setSelectedUnitPrice(0);
    } else if (newProductName && newProductSku) {
      // Adding new product
      const newItem = {
        productId: null,
        productName: newProductName,
        sku: newProductSku,
        description: newProductDescription,
        quantity: selectedQuantity,
        unitPrice: selectedUnitPrice
      };
      
      const updatedItems = [...formData.items, newItem];
      const newShippingCost = formData.carrier ? calculateShippingCost(formData.carrier, updatedItems) : formData.shippingCost;
      const newTax = calculateTax(updatedItems);
      
      setFormData({ ...formData, items: updatedItems, shippingCost: newShippingCost, tax: newTax });
      setNewProductName('');
      setNewProductSku('');
      setNewProductDescription('');
      setSelectedQuantity(1);
      setSelectedUnitPrice(0);
    }
    setError(null);
  };

  const removeItemFromPO = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const newShippingCost = formData.carrier ? calculateShippingCost(formData.carrier, updatedItems) : formData.shippingCost;
    const newTax = calculateTax(updatedItems);
    
    setFormData({ ...formData, items: updatedItems, shippingCost: newShippingCost, tax: newTax });
  };

  const updatePOStatus = async (poId, status) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/purchase-orders/${poId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const approvePO = async (poId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/purchase-orders/${poId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Approved via system' }),
      });

      if (response.ok) {
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleReceiveItems = async (e) => {
    e.preventDefault();
    
    if (!selectedPO || receivingItems.length === 0) {
      setError('Please select items to receive.');
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/purchase-orders/${selectedPO._id}/receive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receivedItems: receivingItems,
          actualDelivery: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setShowReceiveModal(false);
        setSelectedPO(null);
        setReceivingItems([]);
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error('Receive error:', err);
    }
  };

  const openReceiveModal = (po) => {
    setSelectedPO(po);
    setReceivingItems(po.items.map(item => ({
      itemId: item._id,
      quantityReceived: 0,
      maxQuantity: item.pendingQuantity
    })));
    setShowReceiveModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return { bg: '#f3f4f6', color: '#374151' };
      case 'Sent': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Acknowledged': return { bg: '#fef3c7', color: '#d97706' };
      case 'Partially Received': return { bg: '#fde68a', color: '#f59e0b' };
      case 'Received': return { bg: '#d1fae5', color: '#16a34a' };
      case 'Cancelled': return { bg: '#fee2e2', color: '#dc2626' };
      case 'Closed': return { bg: '#e5e7eb', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return { bg: '#f3f4f6', color: '#6b7280' };
      case 'Medium': return { bg: '#fef3c7', color: '#d97706' };
      case 'High': return { bg: '#fed7aa', color: '#ea580c' };
      case 'Urgent': return { bg: '#fecaca', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const calculateOrderTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return subtotal + (formData.tax || 0) - (formData.discount || 0) + (formData.shippingCost || 0);
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = (po.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (po.vendorEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (po.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAndSortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'orderDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Fetch order detail by ID
  const fetchOrderDetail = async (orderId) => {
    setDetailLoading(true);
    setDetailError(null);
    setOrderDetail(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/purchase-orders/${orderId}`, {
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
            <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading purchase orders...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="purchase-orders-header" style={{ 
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
              margin: '0 0 8px 0'
            }}>
              Purchase Orders
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '0'
            }}>
              Manage supplier orders and track procurement
            </p>
          </div>
          <div className="purchase-orders-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              New Purchase Order
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
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
                placeholder="Search purchase orders..."
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
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', minWidth: 'fit-content' }}>
              {filteredAndSortedOrders.length} purchase orders found
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                No purchase orders found
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first purchase order.'}
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
                  Create Your First Purchase Order
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
                    Priority
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
                {filteredAndSortedOrders.map((po, index) => (
                  <tr key={po._id} style={{ 
                    borderBottom: index < filteredAndSortedOrders.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => handleRowClick(po._id)}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      {po.poNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                      <div style={{ fontWeight: '500' }}>{po.vendorName || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{po.vendorEmail || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {po.items ? po.items.length : 0} item{(po.items && po.items.length > 1) ? 's' : ''}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', textAlign: 'right', fontWeight: '500' }}>
                      ${po.total ? po.total.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: getPriorityColor(po.priority || 'Medium').bg,
                        color: getPriorityColor(po.priority || 'Medium').color
                      }}>
                        {po.priority || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: getStatusColor(po.status || 'Draft').bg,
                        color: getStatusColor(po.status || 'Draft').color
                      }}>
                        {po.status || 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {po.status === 'Draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approvePO(po._id);
                            }}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                        )}
                        {(po.status === 'Sent' || po.status === 'Acknowledged' || po.status === 'Partially Received') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openReceiveModal(po);
                            }}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Receive
                          </button>
                        )}
                        <select
                          value={po.status || 'Draft'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            updatePOStatus(po._id, e.target.value);
                          }}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Acknowledged">Acknowledged</option>
                          <option value="Partially Received">Partially Received</option>
                          <option value="Received">Received</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Purchase Order Modal */}
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
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Create New Purchase Order</h2>
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

            <form onSubmit={handleCreatePO}>
              {/* Vendor Information */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Vendor Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
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
                      Vendor Email *
                    </label>
                    <input
                      type="email"
                      value={formData.vendorEmail}
                      onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
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
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.vendorPhone}
                      onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
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
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Vendor Address
                  </label>
                  <textarea
                    value={formData.vendorAddress}
                    onChange={(e) => setFormData({ ...formData, vendorAddress: e.target.value })}
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
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Existing Product
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        if (e.target.value) {
                          const product = products.find(p => p._id === e.target.value);
                          setSelectedUnitPrice(product?.rate || 0);
                          setNewProductName('');
                          setNewProductSku('');
                          setNewProductDescription('');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select existing product...</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} - ${product.rate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedUnitPrice}
                      onChange={(e) => setSelectedUnitPrice(parseFloat(e.target.value))}
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
                    onClick={addItemToPO}
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
                
                {/* New Product Form */}
                <div style={{ marginTop: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f9fafb' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>Or Add New Product</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px' }}>
                    <div>
                      <input
                        type="text"
                        placeholder="Product Name"
                        value={newProductName}
                        onChange={(e) => {
                          setNewProductName(e.target.value);
                          if (e.target.value) setSelectedProduct('');
                        }}
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
                      <input
                        type="text"
                        placeholder="SKU"
                        value={newProductSku}
                        onChange={(e) => {
                          setNewProductSku(e.target.value);
                          if (e.target.value) setSelectedProduct('');
                        }}
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
                      <input
                        type="text"
                        placeholder="Description"
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
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
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#1f2937' }}>
                              <div style={{ fontWeight: '500' }}>{item.productName}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.sku}</div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', textAlign: 'right' }}>{item.quantity}</td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#6b7280', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', fontSize: '14px', color: '#1f2937', textAlign: 'right', fontWeight: '500' }}>
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeItemFromPO(index)}
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

              {/* Shipping Information */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Shipping Information</h3>
                <div>
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
              </div>

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
                      value={formData.tax.toFixed(2)}
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

              {/* Additional Information */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Additional Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      <option value="Net 30">Net 30</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
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
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Items Modal */}
      {showReceiveModal && selectedPO && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Receive Items - {selectedPO.poNumber}
              </h2>
              <button
                onClick={() => setShowReceiveModal(false)}
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

            <form onSubmit={handleReceiveItems}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>Items to Receive</h3>
                {selectedPO.items.map((item, index) => (
                  <div key={item._id} style={{ 
                    padding: '12px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{item.productName}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{item.sku}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Ordered: {item.quantity} | Received: {item.receivedQuantity} | Pending: {item.pendingQuantity}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Quantity Received:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.pendingQuantity}
                        value={receivingItems[index]?.quantityReceived || 0}
                        onChange={(e) => {
                          const newReceivingItems = [...receivingItems];
                          newReceivingItems[index] = {
                            ...newReceivingItems[index],
                            quantityReceived: parseInt(e.target.value) || 0
                          };
                          setReceivingItems(newReceivingItems);
                        }}
                        style={{
                          width: '100px',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px',
                    transition: 'all 0.2s ease'
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
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  Receive Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Order Details Modal */}
      <Modal
        isOpen={!!selectedOrderId}
        onRequestClose={handleCloseModal}
        contentLabel="Purchase Order Details"
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
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: 16 }}>Purchase Order Details</h2>
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
              <strong>PO Number:</strong> {orderDetail.poNumber || 'N/A'}<br />
              <strong>Date:</strong> {orderDetail.createdAt ? new Date(orderDetail.createdAt).toLocaleString() : 'N/A'}<br />
              <strong>Status:</strong> {orderDetail.status || 'N/A'}<br />
              <strong>Total:</strong> S$${orderDetail.total ? orderDetail.total.toFixed(2) : '0.00'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Supplier:</strong> {orderDetail.vendorName || 'N/A'}<br />
              <strong>Email:</strong> {orderDetail.vendorEmail || 'N/A'}<br />
              <strong>Phone:</strong> {orderDetail.vendorPhone || 'N/A'}<br />
              <strong>Address:</strong> {orderDetail.vendorAddress || 'N/A'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Items:</strong>
              <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Product</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Unit Cost</th>
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
              <strong>Discount:</strong> S$${orderDetail.discount ? orderDetail.discount.toFixed(2) : '0.00'}<br />
              <strong>Shipping:</strong> S$${orderDetail.shippingCost ? orderDetail.shippingCost.toFixed(2) : '0.00'}<br />
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

export default PurchaseOrders;
