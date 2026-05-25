import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Monitor, CalendarClock, AlertTriangle, ArrowRight } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import Loader from "../components/ui/Loader";
import { StatusBadge } from "../components/ui/Badge";
import { useAuthStore } from "../store/authStore";
import {
  labRoomApi,
  workstationApi,
  reservationApi,
  incidentApi,
} from "../services/authService";
import { fmtDateTime } from "../lib/utils";

function StatCard({ label, value, hint, icon: Icon, colorClass = "bg-brand-50 text-brand-600" }) {
  return (
    <div className="card card-body flex items-center gap-3">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-xl font-semibold text-slate-900 leading-tight">{value}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role === "lab_staff" || user?.role === "system_admin";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const requests = [
          labRoomApi.list({}),
          workstationApi.list({}),
          reservationApi.myReservations({ pageSize: 5 }),
        ];
        if (isStaff) {
          requests.push(reservationApi.queue({ pageSize: 5 }));
          requests.push(incidentApi.list({ status: "open", pageSize: 5 }));
        }
        const results = await Promise.all(requests);
        if (cancelled) return;
        const [rooms, workstations, mine, queue, openIncidents] = results;
        setData({
          rooms,
          workstations,
          mine,
          queue,
          openIncidents,
        });
      } catch (e) {
        // toast handled by interceptor
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  if (loading || !data) {
    return (
      <>
        <Topbar title="Tổng quan" subtitle="Chào mừng quay trở lại" />
        <div className="p-6">
          <Loader />
        </div>
      </>
    );
  }

  const { rooms, workstations, mine, queue, openIncidents } = data;
  const availableWs = workstations.filter((w) => w.state === "available");
  const upcoming = (mine.data || [])
    .filter(
      (r) =>
        ["pending", "approved"].includes(r.status) &&
        new Date(r.end_time) > new Date(),
    )
    .slice(0, 5);

  return (
    <>
      <Topbar
        title={`Chào, ${user?.fullName || user?.username}`}
        subtitle="Tổng quan hệ thống phòng lab"
      />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Building2}
            label="Phòng lab"
            value={rooms.length}
            hint={`${rooms.filter((r) => r.status === "active").length} hoạt động`}
            colorClass="bg-brand-50 text-brand-600"
          />
          <StatCard
            icon={Monitor}
            label="Máy trạm"
            value={workstations.length}
            hint={`${availableWs.length} sẵn sàng`}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={CalendarClock}
            label="Đặt chỗ"
            value={mine.metadata?.total ?? mine.data?.length ?? 0}
            hint={`${upcoming.length} sắp tới`}
            colorClass="bg-slate-100 text-slate-600"
          />
          {isStaff ? (
            <StatCard
              icon={AlertTriangle}
              label="Sự cố mở"
              value={openIncidents?.metadata?.total ?? 0}
              hint={`${queue?.metadata?.total ?? 0} chờ duyệt`}
              colorClass="bg-amber-50 text-amber-600"
            />
          ) : (
            <StatCard
              icon={AlertTriangle}
              label="Sự cố"
              value="—"
              hint="Báo sự cố khi cần"
              colorClass="bg-slate-100 text-slate-400"
            />
          )}
        </div>

        {/* Quick actions */}
        <div className="card card-body">
          <div className="text-sm font-medium text-slate-700 mb-3">Thao tác nhanh</div>
          <div className="flex flex-wrap gap-2">
            <Link to="/lab-rooms" className="btn btn-secondary btn-sm">
              <Building2 size={14} /> Phòng lab
            </Link>
            <Link to="/workstations" className="btn btn-secondary btn-sm">
              <Monitor size={14} /> Máy trạm
            </Link>
            <Link to="/reservations/my" className="btn btn-secondary btn-sm">
              <CalendarClock size={14} /> Đặt chỗ của tôi
            </Link>
            {isStaff && (
              <Link to="/reservations/queue" className="btn btn-secondary btn-sm">
                <AlertTriangle size={14} /> Hàng chờ duyệt
              </Link>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Upcoming reservations */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <div>
                <h3 className="font-medium text-slate-900 text-sm">Đặt chỗ sắp tới</h3>
                <p className="text-xs text-slate-500">Lịch sử đặt gần nhất của bạn</p>
              </div>
              <Link
                to="/reservations/my"
                className="text-xs text-brand-600 hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight size={12} />
              </Link>
            </div>
            <div>
              {upcoming.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">
                  Bạn chưa có đặt chỗ nào sắp tới.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {upcoming.map((r) => (
                    <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {r.resource_type === "lab_room"
                            ? `Phòng ${r.lab_room?.room_code} — ${r.lab_room?.name}`
                            : `Máy ${r.workstation?.station_code} (${r.workstation?.lab_room?.room_code})`}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {fmtDateTime(r.start_time)} → {fmtDateTime(r.end_time)}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Lab rooms */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium text-slate-900 text-sm">Phòng đang hoạt động</h3>
              <Link
                to="/lab-rooms"
                className="text-xs text-brand-600 hover:underline"
              >
                Xem
              </Link>
            </div>
            <div>
              <ul className="divide-y divide-slate-100">
                {rooms
                  .filter((r) => r.status === "active")
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {r.room_code}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {r.name} · {r.workstation_count}/{r.capacity} máy
                        </div>
                      </div>
                      <Link
                        to={`/lab-rooms/${r.id}`}
                        className="text-xs text-brand-600 hover:underline flex-shrink-0 ml-2"
                      >
                        Chi tiết
                      </Link>
                    </li>
                  ))}
                {rooms.length === 0 && (
                  <li className="px-4 py-3 text-sm text-slate-500 text-center">
                    Chưa có phòng nào.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
