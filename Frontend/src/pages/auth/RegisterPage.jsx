import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import { authApi } from "../../services/authService";
import { apiMessage } from "../../lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Đăng ký thành công, kiểm tra email để lấy mã OTP");
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
    } catch (err) {
      toast.error(apiMessage(err, "Đăng ký thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Đăng ký để sử dụng hệ thống"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-brand-600 font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Tên đăng nhập</label>
          <input
            className="input"
            placeholder="vd: nguyenvana"
            value={form.username}
            onChange={onChange("username")}
            required
            minLength={3}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange("email")}
            required
          />
        </div>
        <div>
          <label className="label">Mật khẩu</label>
          <input
            className="input"
            type="password"
            placeholder="Ít nhất 8 ký tự"
            value={form.password}
            onChange={onChange("password")}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="label">Xác nhận mật khẩu</label>
          <input
            className="input"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={form.confirm}
            onChange={onChange("confirm")}
            required
          />
        </div>

        <button
          disabled={loading}
          className="btn-primary w-full py-2.5"
          type="submit"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Tạo tài khoản
        </button>
      </form>
    </AuthLayout>
  );
}
