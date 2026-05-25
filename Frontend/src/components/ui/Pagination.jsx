import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 20)));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600 border-t border-slate-100">
      <div>
        Trang <span className="font-medium text-slate-900">{page}</span> / {totalPages} · {total} bản ghi
      </div>
      <div className="flex gap-1">
        <button
          className="btn btn-ghost p-1.5"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          className="btn btn-ghost p-1.5"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
