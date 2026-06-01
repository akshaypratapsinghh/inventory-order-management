import { AlertTriangle, DollarSign, PackageCheck, ShoppingCart, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { customerApi } from "../api/customers";
import { getApiError } from "../api/client";
import { orderApi } from "../api/orders";
import { productApi } from "../api/products";
import DataTable from "../components/DataTable.jsx";
import Panel from "../components/Panel.jsx";
import { useToast } from "../components/Toast.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function Dashboard() {
  const { notify } = useToast();
  const [state, setState] = useState({ products: [], customers: [], orders: [], lowStock: [] });

  useEffect(() => {
    Promise.all([productApi.list(), customerApi.list(), orderApi.list(), productApi.list({ low_stock: true })])
      .then(([products, customers, orders, lowStock]) => {
        setState({ products, customers, orders, lowStock });
      })
      .catch((error) => notify(getApiError(error), "error"));
  }, [notify]);

  const revenue = state.orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

  return (
    <div className="pageStack">
      <header className="pageHeader">
        <h1>Inventory & Order Management</h1>
        <p>Operational view for catalog health, customers, and confirmed order flow.</p>
      </header>

      <section className="metrics">
        <Metric icon={PackageCheck} label="Products" value={state.products.length} />
        <Metric icon={Users} label="Customers" value={state.customers.length} />
        <Metric icon={ShoppingCart} label="Orders" value={state.orders.length} />
        <Metric icon={DollarSign} label="Revenue" value={money.format(revenue)} />
        <Metric icon={AlertTriangle} label="Low stock" value={state.lowStock.length} tone="warn" />
      </section>

      <Panel title="Low Stock Products">
        <DataTable
          rows={state.lowStock}
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Name" },
            { key: "quantity_in_stock", label: "Stock" },
            { key: "price", label: "Price", render: (row) => money.format(Number(row.price)) },
          ]}
        />
      </Panel>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className={`metric ${tone || ""}`}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
