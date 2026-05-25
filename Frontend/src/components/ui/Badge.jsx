import clsx from "clsx";

const TONE = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-violet-50 text-violet-700",
  brand: "bg-brand-50 text-brand-700",
};

export default function Badge({ children, tone = "default", className }) {
  return (
    <span className={clsx("badge", TONE[tone] || TONE.default, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    pending: { tone: "yellow", label: "Chờ duyệt" },
    approved: { tone: "green", label: "Đã duyệt" },
    rejected: { tone: "red", label: "Từ chối" },
    cancelled: { tone: "default", label: "Đã hủy" },
    completed: { tone: "blue", label: "Hoàn tất" },
    active: { tone: "green", label: "Hoạt động" },
    inactive: { tone: "default", label: "Ngưng" },
    maintenance: { tone: "yellow", label: "Bảo trì" },
    available: { tone: "green", label: "Sẵn sàng" },
    in_use: { tone: "blue", label: "Đang dùng" },
    reserved: { tone: "purple", label: "Đã giữ chỗ" },
    broken: { tone: "red", label: "Hỏng" },
    open: { tone: "yellow", label: "Mở" },
    in_progress: { tone: "blue", label: "Đang xử lý" },
    resolved: { tone: "green", label: "Đã xử lý" },
    closed: { tone: "default", label: "Đã đóng" },
    blocked: { tone: "red", label: "Bị khóa" },
    verified: { tone: "green", label: "Đã xác thực" },
    customer: { tone: "default", label: "Người dùng" },
    lab_staff: { tone: "blue", label: "Nhân viên" },
    system_admin: { tone: "purple", label: "Quản trị" },
    under_review: { tone: "blue", label: "Đang xử lý" },
  };
  const item = map[status] || { tone: "default", label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
