import { Link } from "react-router-dom";
import { Lock, Mail, ShieldCheck, User, UserPlus } from "lucide-react";

function RegisterForm({ form, loading, message, error, onChange, onSubmit }) {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1>VehicleOps</h1>
            <p>Factory Gate Security</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Đăng ký</h2>
        </div>

        {message && <div className="auth-alert success">{message}</div>}
        {error && <div className="auth-alert error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-field" htmlFor="username">
            <span>Username</span>
            <div className="auth-input-wrap">
              <User className="w-5 h-5" />
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="Nhập username"
                required
              />
            </div>
          </label>

          <label className="auth-field" htmlFor="email">
            <span>Email</span>
            <div className="auth-input-wrap">
              <Mail className="w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="Nhập email"
                required
              />
            </div>
          </label>

          <label className="auth-field" htmlFor="password">
            <span>Mật khẩu</span>
            <div className="auth-input-wrap">
              <Lock className="w-5 h-5" />
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </label>

          <label className="auth-field" htmlFor="confirmPassword">
            <span>Xác nhận mật khẩu</span>
            <div className="auth-input-wrap">
              <Lock className="w-5 h-5" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : <UserPlus className="w-5 h-5" />}
            <span>{loading ? "Đang gửi OTP" : "Đăng ký"}</span>
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>
    </div>
  );
}

export default RegisterForm;
