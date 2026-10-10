import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const NAV = {
  admin: [{ to: "/admin", label: "Dashboard", end: true }],
  teacher: [{ to: "/teacher", label: "Dashboard", end: true }],
  parent: [{ to: "/parent", label: "Dashboard", end: true }],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r p-4 hidden md:block">
        <div className="text-xl font-bold mb-6">Aponiq</div>
        <nav className="space-y-1">
          {NAV[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="font-semibold md:hidden">Aponiq</div>
          <div className="text-sm text-gray-600 ml-auto flex items-center gap-4">
            <span>
              {user.name} <span className="text-gray-400">({user.role})</span>
            </span>
            <button onClick={handleLogout} className="text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}