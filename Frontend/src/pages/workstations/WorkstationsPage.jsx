import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Monitor, Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Loader, { EmptyState } from "../../components/ui/Loader";
import Modal from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/Badge";
import { workstationApi, labRoomApi } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { apiMessage } from "../../lib/api";

const STATES = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "available", label: "Sẵn sàng" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "reserved", label: "Đã giữ chỗ" },
];

export default function WorkstationsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "system_admin";

  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    labRoomId: "",
    state: "",
    minRam: "",
    cpu: "",
    os: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, roomList] = await Promise.all([
        workstationApi.list(buildParams(filters)),
        rooms.length === 0 ? labRoomApi.list({}) : Promise.resolve(rooms),
      ]);
      setItems(list || []);
      if (rooms.length === 0) setRooms(roomList || []);
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (ws) => {
    if (!confirm(`Xóa máy ${ws.station_code}?`)) return;
    try {
      await workstationApi.remove(ws.id);
      toast.success("Đã xóa máy");
      load();
    } catch (err) {
      toast.error(apiMessage(err));
    }
  };

  return (
    <>
      <Topbar
        title="Máy trạm"
        subtitle="Tìm và đặt máy theo cấu hình hoặc khung giờ"
        actions={
          isAdmin ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setEditing({ isNew: true })}
            >
              <Plus size={14} /> Thêm máy
            </button>
          ) : null
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="filter-bar">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-8"
                placeholder="Mã máy hoặc IP..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <select
            className="input w-auto min-w-[150px]"
            value={filters.labRoomId}
            onChange={(e) => setFilters({ ...filters, labRoomId: e.target.value })}
          >
            <option value="">Tất cả phòng</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_code}
              </option>
            ))}
          </select>
          <select
            className="input w-auto min-w-[130px]"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          >
            {STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            className="input w-auto min-w-[130px]"
            type="number"
            min={1}
            placeholder="RAM (GB)"
            value={filters.minRam}
            onChange={(e) => setFilters({ ...filters, minRam: e.target.value })}
          />
          <input
            className="input w-auto min-w-[120px]"
            placeholder="CPU"
            value={filters.cpu}
            onChange={(e) => setFilters({ ...filters, cpu: e.target.value })}
          />
          <input
            className="input w-auto min-w-[120px]"
            placeholder="Hệ điều hành"
            value={filters.os}
            onChange={(e) => setFilters({ ...filters, os: e.target.value })}
          />
          <input
            className="input w-auto"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          <input
            className="input w-auto"
            type="time"
            value={filters.startTime}
            onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
          />
          <input
            className="input w-auto"
            type="time"
            value={filters.endTime}
            onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={14} /> Lọc
          </button>
        </form>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="Không tìm thấy máy phù hợp"
            description="Hãy thử bộ lọc khác hoặc khung giờ khác."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã máy / Phòng</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>OS</th>
                    <th>IP</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link
                          to={`/workstations/${w.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {w.station_code}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {w.lab_room?.room_code}
                        </div>
                      </td>
                      <td className="text-xs text-slate-600">{w.cpu || "—"}</td>
                      <td className="text-xs text-slate-600">{w.ram_gb ? `${w.ram_gb} GB` : "—"}</td>
                      <td className="text-xs text-slate-600">{w.os || "—"}</td>
                      <td className="text-xs font-mono text-slate-500">{w.ip_address || "—"}</td>
                      <td><StatusBadge status={w.state} /></td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/workstations/${w.id}`} className="btn btn-ghost btn-sm text-xs">
                            Chi tiết
                          </Link>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm p-1.5"
                                onClick={() => setEditing({ isNew: false, ...w })}
                                title="Chỉnh sửa"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm p-1.5 hover:text-red-600"
                                onClick={() => onDelete(w)}
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <WorkstationFormModal
          rooms={rooms}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function buildParams(f) {
  return {
    ...(f.search && { search: f.search }),
    ...(f.labRoomId && { labRoomId: f.labRoomId }),
    ...(f.state && { state: f.state }),
    ...(f.minRam && { minRam: f.minRam }),
    ...(f.cpu && { cpu: f.cpu }),
    ...(f.os && { os: f.os }),
    ...(f.date && f.startTime && f.endTime && {
      date: f.date,
      startTime: f.startTime,
      endTime: f.endTime,
    }),
  };
}

function WorkstationFormModal({ rooms, initial, onClose, onSaved }) {
  const isNew = initial.isNew;
  const [form, setForm] = useState({
    labRoomId: initial.lab_room?.id || rooms[0]?.id || "",
    stationCode: initial.station_code || "",
    ipAddress: initial.ip_address || "",
    macAddress: initial.mac_address || "",
    cpu: initial.cpu || "",
    ramGb: initial.ram_gb || 8,
    gpu: initial.gpu || "",
    os: initial.os || "",
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await workstationApi.create({
          labRoomId: parseInt(form.labRoomId, 10),
          stationCode: form.stationCode,
          ipAddress: form.ipAddress,
          macAddress: form.macAddress,
          cpu: form.cpu,
          ramGb: parseInt(form.ramGb, 10),
          gpu: form.gpu,
          os: form.os,
        });
        toast.success("Đã thêm máy mới");
      } else {
        await workstationApi.update(initial.id, {
          stationCode: form.stationCode,
          ipAddress: form.ipAddress,
          macAddress: form.macAddress,
          cpu: form.cpu,
          ramGb: parseInt(form.ramGb, 10),
          gpu: form.gpu,
          os: form.os,
        });
        toast.success("Đã cập nhật máy");
      }
      onSaved();
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Thêm máy trạm" : `Chỉnh sửa ${initial.station_code}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {isNew && (
          <div className="form-group">
            <label className="label">Phòng *</label>
            <select
              className="input"
              required
              value={form.labRoomId}
              onChange={(e) => setForm({ ...form, labRoomId: e.target.value })}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.room_code} — {r.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Mã máy *</label>
            <input className="input" required value={form.stationCode}
              onChange={(e) => setForm({ ...form, stationCode: e.target.value })}
              placeholder="PC-01" />
          </div>
          <div className="form-group">
            <label className="label">RAM (GB)</label>
            <input type="number" min={0} className="input" value={form.ramGb}
              onChange={(e) => setForm({ ...form, ramGb: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="label">CPU</label>
          <input className="input" value={form.cpu}
            onChange={(e) => setForm({ ...form, cpu: e.target.value })}
            placeholder="Intel i7-12700" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">GPU</label>
            <input className="input" value={form.gpu}
              onChange={(e) => setForm({ ...form, gpu: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">OS</label>
            <input className="input" value={form.os}
              onChange={(e) => setForm({ ...form, os: e.target.value })}
              placeholder="Windows 11" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">IP</label>
            <input className="input" value={form.ipAddress}
              onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
              placeholder="192.168.1.10" />
          </div>
          <div className="form-group">
            <label className="label">MAC</label>
            <input className="input" value={form.macAddress}
              onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
              placeholder="AA:BB:CC:11:22:33" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
