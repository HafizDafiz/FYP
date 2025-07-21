import { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';

const StockLevel = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setError('You must be logged in to view stock levels.');
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/inventory/items', {
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

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: 'Out of Stock', color: '#ef4444', level: 'critical' };
    if (quantity < 5) return { status: 'Critical Low', color: '#ef4444', level: 'critical' };
    if (quantity < 10) return { status: 'Low Stock', color: '#f59e0b', level: 'low' };
    if (quantity < 20) return { status: 'Medium Stock', color: '#f59e0b', level: 'medium' };
    return { status: 'In Stock', color: '#10b981', level: 'good' };
  };

  const getReorderPoint = (quantity) => {
    if (quantity === 0) return 50;
    if (quantity < 5) return 30;
    if (quantity < 10) return 20;
    return 10;
  };

  const getStockPercentage = (quantity) => {
    const maxStock = 100; // Assumed maximum stock level
    return Math.min((quantity / maxStock) * 100, 100);
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

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setShowOptionsDropdown(false);
  };

  const handleExportStockReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,SKU,Current Stock,Stock Status,Reorder Point,Stock Percentage\n" +
      filteredAndSortedItems.map(item => {
        const status = getStockStatus(item.quantity);
        const reorderPoint = getReorderPoint(item.quantity);
        const percentage = getStockPercentage(item.quantity);
        return `"${item.name}","${item.sku}","${item.quantity}","${status.status}","${reorderPoint}","${percentage.toFixed(1)}%"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stock_levels_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptionsDropdown(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStockStatus(item.quantity);
    switch (filterStatus) {
      case 'critical':
        return matchesSearch && status.level === 'critical';
      case 'low':
        return matchesSearch && status.level === 'low';
      case 'medium':
        return matchesSearch && status.level === 'medium';
      case 'good':
        return matchesSearch && status.level === 'good';
      default:
        return matchesSearch;
    }
  });

  const filteredAndSortedItems = [...filteredItems].sort((a, b) => {
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

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Calculate stock summary
  const stockSummary = {
    total: items.length,
    inStock: items.filter(item => getStockStatus(item.quantity).level === 'good').length,
    lowStock: items.filter(item => getStockStatus(item.quantity).level === 'low' || getStockStatus(item.quantity).level === 'medium').length,
    outOfStock: items.filter(item => getStockStatus(item.quantity).level === 'critical').length,
    totalValue: items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  };

  if (loading) {
    return (
      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading stock levels...</div>
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
              Stock Levels
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280', 
              margin: '0 0 16px 0' 
            }}>
              Monitor inventory stock levels and reorder points
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
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Options Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
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
                      Stock Level <span>{getSortIcon('quantity')}</span>
                    </button>
                    
                    <div style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Filter by Status
                    </div>
                    <button
                      onClick={() => handleFilterChange('all')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: filterStatus === 'all' ? '#f3f4f6' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = filterStatus === 'all' ? '#f3f4f6' : 'none'}
                    >
                      All Items
                    </button>
                    <button
                      onClick={() => handleFilterChange('critical')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: filterStatus === 'critical' ? '#f3f4f6' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#ef4444'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = filterStatus === 'critical' ? '#f3f4f6' : 'none'}
                    >
                      Critical/Out of Stock
                    </button>
                    <button
                      onClick={() => handleFilterChange('low')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: filterStatus === 'low' ? '#f3f4f6' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#f59e0b'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = filterStatus === 'low' ? '#f3f4f6' : 'none'}
                    >
                      Low Stock
                    </button>
                    <button
                      onClick={() => handleFilterChange('good')}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        background: filterStatus === 'good' ? '#f3f4f6' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#10b981',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = filterStatus === 'good' ? '#f3f4f6' : 'none'}
                    >
                      In Stock
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

        {/* Stock Summary Cards */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                TOTAL ITEMS
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {stockSummary.total}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Total inventory items
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                IN STOCK
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {stockSummary.inStock}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Well stocked items
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                LOW STOCK
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {stockSummary.lowStock}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Need attention
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                CRITICAL/OUT
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {stockSummary.outOfStock}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Urgent reorder required
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                TOTAL VALUE
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                ${stockSummary.totalValue.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Current stock value
              </div>
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                  Product Name
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                  SKU
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                  Current Stock
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                  Stock Level
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                  Reorder Point
                </th>
                <th style={{ 
                  padding: '16px 24px', 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: '#374151', 
                  fontSize: '14px',
                  minWidth: '140px'
                }}>
                  Status
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '48px 24px', 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    fontSize: '16px' 
                  }}>
                    {searchTerm || filterStatus !== 'all' ? 'No items found matching your criteria' : 'No items available.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item, index) => {
                  const stockStatus = getStockStatus(item.quantity);
                  const reorderPoint = getReorderPoint(item.quantity);
                  const stockPercentage = getStockPercentage(item.quantity);
                  const itemValue = item.quantity * item.rate;
                  
                  return (
                    <tr 
                      key={item._id} 
                      style={{ 
                        borderBottom: index < filteredAndSortedItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.parentElement.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{
                            width: '80px',
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${stockPercentage}%`,
                              height: '100%',
                              backgroundColor: stockStatus.color,
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {stockPercentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', color: '#1f2937' }}>
                        {reorderPoint}
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
                      <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        ${itemValue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredAndSortedItems.length > 0 && (
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
              Showing {filteredAndSortedItems.length} of {items.length} items
              {(searchTerm || filterStatus !== 'all') && (
                <span style={{ marginLeft: '8px', color: '#3b82f6' }}>
                  (filtered)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#ef4444' }}>
                {stockSummary.outOfStock} critical
              </span>
              <span style={{ color: '#f59e0b' }}>
                {stockSummary.lowStock} low stock
              </span>
            </div>
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

export default StockLevel;
