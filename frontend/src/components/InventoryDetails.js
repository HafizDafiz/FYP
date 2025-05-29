const InventoryDetails = ({ items }) => {
  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>SKU</th>
          <th>Quantity</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item._id}>
            <td>{item.name}</td>
            <td>{item.sku}</td>
            <td>{item.quantity}</td>
            <td>{item.location}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryDetails;
