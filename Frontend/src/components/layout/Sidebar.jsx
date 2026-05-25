import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Monitor,
  CalendarClock,
  AlertTriangle,
  Users,
  BarChart3,
  LogOut,
  CircuitBoard,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { authApi } from "../../services/authService";
import toast from "react-hot-toast";

const NAV = [
  {
    to: "/",
    label: "Tổng quan",
    icon: LayoutDashboard,
    roles: ["customer", "lab_staff", "system_admin"],
  },
  {
    to: "/lab-rooms",
    label: "Phòng lab",
    icon: Building2,
    roles: ["customer", "lab_staff", "system_admin"],
  },
  {
    to: "/workstations",
    label: "Máy trạm",
    icon: Monitor,
    roles: ["customer", "lab_staff", "system_admin"],
  },
  {
    to: "/reservations/my",
    label: "Đặt chỗ của tôi",
    icon: CalendarClock,
    roles: ["customer", "lab_staff", "system_admin"],
  },
  {
    to: "/reservations/queue",
    label: "Hàng chờ duyệt",
    icon: AlertTriangle,
    roles: ["lab_staff", "system_admin"],
  },
  {
    to: "/incidents",
    label: "Sự cố",
    icon: AlertTriangle,
    roles: ["customer", "lab_staff", "system_admin"],
  },
  { to: "/users", label: "Người dùng", icon: Users, roles: ["system_admin"] },
  {
    to: "/reports",
    label: "Báo cáo",
    icon: BarChart3,
    roles: ["system_admin"],
  },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const items = NAV.filter((item) => item.roles.includes(user?.role));

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    } finally {
      clear();
      toast.success("Đã đăng xuất");
      navigate("/login");
    }
  };

  const navContent = (
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onMobileClose}
          className={({ isActive }) =>
            clsx("nav-link", isActive && "nav-link-active")
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const userInitial = (user?.fullName || user?.username || "?")[0].toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-slate-200 flex flex-col",
          "transform transition-transform duration-200 ease-out lg:transform-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand-600 text-white flex items-center justify-center">
              <CircuitBoard size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">
                CLMS
              </div>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {navContent}

        {/* Footer */}
        <div className="border-t border-slate-100 p-2 space-y-0.5">
          <NavLink
            to="/profile"
            onClick={onMobileClose}
            className="nav-link"
          >
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 font-medium flex items-center justify-center text-xs">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {user?.fullName || user?.username}
              </div>
            </div>
          </NavLink>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="w-full nav-link text-slate-500 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
    >
      <Menu size={20} />
    </button>
  );
}
