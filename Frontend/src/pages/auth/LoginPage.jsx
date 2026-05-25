import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import { authApi } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { apiMessage } from "../../lib/api";
import { normalizeUser } from "../../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(identifier.trim(), password);
      setSession({
        accessToken: data.accessToken,
        user: normalizeUser(data.user),
      });
      toast.success("Đăng nhập thành công");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, "Đăng nhập thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Đăng nhập với tài khoản CLMS của bạn"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-brand-600 font-medium hover:underline"
          >
            Đăng ký
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="label">Email hoặc tên đăng nhập</label>
          <input
            className="input"
            placeholder="admin hoặc admin@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="label mb-0">Mật khẩu</label>
            <Link
              to="/forgot-password"
              className="text-xs text-brand-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPw ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Đăng nhập
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-6 p-3 border border-slate-200 rounded-lg bg-slate-50">
        <div className="text-xs font-medium text-slate-600 mb-2">Tài khoản demo</div>
        <div className="space-y-1 text-xs text-slate-500">
          <div><code className="text-slate-700">admin</code> / <code className="text-slate-700">Admin@1234</code> — Quản trị</div>
          <div><code className="text-slate-700">staff1</code> / <code className="text-slate-700">Test@1234</code> — Nhân viên</div>
          <div><code className="text-slate-700">student1</code> / <code className="text-slate-700">Test@1234</code> — Người dùng</div>
        </div>
      </div>
    </AuthLayout>
  );
}
