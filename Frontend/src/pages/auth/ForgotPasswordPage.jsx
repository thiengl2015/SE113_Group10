import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "./AuthLayout";
import { authApi } from "../../services/authService";
import { apiMessage } from "../../lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      toast.success("Nếu email tồn tại, mã OTP đã được gửi");
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận mã OTP đặt lại mật khẩu"
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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          disabled={loading}
          className="btn-primary w-full py-2.5"
          type="submit"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Gửi mã OTP
        </button>
      </form>
    </AuthLayout>
  );
}
