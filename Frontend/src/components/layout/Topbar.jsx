import { useAuthStore } from "../../store/authStore";
import { StatusBadge } from "../ui/Badge";
import { MobileMenuButton } from "./Sidebar";

export default function Topbar({ title, subtitle, actions }) {
  const { user } = useAuthStore();
  return (
    <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 lg:gap-0">
        <div className="lg:hidden">
          <MobileMenuButton />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {user && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-500">
              Xin chào,{" "}
              <span className="font-medium text-slate-700">
                {user.fullName || user.username}
              </span>
            </span>
            <StatusBadge status={user.role} />
          </div>
        )}
      </div>
    </div>
  );
}
