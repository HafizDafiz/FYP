// import { useState, useEffect } from 'react';

// const PurchaseForm = () => {
//   const [showModal, setShowModal] = useState(false); // Toggle modal
//   const [itemName, setItemName] = useState('');
//   const [SKU, setSKU] = useState('');
//   const [quantity, setQuantity] = useState('');
//   const [location, setLocation] = useState('');
//   const [price, setPrice] = useState('');
//   const [vendorName, setVendorName] = useState('');

//   const [inventoryItems, setInventoryItems] = useState([]);
//   const [loadingInventory, setLoadingInventory] = useState(true);
//   const [inventoryError, setInventoryError] = useState(null);

//   useEffect(() => {
//     const fetchInventory = async () => {
//       const storedUser = localStorage.getItem('user');
//       const token = storedUser ? JSON.parse(storedUser).token : null;

//       if (!token) {
//         setInventoryError('You must be logged in to view inventory.');
//         setLoadingInventory(false);
//         return;
//       }

//       try {
//         const response = await fetch('/api/purchases', {
//           headers: { 'Authorization': `Bearer ${token}` },
//         });

//         if (!response.ok) {
//           const json = await response.json();
//           throw new Error(json.error || 'Failed to fetch inventory.');
//         }

//         const data = await response.json();
//         setInventoryItems(data);
//       } catch (error) {
//         setInventoryError('Error fetching inventory: ' + error.message);
//       } finally {
//         setLoadingInventory(false);
//       }
//     };

//     fetchInventory();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const storedUser = localStorage.getItem('user');
//     const token = storedUser ? JSON.parse(storedUser).token : null;

//     if (!token) {
//       alert('You must be logged in');
//       return;
//     }

//     const purchase = { itemName, SKU, quantity, location, price, vendorName };

//     try {
//       const response = await fetch('/api/purchases', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(purchase)
//       });

//       const json = await response.json();

//       if (!response.ok) {
//         alert(json.error || 'Failed to add purchase');
//       } else {
//         alert('Purchase added!');
//         setItemName('');
//         setSKU('');
//         setQuantity('');
//         setLocation('');
//         setPrice('');
//         setVendorName('');
//         setShowModal(false); // Close modal
//       }
//     } catch (error) {
//       alert('Error: ' + error.message);
//     }
//   };

//   return (
//     <div>
//       {/* Add Purchase Button */}
//       <button onClick={() => setShowModal(true)} style={{
//         padding: '10px 20px',
//         backgroundColor: '#005b96',
//         color: 'white',
//         border: 'none',
//         borderRadius: '5px',
//         cursor: 'pointer',
//         marginBottom: '20px'
//       }}>
//         Add Purchase
//       </button>

//       {/* Modal */}
//       {showModal && (
//         <div style={{
//           position: 'fixed',
//           top: 0, left: 0, right: 0, bottom: 0,
//           backgroundColor: 'rgba(0,0,0,0.6)',
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           zIndex: 1000
//         }}>
//           <div style={{
//             backgroundColor: 'white',
//             padding: '30px',
//             borderRadius: '10px',
//             width: '90%',
//             maxWidth: '500px',
//             boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
//             position: 'relative'
//           }}>
//             <button onClick={() => setShowModal(false)} style={{
//               position: 'absolute',
//               top: '10px',
//               right: '15px',
//               background: 'none',
//               border: 'none',
//               fontSize: '18px',
//               cursor: 'pointer'
//             }}>×</button>

//             <h2 style={{ marginBottom: '20px' }}>Add New Purchase</h2>
//             <form onSubmit={handleSubmit}>
//               <input type="text" placeholder="Item Name" value={itemName} onChange={e => setItemName(e.target.value)} required />
//               <input type="text" placeholder="SKU" value={SKU} onChange={e => setSKU(e.target.value)} required />
//               <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required />
//               <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} required />
//               <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required />
//               <input type="text" placeholder="Vendor Name" value={vendorName} onChange={e => setVendorName(e.target.value)} required />
//               <button type="submit" style={{
//                 marginTop: '15px',
//                 padding: '10px 20px',
//                 backgroundColor: '#005b96',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '5px',
//                 cursor: 'pointer'
//               }}>Submit</button>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Inventory Table */}
//       <hr />
//       <h2>Purchased Items</h2>
//       <div style={{
//         backgroundColor: '#f8c000',
//         padding: '20px',
//         borderRadius: '8px',
//         boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
//       }}>
//         {loadingInventory && <p>Loading inventory...</p>}
//         {inventoryError && <p style={{ color: 'red' }}>{inventoryError}</p>}
//         {!loadingInventory && !inventoryError && inventoryItems.length === 0 && (
//           <p>No inventory items found.</p>
//         )}
//         {!loadingInventory && !inventoryError && inventoryItems.length > 0 && (
//           <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
//             <thead>
//               <tr>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>Item Name</th>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>SKU</th>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>Quantity</th>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>Price</th>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>Total Price</th>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>Vendor Name</th>
//                 <th style={{ backgroundColor: '#3b3a63', color: 'white', padding: '12px 15px', border: '1px solid #ddd' }}>Created At</th>
//               </tr>
//             </thead>
//             <tbody>
//               {inventoryItems.map((item, index) => (
//                 <tr key={item._id || index} style={{ backgroundColor: index % 2 === 0 ? '#f0b000' : '#f8c000' }}>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{item.itemName}</td>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{item.SKU}</td>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{item.quantity}</td>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{item.price}</td>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{(item.quantity * item.price).toFixed(2)}</td>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{item.vendorName}</td>
//                   <td style={{ padding: '10px 15px', border: '1px solid #ddd', color: '#333' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PurchaseForm;
import React, { useState } from 'react';

const PurchaseForm = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    quantityPurchased: 0,
    rate: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantityPurchased' || name === 'rate' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.token) {
      alert("You must be logged in to make a purchase.");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create purchase');
      }

      alert("✅ Purchase recorded successfully");
      setForm({
        name: '',
        description: '',
        quantityPurchased: 0,
        rate: 0
      });
    } catch (err) {
      alert("❌ Failed to record purchase: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>New Purchase</h2>
      <input
        name='name'
        placeholder='Name'
        value={form.name}
        onChange={handleChange}
      /><br />
      <input
        name='description'
        placeholder='Description'
        value={form.description}
        onChange={handleChange}
      /><br />

      <input
        type='number'
        name="quantityPurchased"
        placeholder="Quantity"
        value={form.quantityPurchased}
        onChange={handleChange}
      /><br />

      <input
        type='number'
        name="rate"
        placeholder='Rate'
        value={form.rate}
        onChange={handleChange}
      /><br />

      <button type="submit">Submit</button>
    </form>
  );
};

export default PurchaseForm;
