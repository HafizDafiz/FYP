import { useAuthContext } from '../hooks/useAuthContext';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Sample dashboard data - replace with actual API calls later
  const dashboardData = {
    salesActivity: {
      todaySales: 12450,
      yesterdaySales: 10200,
      thisMonth: 345600,
      lastMonth: 298400
    },
    inventoryStats: {
      totalProducts: 1247,
      lowStock: 23,
      outOfStock: 8,
      totalValue: 2341560
    },
    recentProducts: [
      { id: 1, name: 'Wireless Headphones', sku: 'WH-001', stock: 45, price: 89.99 },
      { id: 2, name: 'Smartphone Case', sku: 'SC-123', stock: 12, price: 24.99 },
      { id: 3, name: 'USB Cable', sku: 'UC-456', stock: 3, price: 12.99 },
      { id: 4, name: 'Bluetooth Speaker', sku: 'BS-789', stock: 67, price: 149.99 }
    ],
    quickActions: [
      { title: 'Add New Product', icon: '📦', action: 'add-product' },
      { title: 'View Orders', icon: '🛒', action: 'view-orders' },
      { title: 'Generate Report', icon: '📊', action: 'generate-report' },
      { title: 'Manage Users', icon: '👥', action: 'manage-users' }
    ],
    tasks: [
      { title: 'Review sales reports', completed: true },
      { title: 'Update inventory', completed: false },
      { title: 'Prepare for meeting with suppliers', completed: false },
      { title: 'Send invoice to client', completed: true }
    ]
  };

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

  const QuickActionCard = ({ title, icon, onClick }) => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center'
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.1)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
        {title}
      </div>
    </div>
  );

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
                Welcome back, {user?.name || 'Admin'}! 👋
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              Admin Dashboard
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
          {/* Sales Activity Card */}
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
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                💰
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 4px 0' 
                }}>
                  Sales Today
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Current performance
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              ${dashboardData.salesActivity.todaySales.toLocaleString()}
            </div>
            <div style={{
              fontSize: '14px',
              color: dashboardData.salesActivity.todaySales > dashboardData.salesActivity.yesterdaySales ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{dashboardData.salesActivity.todaySales > dashboardData.salesActivity.yesterdaySales ? '↗' : '↘'}</span>
              {Math.abs(((dashboardData.salesActivity.todaySales - dashboardData.salesActivity.yesterdaySales) / dashboardData.salesActivity.yesterdaySales * 100)).toFixed(1)}% from yesterday
            </div>
          </div>

          {/* Inventory Stats Card */}
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
              {dashboardData.inventoryStats.totalProducts.toLocaleString()}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ color: '#f59e0b' }}>
                {dashboardData.inventoryStats.lowStock} Low Stock
              </span>
              <span style={{ color: '#ef4444' }}>
                {dashboardData.inventoryStats.outOfStock} Out of Stock
              </span>
            </div>
          </div>

          {/* Monthly Revenue Card */}
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
                📈
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 4px 0' 
                }}>
                  Monthly Revenue
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  This month's performance
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              ${dashboardData.salesActivity.thisMonth.toLocaleString()}
            </div>
            <div style={{
              fontSize: '14px',
              color: dashboardData.salesActivity.thisMonth > dashboardData.salesActivity.lastMonth ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{dashboardData.salesActivity.thisMonth > dashboardData.salesActivity.lastMonth ? '↗' : '↘'}</span>
              {Math.abs(((dashboardData.salesActivity.thisMonth - dashboardData.salesActivity.lastMonth) / dashboardData.salesActivity.lastMonth * 100)).toFixed(1)}% from last month
            </div>
          </div>

          {/* Inventory Value Card */}
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
                💎
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 4px 0' 
                }}>
                  Inventory Value
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280', 
                  margin: '0' 
                }}>
                  Total stock value
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              ${dashboardData.inventoryStats.totalValue.toLocaleString()}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Current market value
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
                <div key={product.id} style={{
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
                      ${product.price}
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
                      color: product.stock < 10 ? '#ef4444' : '#10b981',
                      fontWeight: '500'
                    }}>
                      {product.stock} in stock
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
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
              <span style={{ fontSize: '20px' }}>⚡</span>
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '16px'
            }}>
              {dashboardData.quickActions.map((action, index) => (
                <div key={index} style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e5e7eb'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    fontSize: '28px',
                    marginBottom: '8px'
                  }}>
                    {action.icon}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    lineHeight: '1.4'
                  }}>
                    {action.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Section */}
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
            <span style={{ fontSize: '20px' }}>📋</span>
            Today's Tasks
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {dashboardData.tasks.map((task, index) => (
              <div key={index} style={{
                background: task.completed ? '#f0f9f0' : '#fff7ed',
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${task.completed ? '#d1fae5' : '#fed7aa'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: task.completed ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white'
                }}>
                  {task.completed ? '✓' : '⏳'}
                </div>
                <div style={{
                  flex: 1,
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {task.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
