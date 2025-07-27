import { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';

const StockTaking = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stockAdjustments, setStockAdjustments] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setError('You must be logged in to view inventory.');
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await fetch(`${apiUrl}/api/inventory/items`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch inventory.');
          setItems([]);
        } else {
          setItems(data);
          setError(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Something went wrong while fetching inventory.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setShowOptionsDropdown(false);
  };

  const handleStockAdjustment = (itemId, newQuantity) => {
    setStockAdjustments(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
  };

  const handleUpdateStock = async (itemId, newQuantity) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/inventory/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: parseInt(newQuantity) })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update stock.');
      } else {
        // Update local state
        setItems(prev => prev.map(item => 
          item._id === itemId ? { ...item, quantity: parseInt(newQuantity) } : item
        ));
        // Clear adjustment
        setStockAdjustments(prev => {
          const newAdjustments = { ...prev };
          delete newAdjustments[itemId];
          return newAdjustments;
        });
        setError(null);
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Something went wrong while updating stock.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!user || Object.keys(stockAdjustments).length === 0) return;

    setIsUpdating(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const promises = Object.entries(stockAdjustments).map(([itemId, quantity]) =>
        fetch(`${apiUrl}/api/inventory/items/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: parseInt(quantity) })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Update local state for successful updates
      const updatedItems = items.map(item => {
        const adjustment = stockAdjustments[item._id];
        return adjustment !== undefined ? { ...item, quantity: parseInt(adjustment) } : item;
      });

      setItems(updatedItems);
      setStockAdjustments({});
      setError(null);
    } catch (err) {
      console.error('Bulk update error:', err);
      setError('Something went wrong while updating stocks.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportStockReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,SKU,Current Stock,Adjusted Stock,Difference,Status\n" +
      items.map(item => {
        const adjustment = stockAdjustments[item._id];
        const difference = adjustment !== undefined ? adjustment - item.quantity : 0;
        const status = getStockStatus(item.quantity).status;
        return `"${item.name}","${item.sku}","${item.quantity}","${adjustment || item.quantity}","${difference}","${status}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stock_taking_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptionsDropdown(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
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

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: 'Out of Stock', color: '#ef4444' };
    if (quantity < 10) return { status: 'Low Stock', color: '#f59e0b' };
    return { status: 'In Stock', color: '#10b981' };
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const hasAdjustments = Object.keys(stockAdjustments).length > 0;

  if (loading) {
    return (
      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading stock taking...</div>
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
          padding: 'clamp(16px, 3vw, 24px)', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h1 style={{ 
              fontSize: 'clamp(20px, 4vw, 32px)', 
              fontWeight: '700', 
              color: '#1f2937', 
              margin: '0 0 8px 0' 
            }}>
              Stock Taking
            </h1>
            <p style={{ 
              fontSize: 'clamp(12px, 2vw, 16px)', 
              color: '#6b7280', 
              margin: '0 0 16px 0' 
            }}>
              Adjust inventory stock levels
            </p>
            
            {/* Search Bar */}
            <div style={{ position: 'relative', maxWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box',
                  minHeight: '44px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#312F56'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280',
                fontSize: '16px'
              }}>
                🔍
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Bulk Update Button */}
            {hasAdjustments && (
              <button
                onClick={handleBulkUpdate}
                disabled={isUpdating}
                style={{
                  background: isUpdating ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isUpdating ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.3)',
                  minHeight: '44px'
                }}
              >
                {isUpdating ? 'Updating...' : `Update ${Object.keys(stockAdjustments).length} Items`}
              </button>
            )}

            {/* Options Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  minHeight: '44px'
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                ⋯
              </button>
              
              {showOptionsDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  minWidth: '200px'
                }}>
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Sort by
                    </div>
                    <button
                      onClick={() => handleSort('name')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                      Name <span>{getSortIcon('name')}</span>
                    </button>
                    <button
                      onClick={() => handleSort('sku')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                      SKU <span>{getSortIcon('sku')}</span>
                    </button>
                    <button
                      onClick={() => handleSort('quantity')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                      Current Stock <span>{getSortIcon('quantity')}</span>
                    </button>
                    <button
                      onClick={handleExportStockReport}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                      📥 Export Report
                    </button>
                  </div>
                </div>
              )}
            </div>
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

        {/* Table */}
        <div className="table-container" style={{ 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          background: 'white'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '800px' // Ensures horizontal scroll on mobile
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  position: 'sticky',
                  left: 0,
                  background: '#f9fafb',
                  zIndex: 10
                }}>
                  PRODUCT NAME
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
                  SKU
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
                  CURRENT STOCK
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
                  ADJUSTED STOCK
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
                  DIFFERENCE
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  minWidth: '140px'
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
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '48px 24px', 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    fontSize: '16px' 
                  }}>
                    {searchTerm ? `No items found matching "${searchTerm}"` : 'No items available for stock taking.'}
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, index) => {
                  const stockStatus = getStockStatus(item.quantity);
                  const adjustedQuantity = stockAdjustments[item._id];
                  const difference = adjustedQuantity !== undefined ? adjustedQuantity - item.quantity : 0;
                  const hasAdjustment = adjustedQuantity !== undefined;
                  
                  return (
                    <tr 
                      key={item._id} 
                      style={{ 
                        borderBottom: index < sortedItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background-color 0.2s ease',
                        backgroundColor: hasAdjustment ? '#f0f9ff' : 'transparent'
                      }}
                      onMouseOver={(e) => {
                        if (!hasAdjustment) {
                          e.target.parentElement.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!hasAdjustment) {
                          e.target.parentElement.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          value={adjustedQuantity !== undefined ? adjustedQuantity : item.quantity}
                          onChange={(e) => handleStockAdjustment(item._id, e.target.value)}
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            border: hasAdjustment ? '2px solid #3b82f6' : '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#667eea'}
                          onBlur={(e) => {
                            if (!hasAdjustment) {
                              e.target.style.borderColor = '#d1d5db';
                            }
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: difference > 0 ? '#10b981' : difference < 0 ? '#ef4444' : '#6b7280'
                        }}>
                          {difference > 0 ? '+' : ''}{difference}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: `${stockStatus.color}20`,
                          color: stockStatus.color,
                          border: `1px solid ${stockStatus.color}40`
                        }}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        {hasAdjustment && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleUpdateStock(item._id, adjustedQuantity)}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                background: isUpdating ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s ease'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setStockAdjustments(prev => {
                                const newAdjustments = { ...prev };
                                delete newAdjustments[item._id];
                                return newAdjustments;
                              })}
                              disabled={isUpdating}
                              style={{
                                padding: '6px 12px',
                                background: isUpdating ? '#9ca3af' : '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s ease'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {sortedItems.length > 0 && (
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
              Showing {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            {hasAdjustments && (
              <div style={{ color: '#3b82f6', fontWeight: '500' }}>
                {Object.keys(stockAdjustments).length} item{Object.keys(stockAdjustments).length !== 1 ? 's' : ''} pending adjustment
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
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

export default StockTaking;
