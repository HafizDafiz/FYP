import { useAuthContext } from '../hooks/useAuthContext';
import { useState, useEffect } from 'react';

const StaffDashboard = () => {
  const { user } = useAuthContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/dashboard/staff', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch dashboard data');
      } else {
        setDashboardData(data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Something went wrong while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return { trend: 'neutral', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  if (loading) {
    return (
      <div className="staff-dashboard">
        <div className="dashboard-header">
          <h1>Staff Dashboard</h1>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="loading-message">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-dashboard">
        <div className="dashboard-header">
          <h1>Staff Dashboard</h1>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="error-message">
          {error}
          <button onClick={fetchDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="staff-dashboard">
        <div className="dashboard-header">
          <h1>Staff Dashboard</h1>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="loading-message">No dashboard data available</div>
      </div>
    );
  }

  const salesTrend = calculateTrend(dashboardData.salesActivity.todaySales, dashboardData.salesActivity.yesterdaySales);

  const StatCard = ({ title, value, subtitle, trend, icon }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        fontSize: '24px',
        opacity: 0.3
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '8px',
        fontWeight: '500'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '12px',
          color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {trend === 'up' && '↗️'} {trend === 'down' && '↘️'} {subtitle}
        </div>
      )}
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  return (
    <main className="main-content" style={{ 
      background: '#f8fafc', 
      minHeight: '100vh', 
      padding: '20px',
      paddingLeft: 'clamp(15px, 3vw, 250px)',
      transition: 'padding 0.3s ease'
    }}>
      <div className="container">
        {/* Header Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', 
                fontWeight: '700', 
                color: '#1f2937', 
                margin: '0 0 8px 0',
                lineHeight: '1.2'
              }}>
                Welcome back, {user?.name || 'Staff'}! 👋
              </h1>
              <p style={{ 
                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', 
                color: '#6b7280', 
                margin: '0',
                fontWeight: '500'
              }}>
                {formatTime(currentTime)}
              </p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>👨‍💼</span>
              Staff Dashboard
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Today's Tasks Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                ✅
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 4px 0' 
                }}>
                  Today's Sales
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Sales performance
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {formatCurrency(dashboardData.salesActivity.todaySales)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ color: '#059669' }}>
                Monthly: {formatCurrency(dashboardData.salesActivity.thisMonth)}
              </span>
            </div>
          </div>

          {/* Items Processed Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📦
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 4px 0' 
                }}>
                  Total Products
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Inventory overview
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {dashboardData.inventoryStats.totalProducts}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#ef4444' }}>
                {dashboardData.inventoryStats.lowStock} Low Stock
              </span>
              <span style={{ color: '#dc2626' }}>
                {dashboardData.inventoryStats.outOfStock} Out of Stock
              </span>
            </div>
          </div>

          {/* Low Stock Alert Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 4px 0' 
                }}>
                  Low Stock Items
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Requires attention
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {dashboardData.inventoryStats.lowStock}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#ef4444'
            }}>
              Need immediate restock
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '30px'
        }}>
          {/* Recent Tasks */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>�</span>
                Recent Products
              </h3>
            </div>
            <div style={{ padding: '0' }}>
              {dashboardData.recentProducts && dashboardData.recentProducts.length > 0 ? (
                dashboardData.recentProducts.map((product, index) => (
                  <div key={product._id} style={{
                    padding: '16px 24px',
                    borderBottom: index < dashboardData.recentProducts.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                        flex: 1,
                        marginRight: '12px'
                      }}>
                        {product.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatCurrency(product.rate || 0)}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        SKU: {product.sku}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: product.quantity < 10 ? '#ef4444' : '#10b981'
                      }}>
                        {product.quantity} in stock
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  No recent products available
                </div>
              )}
            </div>
          </div>

          {/* My Purchase Orders */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>📋</span>
                My Purchase Orders
              </h3>
            </div>
            <div style={{ padding: '0' }}>
              {dashboardData.myPurchaseOrders && dashboardData.myPurchaseOrders.length > 0 ? (
                dashboardData.myPurchaseOrders.map((po, index) => (
                  <div key={po._id} style={{
                    padding: '16px 24px',
                    borderBottom: index < dashboardData.myPurchaseOrders.length - 1 ? '1px solid #f3f4f6' : 'none',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                        flex: 1,
                        marginRight: '12px'
                      }}>
                        {po.poNumber}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatCurrency(po.total)}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        Vendor: {po.vendorName}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: po.status === 'Received' ? '#10b981' : 
                              po.status === 'Sent' ? '#f59e0b' : '#6b7280'
                      }}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  No purchase orders assigned
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            Today's Performance
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#065f46',
                marginBottom: '4px'
              }}>
                85%
              </div>
              <div style={{
                fontSize: '14px',
                color: '#047857',
                fontWeight: '500'
              }}>
                Tasks Completion Rate
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #93c5fd'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e40af',
                marginBottom: '4px'
              }}>
                {dashboardData.recentProducts?.length || 0}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#1d4ed8',
                fontWeight: '500'
              }}>
                Recent Products
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #fbbf24'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#92400e',
                marginBottom: '4px'
              }}>
                {dashboardData.myPurchaseOrders?.length || 0}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#b45309',
                fontWeight: '500'
              }}>
                My Purchase Orders
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StaffDashboard;
