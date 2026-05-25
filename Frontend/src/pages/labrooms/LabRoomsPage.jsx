import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Search, Filter, Users, MapPin, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Loader, { EmptyState } from "../../components/ui/Loader";
import Modal from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/Badge";
import { labRoomApi } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { apiMessage } from "../../lib/api";

const STATUSES = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "decommissioned", label: "Đã ngừng" },
];

export default function LabRoomsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "system_admin";

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    minCapacity: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.minCapacity && { minCapacity: filters.minCapacity }),
        ...(filters.date &&
          filters.startTime &&
          filters.endTime && {
            date: filters.date,
            startTime: filters.startTime,
            endTime: filters.endTime,
          }),
      };
      const data = await labRoomApi.list(params);
      setRooms(data || []);
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmitFilter = (e) => {
    e.preventDefault();
    load();
  };

  const onDelete = async (room) => {
    if (!confirm(`Xóa phòng ${room.room_code}?`)) return;
    try {
      await labRoomApi.remove(room.id);
      toast.success("Đã xóa phòng");
      load();
    } catch (err) {
      toast.error(apiMessage(err));
    }
  };

  return (
    <>
      <Topbar
        title="Phòng lab"
        subtitle="Tìm và đặt phòng theo khung giờ phù hợp"
        actions={
          isAdmin ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setEditing({ isNew: true })}
            >
              <Plus size={14} /> Thêm phòng
            </button>
          ) : null
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters */}
        <form onSubmit={onSubmitFilter} className="filter-bar">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-8"
                placeholder="Tìm theo mã phòng, tên, vị trí..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <select
            className="input w-auto min-w-[150px]"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            className="input w-auto min-w-[140px]"
            type="number"
            min={1}
            placeholder="Sức chứa tối thiểu"
            value={filters.minCapacity}
            onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
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
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Không tìm thấy phòng phù hợp"
            description="Thử nới lỏng bộ lọc hoặc kiểm tra khung giờ khác."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r) => (
              <div key={r.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500 font-medium">{r.room_code}</div>
                      <Link
                        to={`/lab-rooms/${r.id}`}
                        className="text-base font-medium text-slate-900 hover:text-brand-600"
                      >
                        {r.name}
                      </Link>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate text-xs">{r.location || "Chưa có vị trí"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-xs">{r.workstation_count}/{r.capacity} máy đăng ký</span>
                    </div>
                  </div>

                  {r.description && (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">{r.description}</p>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/lab-rooms/${r.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Xem chi tiết →
                  </Link>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-sm p-1.5"
                        onClick={() => setEditing({ isNew: false, ...r })}
                        title="Chỉnh sửa"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm p-1.5 hover:text-red-600"
                        onClick={() => onDelete(r)}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <LabRoomFormModal
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

function LabRoomFormModal({ initial, onClose, onSaved }) {
  const isNew = initial.isNew;
  const [form, setForm] = useState({
    roomCode: initial.room_code || "",
    name: initial.name || "",
    location: initial.location || "",
    capacity: initial.capacity || 30,
    description: initial.description || "",
    status: initial.status || "active",
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await labRoomApi.create({
          roomCode: form.roomCode,
          name: form.name,
          location: form.location,
          capacity: parseInt(form.capacity, 10),
          description: form.description,
        });
        toast.success("Đã tạo phòng mới");
      } else {
        await labRoomApi.update(initial.id, {
          name: form.name,
          location: form.location,
          capacity: parseInt(form.capacity, 10),
          description: form.description,
          status: form.status,
        });
        toast.success("Đã cập nhật phòng");
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
      title={isNew ? "Thêm phòng lab" : `Chỉnh sửa ${initial.room_code}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {isNew && (
          <div className="form-group">
            <label className="label">Mã phòng *</label>
            <input
              className="input"
              required
              value={form.roomCode}
              onChange={(e) => setForm({ ...form, roomCode: e.target.value })}
              placeholder="LAB-A101"
            />
          </div>
        )}
        <div className="form-group">
          <label className="label">Tên phòng *</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label">Vị trí</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Tòa A, tầng 1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Sức chứa *</label>
            <input
              className="input"
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          {!isNew && (
            <div className="form-group">
              <label className="label">Trạng thái</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="decommissioned">Ngừng sử dụng</option>
              </select>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="label">Mô tả</label>
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
