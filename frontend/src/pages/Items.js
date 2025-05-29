import { useEffect, useState } from 'react';  
import InventoryDetails from '../components/InventoryDetails';
import { useAuthContext } from '../hooks/useAuthContext';

const Item = () => {
  const { user } = useAuthContext();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  // Optional: mock items for development/testing fallback
  const mockItems = [
    { _id: '1', name: 'Laptop', sku: 'LT123', quantity: 10, location: 'Warehouse A' },
    { _id: '2', name: 'Mouse', sku: 'MS456', quantity: 50, location: 'Warehouse B' },
    { _id: '3', name: 'Keyboard', sku: 'KB789', quantity: 30, location: 'Warehouse A' }
  ];

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setError('You must be logged in to view inventory.');
        setItems([]);
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
      }
    };

    fetchInventory();
  }, [user]);

  return (
    <main className="main-content">
      <div>
        <h2>Inventory Items</h2>
        {error && <div className="error">{error}</div>}
        <InventoryDetails items={error ? mockItems : items} />
      </div>
    </main>
  );
};

export default Item;
