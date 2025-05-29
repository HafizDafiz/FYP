import InventoryDetails from '../components/InventoryDetails';

const Item = () => {
  const mockItems = [
    { _id: '1', name: 'Laptop', sku: 'LT123', quantity: 10, location: 'Warehouse A' },
    { _id: '2', name: 'Mouse', sku: 'MS456', quantity: 50, location: 'Warehouse B' },
    { _id: '3', name: 'Keyboard', sku: 'KB789', quantity: 30, location: 'Warehouse A' }
  ];

  return (
    <main className="main-content">
        <div>
        <h2>Inventory Items</h2>
        <InventoryDetails items={mockItems} />
        </div>
    </main>
  );
};

export default Item;
