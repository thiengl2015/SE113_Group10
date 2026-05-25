import { CircuitBoard } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel - decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 flex-col justify-center px-12 xl:px-20">
        <div className="max-w-sm">
          {/* Brand mark */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <CircuitBoard size={20} />
            </div>
            <div>
              <div className="font-semibold text-lg text-slate-900 leading-tight">
                CLMS
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                Computer Lab Management System
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold text-slate-900 leading-tight">
            Quản lý phòng lab thông minh
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Đặt phòng, quản lý máy trạm và theo dõi sự cố trong một nền tảng duy nhất.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-3">
            {[
              "Đặt phòng và máy trạm nhanh chóng",
              "Theo dõi tình trạng thiết bị",
              "Báo cáo sự cố trực tiếp",
              "Quản lý và phê duyệt yêu cầu",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <CircuitBoard size={18} />
            </div>
            <span className="font-semibold text-lg text-slate-900">CLMS</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-6 text-sm text-slate-500 text-center">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
