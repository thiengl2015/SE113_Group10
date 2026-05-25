import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import { authApi } from "../../services/authService";
import { apiMessage } from "../../lib/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: params.get("email") || "",
    otp: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }
    setLoading(true);
    try {
      await authApi.resetPassword(
        form.email.trim(),
        form.otp.trim(),
        form.password,
      );
      toast.success("Đặt lại mật khẩu thành công, đăng nhập lại nhé");
      navigate("/login");
    } catch (err) {
      toast.error(apiMessage(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã OTP và mật khẩu mới"
      footer={
        <Link
          to="/login"
          className="text-brand-600 font-medium hover:underline"
        >
          Quay lại đăng nhập
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </div>
        <div>
          <label className="label">Mã OTP</label>
          <input
            className="input tracking-[0.4em] text-center text-lg font-semibold"
            placeholder="------"
            value={form.otp}
            onChange={(e) =>
              setForm({ ...form, otp: e.target.value.replace(/\D/g, "") })
            }
            maxLength={6}
            required
          />
        </div>
        <div>
          <label className="label">Mật khẩu mới</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="label">Xác nhận mật khẩu</label>
          <input
            className="input"
            type="password"
            value={form.confirm}
            onChange={update("confirm")}
            required
          />
        </div>
        <button
          disabled={loading}
          className="btn-primary w-full py-2.5"
          type="submit"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Đặt lại mật khẩu
        </button>
      </form>
    </AuthLayout>
  );
}
