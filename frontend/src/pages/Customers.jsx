import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { getApiError } from "../api/client";
import { customerApi } from "../api/customers";
import DataTable from "../components/DataTable.jsx";
import Panel from "../components/Panel.jsx";
import { useToast } from "../components/Toast.jsx";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export default function Customers() {
  const { notify } = useToast();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadCustomers = () => customerApi.list().then(setCustomers).catch((error) => notify(getApiError(error), "error"));

  useEffect(() => {
    loadCustomers();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await customerApi.create(form);
      setForm(emptyForm);
      notify("Customer created.");
      loadCustomers();
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  async function remove(id) {
    try {
      await customerApi.remove(id);
      notify("Customer removed.");
      loadCustomers();
    } catch (error) {
      notify(getApiError(error), "error");
    }
  }

  return (
    <div className="pageStack">
      <header className="pageHeader">
        <h1>Customers</h1>
        <p>Store customer contact details with unique email enforcement.</p>
      </header>

      <Panel title="New Customer">
        <form className="gridForm" onSubmit={submit}>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <button type="submit" className="primaryButton">
            <Plus size={18} />
            <span>Add</span>
          </button>
        </form>
      </Panel>

      <Panel title="Customer Directory">
        <DataTable
          rows={customers}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <button className="iconButton danger" type="button" onClick={() => remove(row.id)} title="Delete customer">
                  <Trash2 size={17} />
                </button>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
