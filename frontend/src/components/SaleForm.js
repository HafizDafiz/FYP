import React, { useEffect, useState } from "react";

const SaleForm = () => {
  const [inventory, setInventory] = useState([]);
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const fetchInventory = async () => {
      const user = JSON.parse(localStorage.getItem('user'));

      try {
        const res = await fetch('http://localhost:4000/api/inventories', {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        setInventory(data);
      } catch (err) {
        alert("Failed to fetch inventory: " + err.message);
      }
    };

    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          inventoryId: selected,
          quantitySold: Number(quantity)
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Sale failed");
      alert("✅ Sale successfully recorded!");
      setQuantity(0);
      setSelected('');
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Sale</h2>

      <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
        <option value="">Select item</option>
        {inventory.map(item => (
          <option key={item._id} value={item._id}>{item.name}</option>
        ))}
      </select><br />

      <input
        type="number"
        min="1"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      /><br />

      <button type="submit">Sell</button>
    </form>
  );
};

export default SaleForm;
