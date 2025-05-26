import { useState } from 'react';
import { useInventoryContext } from '../hooks/useInventoryContext';
import { useAuthContext } from '../hooks/useAuthContext';


const InventoryForm = () => {
    const { dispatch } = useInventoryContext();
    const { user } = useAuthContext();
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState(null);
    const [emptyFields, setEmptyFields] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            setError('You must be logged in');
            return;
        }

        const inventory = { name, quantity };
        const response = await fetch('/api/inventory', {
            method: 'POST',
            body: JSON.stringify(inventory),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        })
        const json = await response.json();

        if (!response.ok) {
            setError(json.error);
            setEmptyFields(json.emptyFields);
        }
        if (response.ok) {
            setName('');
            setQuantity('');
            setError(null);
            console.log('New stock added:', json);
            dispatch({ type: 'CREATE_INVENTORY', payload: json });
        }
    }
    return (
        <form className="create" onSubmit={handleSubmit}>
            <h3>Add a New Stock</h3>
            <label>Stock Name:</label>
            <input
                type="text"
                onChange={(e) => setName(e.target.value)}
                value={name}
                className={emptyFields.includes('name') ? 'error' : ''}
            />
            <label>Quantity:</label>
            <input
                type="number"
                onChange={(e) => setQuantity(e.target.value)}
                value={quantity}
                className={emptyFields.includes('quantity') ? 'error' : ''}
            />
            <button>Add Stock</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default InventoryForm;