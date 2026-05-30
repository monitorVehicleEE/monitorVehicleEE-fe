import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../api/authApi";
import OtpModal from "../components/OtpModal";
import RegisterForm from "../components/RegisterForm";

function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setMessage(res.data.message || "Đã gửi OTP tới email");
      setShowOtpForm(true);
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    setError("");
    setMessage("");

    if (!otp) {
      setError("Vui lòng nhập OTP");
      return;
    }

    try {
      const res = await authApi.confirmRegister({
        username: form.username,
        email: form.email,
        password: form.password,
        otp,
      });
      setMessage(res.data.message || "Đăng ký thành công");
      setShowOtpForm(false);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 500);
    } catch (err) {
      setError(
        err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn",
      );
    }
  };

  return (
    <>
      <RegisterForm
        form={form}
        loading={loading}
        message={message}
        error={error}
        onChange={handleChange}
        onSubmit={handleRegister}
      />

      <OtpModal
        show={showOtpForm}
        email={form.email}
        otp={otp}
        error={error}
        onClose={() => setShowOtpForm(false)}
        onChangeOtp={setOtp}
        onConfirm={handleConfirmOtp}
      />
    </>
  );
}

export default RegisterPage;
