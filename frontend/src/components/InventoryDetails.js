import React from 'react';

const InventoryDetails = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#6b7280',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
          No items found
        </h3>
        <p style={{ fontSize: '14px' }}>
          No inventory items available at the moment.
        </p>
      </div>
    );
  }

  return (
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
        minWidth: '800px'
      }}>
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
              Product Name
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
              textAlign: 'left', 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Type
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
              Description
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
              Rate
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
              Quantity
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item._id || index} style={{ 
              borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}>
              <td style={{ 
                padding: '16px', 
                fontSize: '14px', 
                color: '#1f2937', 
                fontWeight: '500' 
              }}>
                {item.name}
              </td>
              <td style={{ 
                padding: '16px', 
                fontSize: '14px', 
                color: '#6b7280' 
              }}>
                {item.sku}
              </td>
              <td style={{ 
                padding: '16px', 
                fontSize: '14px', 
                color: '#6b7280' 
              }}>
                <span style={{
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {item.type}
                </span>
              </td>
              <td style={{ 
                padding: '16px', 
                fontSize: '14px', 
                color: '#6b7280' 
              }}>
                {item.description || '-'}
              </td>
              <td style={{ 
                padding: '16px', 
                fontSize: '14px', 
                color: '#1f2937', 
                textAlign: 'right', 
                fontWeight: '500' 
              }}>
                ${item.rate?.toFixed(2) || '0.00'}
              </td>
              <td style={{ 
                padding: '16px', 
                fontSize: '14px', 
                color: '#1f2937', 
                textAlign: 'right', 
                fontWeight: '500' 
              }}>
                {item.quantity || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryDetails;
