import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Loader, { EmptyState } from "../../components/ui/Loader";
import Pagination from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/Badge";
import { reservationApi } from "../../services/authService";
import { apiMessage } from "../../lib/api";
import { fmtDateTime } from "../../lib/utils";

const STATUS_TABS = [
  { key: "", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Từ chối" },
  { key: "cancelled", label: "Đã hủy" },
  { key: "completed", label: "Hoàn tất" },
];

export default function MyReservationsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await reservationApi.myReservations({
        ...(statusFilter && { status: statusFilter }),
        page,
        pageSize: 20,
      });
      setItems(res.data || []);
      setMeta(res.metadata || { total: 0, page: 1, pageSize: 20 });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, page]);

  const onCancel = async (r) => {
    if (!confirm("Hủy yêu cầu đặt chỗ này?")) return;
    try {
      await reservationApi.cancel(r.id);
      toast.success("Đã hủy");
      load();
    } catch (err) {
      toast.error(apiMessage(err));
    }
  };

  return (
    <>
      <Topbar
        title="Đặt chỗ của tôi"
        subtitle="Theo dõi các yêu cầu đặt phòng và máy"
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Status tabs */}
        <div className="tab-list">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setPage(1);
              }}
              className={`tab-item ${statusFilter === t.key ? "tab-item-active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <Loader />
          ) : items.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Chưa có đặt chỗ nào"
              description="Hãy duyệt phòng lab hoặc máy trạm và gửi yêu cầu đặt mới."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tài nguyên</th>
                    <th>Khung giờ</th>
                    <th>Mục đích</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="font-medium text-slate-900 text-sm">
                          {r.resource_type === "lab_room"
                            ? `Phòng ${r.lab_room?.room_code || "—"}`
                            : `Máy ${r.workstation?.station_code || "—"}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.resource_type === "lab_room"
                            ? r.lab_room?.name
                            : r.workstation?.lab_room?.room_code}
                        </div>
                      </td>
                      <td className="text-sm">
                        <div className="text-slate-700">{fmtDateTime(r.start_time)}</div>
                        <div className="text-xs text-slate-500">→ {fmtDateTime(r.end_time)}</div>
                      </td>
                      <td className="max-w-xs">
                        <div className="text-sm text-slate-700 line-clamp-2">
                          {r.purpose || "—"}
                        </div>
                        {r.reject_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            Lý do từ chối: {r.reject_reason}
                          </div>
                        )}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-right">
                        {r.status === "pending" && (
                          <button
                            className="btn btn-ghost btn-sm text-xs hover:text-red-600"
                            onClick={() => onCancel(r)}
                          >
                            <X size={13} /> Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={meta.page}
            pageSize={meta.pageSize}
            total={meta.total}
            onChange={setPage}
          />
        </div>
      </div>
    </>
  );
}
