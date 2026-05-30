import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../api/authApi";
import LoginForm from "../components/LoginForm";

function LoginPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await authApi.login({
        username: form.username,
        password: form.password,
      });

      localStorage.setItem("access_token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Đăng nhập thành công");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (err) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      form={form}
      loading={loading}
      message={message}
      error={error}
      onChange={handleChange}
      onSubmit={handleLogin}
    />
  );
}

export default LoginPage;
