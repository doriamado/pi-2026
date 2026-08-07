import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Sensors from "./pages/Sensors";
import Automation from "./pages/Automation";
import History from "./pages/History";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";

/**
 * Sem tela de Login na v1 (nao ha autenticacao).
 * O usuario cai direto no Dashboard.
 */
export default function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/history" element={<History />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
