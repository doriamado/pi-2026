import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/devices", label: "Dispositivos" },
  { to: "/sensors", label: "Sensores" },
  { to: "/automation", label: "Automação" },
  { to: "/history", label: "Histórico" },
  { to: "/alerts", label: "Alertas" },
  { to: "/settings", label: "Configurações" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
      <div className="mb-6 px-2 text-lg font-semibold text-emerald-700">
        🌱 Irrigação
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
