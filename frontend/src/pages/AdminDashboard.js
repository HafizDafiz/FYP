import { useAuthContext } from '../hooks/useAuthContext';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
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
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/dashboard/admin`, {
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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const StatCard = ({ title, value, subtitle, trend, icon }) => (
    <div className="dashboard-card" style={{
      background: 'white',
      borderRadius: '12px',
      padding: 'clamp(16px, 3vw, 24px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    }}>
      <div style={{
        position: 'absolute',
        top: 'clamp(12px, 2vw, 16px)',
        right: 'clamp(12px, 2vw, 16px)',
        fontSize: 'clamp(20px, 3vw, 24px)',
        opacity: 0.3
      }}>
        {icon}
      </div>
      <div className="card-subtitle" style={{
        fontSize: 'clamp(12px, 2vw, 14px)',
        color: '#6b7280',
        marginBottom: '8px',
        fontWeight: '500'
      }}>
        {title}
      </div>
      <div className="card-value" style={{
        fontSize: 'clamp(20px, 4vw, 28px)',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '4px',
        lineHeight: '1.2'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: 'clamp(10px, 1.5vw, 12px)',
          color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '500'
        }}>
          {trend === 'up' && '↗️'} {trend === 'down' && '↘️'} {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <main className="main-content" style={{ 
      background: '#f8fafc', 
      minHeight: '100vh', 
      padding: '20px',
      paddingLeft: 'clamp(15px, 3vw, 20px)',
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
            <div style={{ flex: '1', minWidth: '250px' }}>
              <h1 style={{ 
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
                fontWeight: '700', 
                color: '#1f2937', 
                margin: '0 0 8px 0',
                lineHeight: '1.2'
              }}>
                Welcome back, {user?.name || 'Admin'}! 👋
              </h1>
              <p style={{ 
                fontSize: 'clamp(0.8rem, 2vw, 1.1rem)', 
                color: '#6b7280', 
                margin: '0',
                fontWeight: '500'
              }}>
                {formatTime(currentTime)}
              </p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
              borderRadius: '12px',
              fontSize: 'clamp(12px, 2vw, 14px)',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 'fit-content'
            }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              Admin Dashboard
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Sales Activity Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            marginBottom: '0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                💰
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 2px 0' 
                }}>
                  Sales Today
                </h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Current performance
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '6px'
            }}>
              {formatCurrency(dashboardData.salesActivity.todaySales)}
            </div>
            <div style={{
              fontSize: '13px',
              color: dashboardData.salesActivity.yesterdaySales > 0 && dashboardData.salesActivity.todaySales > dashboardData.salesActivity.yesterdaySales ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {dashboardData.salesActivity.yesterdaySales > 0 ? (
                <>
                  <span>{dashboardData.salesActivity.todaySales > dashboardData.salesActivity.yesterdaySales ? '↗' : '↘'}</span>
                  {Math.abs(((dashboardData.salesActivity.todaySales - dashboardData.salesActivity.yesterdaySales) / dashboardData.salesActivity.yesterdaySales * 100)).toFixed(1)}% from yesterday
                </>
              ) : (
                'No comparison data'
              )}
            </div>
          </div>

          {/* Inventory Stats Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            marginBottom: '0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                📦
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 2px 0' 
                }}>
                  Inventory Value
                </h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Total inventory value
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '6px'
            }}>
              {formatCurrency(dashboardData.inventoryStats.totalValue)}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {dashboardData.inventoryStats.totalItems} items in stock
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          marginBottom: '30px'
        }}>
          {/* Recent Products */}
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
                <span style={{ fontSize: '20px' }}>🎯</span>
                Recent Products
              </h3>
            </div>
            <div style={{ padding: '0' }}>
              {dashboardData.recentProducts.map((product, index) => (
                <div key={product._id} style={{
                  padding: '16px 24px',
                  borderBottom: index < dashboardData.recentProducts.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.2s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {product.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#059669'
                    }}>
                      {formatCurrency(product.rate || 0)}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      SKU: {product.sku}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: product.quantity < 10 ? '#ef4444' : '#10b981',
                      fontWeight: '500'
                    }}>
                      {product.quantity} in stock
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Statistics */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '16px 20px',
            marginBottom: '0'
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
              <span style={{ fontSize: '20px' }}>👥</span>
              User Management
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <span>Total Users</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>
                  {dashboardData.userStats?.totalUsers || 0}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '8px'
              }}>
                <span>Admin Users</span>
                <span style={{ fontWeight: '600', color: '#0369a1' }}>
                  {dashboardData.userStats?.adminUsers || 0}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f0fdf4',
                borderRadius: '8px'
              }}>
                <span>Staff Users</span>
                <span style={{ fontWeight: '600', color: '#166534' }}>
                  {dashboardData.userStats?.staffUsers || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '16px 20px',
            marginBottom: '0',
            overflowX: 'auto'
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
              <span style={{ fontSize: '20px' }}>💳</span>
              Recent Sales
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {dashboardData.recentSales?.length > 0 ? (
                dashboardData.recentSales.map((sale, index) => (
                  <div key={sale._id} style={{
                    padding: '12px 0',
                    borderBottom: index < dashboardData.recentSales.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>
                        {sale.customerName}
                      </span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(sale.total)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(sale.orderDate).toLocaleDateString()}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: sale.status === 'completed' ? '#059669' : '#d97706'
                      }}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', margin: '20px 0' }}>
                  No recent sales
                </p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '16px 20px',
            marginBottom: '0',
            overflowX: 'auto'
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
              <span style={{ fontSize: '20px' }}>🏆</span>
              Top Products (This Month)
            </h3>
            <div>
              {dashboardData.topProducts?.length > 0 ? (
                dashboardData.topProducts.map((product, index) => (
                  <div key={index} style={{
                    padding: '12px 0',
                    borderBottom: index < dashboardData.topProducts.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>
                        {product._id}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        #{index + 1}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Sold: {product.totalQuantity} units
                      </span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(product.totalRevenue)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', margin: '20px 0' }}>
                  No sales data for this month
                </p>
              )}
            </div>
          </div>

          {/* Recent Receiving Receipts */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            padding: '16px 20px',
            marginBottom: '0',
            overflowX: 'auto'
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
              <span style={{ fontSize: '20px' }}>📋</span>
              Recent Receiving Receipts
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {dashboardData.recentReceivingReceipts?.length > 0 ? (
                dashboardData.recentReceivingReceipts.map((receipt, index) => (
                  <div key={receipt._id} style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937',
                      marginBottom: '8px'
                    }}>
                      {receipt.receiptNumber}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      PO: {receipt.purchaseOrderId?.poNumber || 'N/A'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      Vendor: {receipt.purchaseOrderId?.vendorName || 'N/A'}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {new Date(receipt.receivedAt).toLocaleDateString()}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: receipt.status === 'completed' ? '#059669' : '#d97706'
                      }}>
                        {receipt.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', margin: '20px 0' }}>
                  No recent receiving receipts
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Responsive grid for larger screens */}
        <style>{`
          @media (min-width: 600px) {
            .dashboard-grid {
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
};

export default AdminDashboard;
