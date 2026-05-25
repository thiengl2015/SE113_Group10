import { useState } from "react";
import { KeyRound, UserCog } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../components/layout/Topbar";
import { StatusBadge } from "../components/ui/Badge";
import { useAuthStore } from "../store/authStore";
import { authApi, userApi } from "../services/authService";
import { apiMessage } from "../lib/api";
import { normalizeUser } from "../lib/auth";
import { fmtDateTime } from "../lib/utils";

export default function ProfilePage() {
  const { user, setUser, clear } = useAuthStore();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const onSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userApi.updateMe({
        fullName: profile.fullName,
        phone: profile.phone,
      });
      setUser(normalizeUser(updated));
      toast.success("Đã cập nhật hồ sơ");
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }
    setSavingPw(true);
    try {
      await authApi.changePassword(pw.currentPassword, pw.newPassword);
      toast.success("Đổi mật khẩu thành công, vui lòng đăng nhập lại");
      clear();
      window.location.href = "/login";
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const userInitial = (user?.fullName || user?.username || "?")[0].toUpperCase();

  return (
    <>
      <Topbar title="Hồ sơ cá nhân" subtitle="Cập nhật thông tin và bảo mật" />

      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Identity card */}
          <div className="card card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-700 font-semibold flex items-center justify-center text-lg">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-medium text-slate-900 truncate">
                  {user?.fullName || user?.username}
                </div>
                <div className="text-sm text-slate-500 truncate">{user?.email}</div>
                <div className="mt-1.5 flex gap-1.5 flex-wrap">
                  <StatusBadge status={user?.role} />
                  <StatusBadge status={user?.status} />
                </div>
              </div>
            </div>

            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Tên đăng nhập</dt>
                <dd className="font-medium text-slate-900">{user?.username}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Số điện thoại</dt>
                <dd className="font-medium text-slate-900">{user?.phone || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tham gia</dt>
                <dd className="font-medium text-slate-900">{fmtDateTime(user?.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Edit forms */}
          <div className="lg:col-span-2 space-y-4">
            <form className="card" onSubmit={onSaveProfile}>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <UserCog size={16} className="text-brand-600" />
                  <h3 className="font-medium text-slate-900 text-sm">Thông tin cá nhân</h3>
                </div>
              </div>
              <div className="card-body space-y-3">
                <div className="form-group">
                  <label className="label">Họ và tên</label>
                  <input
                    className="input"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Số điện thoại</label>
                  <input
                    className="input"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="card-footer flex justify-end">
                <button disabled={savingProfile} className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>

            <form className="card" onSubmit={onChangePw}>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-brand-600" />
                  <h3 className="font-medium text-slate-900 text-sm">Đổi mật khẩu</h3>
                </div>
              </div>
              <div className="card-body space-y-3">
                <div className="form-group">
                  <label className="label">Mật khẩu hiện tại</label>
                  <input
                    className="input"
                    type="password"
                    value={pw.currentPassword}
                    onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Mật khẩu mới</label>
                    <input
                      className="input"
                      type="password"
                      value={pw.newPassword}
                      onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Xác nhận mật khẩu</label>
                    <input
                      className="input"
                      type="password"
                      value={pw.confirm}
                      onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="card-footer flex justify-end">
                <button disabled={savingPw} className="btn btn-primary">
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
