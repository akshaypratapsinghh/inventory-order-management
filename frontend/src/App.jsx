import { Boxes, ClipboardList, LayoutDashboard, Users } from "lucide-react";
import { useState } from "react";

import { ToastProvider } from "./components/Toast.jsx";
import Customers from "./pages/Customers.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Orders from "./pages/Orders.jsx";
import Products from "./pages/Products.jsx";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: Dashboard },
  { id: "products", label: "Products", icon: Boxes, component: Products },
  { id: "customers", label: "Customers", icon: Users, component: Customers },
  { id: "orders", label: "Orders", icon: ClipboardList, component: Orders },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const ActivePage = tabs.find((tab) => tab.id === activeTab).component;

  return (
    <ToastProvider>
      <div className="appShell">
        <aside className="sidebar">
          <div className="brand">
            <Boxes size={28} />
            <div>
              <strong>IMS</strong>
              <span>Operations</span>
            </div>
          </div>
          <nav>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="content">
          <ActivePage />
        </main>
      </div>
    </ToastProvider>
  );
}
