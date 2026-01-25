import React, { useState } from "react";
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

      const token = res.data.token;
      const msg =  "Đăng nhập thành công";

      localStorage.setItem("access_token", token);
      setMessage(msg);
      // TODO: điều hướng, vd: navigate("/dashboard");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError(
          "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu.",
      );
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
