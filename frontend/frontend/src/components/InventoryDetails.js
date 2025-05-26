import { useInventoryContext } from "../hooks/useInventoryContext";
import { useAuthContext } from "../hooks/useAuthContext";
// date fns
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
const InventoryDetails = ({ inventory }) => {
    const { dispatch } = useInventoryContext();
    const { user } = useAuthContext();

    const handleClick = async () => {
        if (!user) {
            return;
        }
        
        const response = await fetch('/api/inventory/' + inventory._id, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        const json = await response.json();

        if (response.ok) {
            dispatch({ type: 'DELETE_INVENTORY', payload: json });
        }
    }
    return (
        <div className="inventory-details">
            <h4>{inventory.name}</h4>
            <p><strong>Quantity:</strong> {inventory.quantity}</p>
            <p>{formatDistanceToNow(new Date(inventory.createdAt), { addSuffix: true})}</p>
            <span className="material-symbols-outlined" onClick={handleClick}>delete</span>
            
        </div>
    )
}
export default InventoryDetails;
