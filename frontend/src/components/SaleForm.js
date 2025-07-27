import { useEffect, useState } from "react";

const SaleForm = () => {
  const [inventory, setInventory] = useState([]);
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const apiUrl = process.env.REACT_APP_API_URL;
      try {
        const res = await fetch(`${apiUrl}/api/inventories`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
        setInventory(data);
      } catch (err) {
        alert("Failed to fetch inventory: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const apiUrl = process.env.REACT_APP_API_URL;
    try {
      const res = await fetch(`${apiUrl}/api/sales`, {
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
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-form-container">
        <div className="mobile-loading">
          <div className="loading-spinner"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-form-container">
      <form onSubmit={handleSubmit} className="mobile-optimized-form">
        <h2>Create Sale</h2>

        <div className="form-group">
          <label htmlFor="item-select">Select Item</label>
          <select 
            id="item-select"
            value={selected} 
            onChange={(e) => setSelected(e.target.value)} 
            required
            className="mobile-select"
            disabled={submitting}
          >
            <option value="">Select item</option>
            {inventory.map(item => (
              <option key={item._id} value={item._id}>
                {item.name} (Available: {item.quantity})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quantity-input">Quantity</label>
          <input
            id="quantity-input"
            type="number"
            min="1"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mobile-input"
            inputMode="numeric"
            disabled={submitting}
          />
        </div>

        <button 
          type="submit" 
          className="mobile-submit-btn"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="button-spinner"></span>
              Processing Sale...
            </>
          ) : (
            'Complete Sale'
          )}
        </button>
      </form>
    </div>
  );
};

export default SaleForm;
