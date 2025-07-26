
// const InventoryDetails = ({ items }) => {
//   return (
//     <table className="inventory-table">
//       <thead>
//         <tr>
//           <th>Product Name</th>
//           <th>SKU</th>
//           <th>Type</th>
//           <th>Description</th>
//           <th>Rate</th>
//           <th>Quantity</th>
//         </tr>
//       </thead>
//       <tbody>
//         {items.map((item) => (
//           <tr key={item._id}>
//             <td>{item.name}</td>
//             <td>{item.sku}</td>
//             <td>{item.type}</td>
//             <td>{item.description}</td>
//             <td>${item.rate?.toFixed(2)}</td>
//             <td>{item.quantity}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default InventoryDetails;

import React, { useEffect, useState } from 'react';



const InventoryList = () => {
    const [inventories, setInventories] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const res = await fetch(`${apiUrl}/api/inventories`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setInventories(data);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error('Network error:', err.message);
      }
    };

    if (user?.token) {
      fetchInventories();
    }
  }, []);
    return (
        <div>
            <h2>Inventory List</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th><th>Desc</th><th>SKU</th><th>Quantity</th><th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventories.map(item => (
                            <tr key={item._id}>
                                <td>{item.name}</td>
                                <td>{item.description}</td>
                                <td>{item.sku}</td>
                                <td>{item.quantity}</td>
                                <td>{item.rate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
export default InventoryList;