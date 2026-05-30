import React from "react";
import { Link } from "react-router-dom";
import { Lock, LogIn, ShieldCheck, User } from "lucide-react";

function LoginForm({ form, loading, message, error, onChange, onSubmit }) {
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
          <h2>Đăng nhập</h2>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {message && <div className="auth-alert success">{message}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-field" htmlFor="username">
            <span>Tên đăng nhập</span>
            <div className="auth-input-wrap">
              <User className="w-5 h-5" />
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="Nhập username"
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
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : <LogIn className="w-5 h-5" />}
            <span>{loading ? "Đang đăng nhập" : "Đăng nhập"}</span>
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginForm;
