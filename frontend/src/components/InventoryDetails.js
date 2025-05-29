
const InventoryDetails = ({ items }) => {
  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>SKU</th>
          <th>Type</th>
          <th>Description</th>
          <th>Rate</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item._id}>
            <td>{item.name}</td>
            <td>{item.sku}</td>
            <td>{item.type}</td>
            <td>{item.description}</td>
            <td>${item.rate?.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryDetails;
