import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Loader, { EmptyState } from "../../components/ui/Loader";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import Badge, { StatusBadge } from "../../components/ui/Badge";
import {
  incidentApi,
  labRoomApi,
  workstationApi,
} from "../../services/authService";
import { apiMessage } from "../../lib/api";
import { fmtRelative } from "../../lib/utils";

const CATEGORIES = [
  { value: "", label: "Tất cả phân loại" },
  { value: "hardware", label: "Phần cứng" },
  { value: "network", label: "Mạng" },
  { value: "os", label: "Hệ điều hành" },
  { value: "software", label: "Phần mềm" },
];
const STATUSES = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "open", label: "Mở" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "closed", label: "Đã đóng" },
];
const CATEGORY_LABELS = {
  hardware: "Phần cứng",
  network: "Mạng",
  os: "Hệ điều hành",
  software: "Phần mềm",
};

export default function IncidentsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", category: "" });
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await incidentApi.list({
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
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
  }, [filters.status, filters.category, page]);

  return (
    <>
      <Topbar
        title="Sự cố"
        subtitle="Báo cáo và theo dõi sự cố"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Báo sự cố
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            className="input w-auto min-w-[160px]"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className="input w-auto min-w-[160px]"
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value });
              setPage(1);
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="card">
          {loading ? (
            <Loader />
          ) : items.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Chưa có sự cố"
              description="Khi gặp vấn đề, bấm 'Báo sự cố' phía trên."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Phân loại</th>
                    <th>Mô tả</th>
                    <th>Thiết bị</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-xs text-slate-500">{t.id}</td>
                      <td>
                        <Badge tone="default">
                          {CATEGORY_LABELS[t.category] || t.category}
                        </Badge>
                      </td>
                      <td className="max-w-[240px]">
                        <div className="text-sm text-slate-900 line-clamp-2">{t.description}</div>
                        <div className="text-xs text-slate-500">
                          {t.reporter?.full_name || t.reporter?.username}
                        </div>
                      </td>
                      <td className="text-xs text-slate-600">
                        {t.workstation?.station_code || t.lab_room?.room_code || "—"}
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="text-xs text-slate-500">{fmtRelative(t.created_at)}</td>
                      <td className="text-right">
                        <Link
                          to={`/incidents/${t.id}`}
                          className="text-sm text-brand-600 hover:underline"
                        >
                          Chi tiết
                        </Link>
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

      {creating && (
        <CreateIncidentModal
          onClose={() => setCreating(false)}
          onCreated={(ticket) => {
            setCreating(false);
            navigate(`/incidents/${ticket.id}`);
          }}
        />
      )}
    </>
  );
}

function CreateIncidentModal({ onClose, onCreated }) {
  const [rooms, setRooms] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [form, setForm] = useState({
    category: "hardware",
    description: "",
    labRoomId: "",
    workstationId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    labRoomApi.list({}).then((d) => setRooms(d || []));
    workstationApi.list({}).then((d) => setWorkstations(d || []));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ticket = await incidentApi.create({
        category: form.category,
        description: form.description,
        ...(form.workstationId && {
          workstationId: parseInt(form.workstationId, 10),
        }),
        ...(form.labRoomId && { labRoomId: parseInt(form.labRoomId, 10) }),
      });
      toast.success("Đã tạo báo cáo sự cố");
      onCreated(ticket);
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
      title="Báo sự cố mới"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" disabled={saving} onClick={onSubmit}>
            {saving ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="label">Phân loại *</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="hardware">Phần cứng</option>
            <option value="network">Mạng</option>
            <option value="os">Hệ điều hành</option>
            <option value="software">Phần mềm</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Phòng (tùy chọn)</label>
            <select
              className="input"
              value={form.labRoomId}
              onChange={(e) => setForm({ ...form, labRoomId: e.target.value })}
            >
              <option value="">— Không chọn —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.room_code} — {r.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Máy trạm (tùy chọn)</label>
            <select
              className="input"
              value={form.workstationId}
              onChange={(e) => setForm({ ...form, workstationId: e.target.value })}
            >
              <option value="">— Không chọn —</option>
              {workstations.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.station_code} ({w.lab_room?.room_code})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="label">Mô tả chi tiết *</label>
          <textarea
            className="input"
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả sự cố: hiện tượng, thời gian xảy ra, ảnh hưởng..."
          />
        </div>
      </form>
    </Modal>
  );
}
