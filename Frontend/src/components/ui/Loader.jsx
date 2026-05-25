import { Loader2 } from "lucide-react";
import clsx from "clsx";

export default function Loader({ label = "Đang tải...", className }) {
  return (
    <div className={clsx("flex items-center justify-center py-12 text-slate-500 gap-2", className)}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      className={clsx("animate-pulse bg-slate-200 rounded", className)}
    />
  );
}

export function EmptyState({
  title = "Chưa có dữ liệu",
  description,
  icon: Icon,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Icon size={22} />
        </div>
      )}
      <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
