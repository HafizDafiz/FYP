import { useEffect } from 'react';
import { useInventoryContext } from '../hooks/useInventoryContext';
import { useAuthContext } from '../hooks/useAuthContext';

//components
import InventoryDetails from '../components/InventoryDetails';
import InventoryForm from '../components/InventoryForm';
const Home = () => {
    const { inventories, dispatch } = useInventoryContext();
    const { user } = useAuthContext();

    useEffect(() => {
        const fetchInventory = async () => {
        const response = await fetch('/api/inventory', {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      const json = await response.json()
            if (response.ok) {
                dispatch({ type: 'SET_INVENTORIES', payload: json });
            }
        }
        if (user) {
        fetchInventory()
        }
    }, [dispatch, user]);
  return (
    <div className="home">
        <div className="inventory">
            {inventories && inventories.map((inventory) => (
                <InventoryDetails key={inventory._id} inventory={inventory} />
            ))}
        </div>
        <InventoryForm />
    </div>
  );
}

export default Home;