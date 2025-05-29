import { useEffect, useState } from 'react';
import InventoryDetails from '../components/InventoryDetails';
import { useAuthContext } from '../hooks/useAuthContext';

const Item = () => {
  const { user } = useAuthContext();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

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
        <h1>All Items</h1>
        {error && <div className="error">{error}</div>}
        <InventoryDetails items={items} />
      </div>
    </main>
  );
};

export default Item;
