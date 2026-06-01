import { Edit2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { getApiError } from "../api/client";
import { productApi } from "../api/products";
import DataTable from "../components/DataTable.jsx";
import Panel from "../components/Panel.jsx";
import { useToast } from "../components/Toast.jsx";

const emptyForm = { sku: "", name: "", description: "", price: "", quantity_in_stock: "" };
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function Products() {
  const { notify } = useToast();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);

  const loadProducts = () => productApi.list().then(setProducts).catch((error) => notify(getApiError(error), "error"));

  useEffect(() => {
    loadProducts();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantity_in_stock: Number(form.quantity_in_stock),
      };
      if (editingProductId) {
        await productApi.update(editingProductId, payload);
      } else {
        await productApi.create(payload);
      }
      setForm(emptyForm);
      setEditingProductId(null);
      notify(editingProductId ? "Product updated." : "Product created.");
      loadProducts();
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  function startEdit(product) {
    setEditingProductId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
    });
  }

  function resetForm() {
    setEditingProductId(null);
    setForm(emptyForm);
  }

  async function remove(id) {
    try {
      await productApi.remove(id);
      notify("Product removed.");
      loadProducts();
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  return (
    <div className="pageStack">
      <header className="pageHeader">
        <h1>Products</h1>
        <p>Maintain SKU, pricing, and available inventory.</p>
      </header>

      <Panel
        title={editingProductId ? "Edit Product" : "New Product"}
        action={
          editingProductId && (
            <button type="button" className="secondaryButton" onClick={resetForm}>
              <RotateCcw size={17} />
              <span>Reset</span>
            </button>
          )
        }
      >
        <form className="gridForm" onSubmit={submit}>
          <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input required min="0" step="0.01" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input required min="0" type="number" placeholder="Stock" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} />
          <button type="submit" className="primaryButton">
            {editingProductId ? <Save size={18} /> : <Plus size={18} />}
            <span>{editingProductId ? "Save" : "Add"}</span>
          </button>
        </form>
      </Panel>

      <Panel title="Catalog">
        <DataTable
          rows={products}
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Name" },
            { key: "quantity_in_stock", label: "Stock" },
            { key: "price", label: "Price", render: (row) => money.format(Number(row.price)) },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <div className="rowActions">
                  <button className="iconButton" type="button" onClick={() => startEdit(row)} title="Edit product">
                    <Edit2 size={17} />
                  </button>
                  <button className="iconButton danger" type="button" onClick={() => remove(row.id)} title="Delete product">
                    <Trash2 size={17} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
