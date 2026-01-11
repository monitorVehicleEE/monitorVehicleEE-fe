import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { authApi } from "../api/authApi";

function LoginPage() {
  const [form, setForm] = useState({
    email: "",
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
        email: form.email,
        password: form.password,
      });
      setMessage(res.data.message || "Đăng nhập thành công");
      // TODO: lưu token, navigate('/dashboard') ...
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
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
