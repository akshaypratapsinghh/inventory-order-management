import { Eye, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getApiError } from "../api/client";
import { customerApi } from "../api/customers";
import { orderApi } from "../api/orders";
import { productApi } from "../api/products";
import DataTable from "../components/DataTable.jsx";
import Panel from "../components/Panel.jsx";
import { useToast } from "../components/Toast.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function Orders() {
  const { notify } = useToast();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);

  const loadData = () =>
    Promise.all([customerApi.list(), productApi.list(), orderApi.list()])
      .then(([customerData, productData, orderData]) => {
        setCustomers(customerData);
        setProducts(productData);
        setOrders(orderData);
      })
      .catch((error) => notify(getApiError(error), "error"));

  useEffect(() => {
    loadData();
  }, []);

  const productById = useMemo(() => new Map(products.map((product) => [String(product.id), product])), [products]);
  const draftTotal = items.reduce((sum, item) => {
    const product = productById.get(String(item.product_id));
    return sum + (product ? Number(product.price) * Number(item.quantity || 0) : 0);
  }, 0);

  function updateItem(index, patch) {
    setItems(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      await orderApi.create({
        customer_id: Number(customerId),
        items: items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })),
      });
      setCustomerId("");
      setItems([{ product_id: "", quantity: 1 }]);
      notify("Order confirmed.");
      loadData();
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  async function showDetails(orderId) {
    try {
      setSelectedOrder(await orderApi.get(orderId));
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  async function cancelOrder(orderId) {
    try {
      await orderApi.remove(orderId);
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      notify("Order cancelled and stock restored.");
      loadData();
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  return (
    <div className="pageStack">
      <header className="pageHeader">
        <h1>Orders</h1>
        <p>Create confirmed orders with backend-calculated totals and stock deduction.</p>
      </header>

      <Panel title="Place Order">
        <form className="orderForm" onSubmit={submit}>
          <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.email}
              </option>
            ))}
          </select>

          <div className="orderItems">
            {items.map((item, index) => (
              <div className="orderItem" key={index}>
                <select required value={item.product_id} onChange={(e) => updateItem(index, { product_id: e.target.value })}>
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name} ({product.quantity_in_stock} in stock)
                    </option>
                  ))}
                </select>
                <input required min="1" type="number" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} />
                <button
                  className="iconButton"
                  type="button"
                  title="Remove item"
                  onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={items.length === 1}
                >
                  <Minus size={17} />
                </button>
              </div>
            ))}
          </div>

          <div className="formActions">
            <button type="button" className="secondaryButton" onClick={() => setItems([...items, { product_id: "", quantity: 1 }])}>
              <Plus size={18} />
              <span>Item</span>
            </button>
            <strong>Draft total: {money.format(draftTotal)}</strong>
            <button type="submit" className="primaryButton">
              <ShoppingCart size={18} />
              <span>Confirm</span>
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Recent Orders">
        <DataTable
          rows={orders}
          columns={[
            { key: "id", label: "Order" },
            { key: "customer", label: "Customer", render: (row) => row.customer?.name },
            { key: "items", label: "Items", render: (row) => row.items.map((item) => `${item.product.sku} x ${item.quantity}`).join(", ") },
            { key: "total_amount", label: "Total", render: (row) => money.format(Number(row.total_amount)) },
            { key: "status", label: "Status", render: (row) => <span className="statusPill">{row.status}</span> },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <div className="rowActions">
                  <button className="iconButton" type="button" onClick={() => showDetails(row.id)} title="View order details">
                    <Eye size={17} />
                  </button>
                  <button className="iconButton danger" type="button" onClick={() => cancelOrder(row.id)} title="Cancel order">
                    <Trash2 size={17} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      {selectedOrder && (
        <Panel
          title={`Order #${selectedOrder.id}`}
          action={
            <button className="iconButton danger" type="button" onClick={() => cancelOrder(selectedOrder.id)} title="Cancel order">
              <Trash2 size={17} />
            </button>
          }
        >
          <div className="detailGrid">
            <div>
              <span>Customer</span>
              <strong>{selectedOrder.customer.name}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{selectedOrder.customer.email}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{money.format(Number(selectedOrder.total_amount))}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{selectedOrder.status}</strong>
            </div>
          </div>
          <DataTable
            rows={selectedOrder.items}
            columns={[
              { key: "product", label: "Product", render: (row) => `${row.product.sku} - ${row.product.name}` },
              { key: "quantity", label: "Quantity" },
              { key: "unit_price", label: "Unit Price", render: (row) => money.format(Number(row.unit_price)) },
              { key: "line_total", label: "Line Total", render: (row) => money.format(Number(row.unit_price) * row.quantity) },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
