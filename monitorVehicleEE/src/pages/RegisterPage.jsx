import React, { useState } from "react";
import { authApi } from "../api/authApi";
import { Form, Button, Modal } from "react-bootstrap";
import RegisterForm from "../components/RegisterForm";
import OtpModal from "../components/OtpModal";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
    const [form, setForm] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    const [otp, setOtp] = useState("");
    const [showOtpForm, setShowOtpForm] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({
            ...form, // copy data from form
            [e.target.name]: e.target.value, // overrite current input field  
            // without ...form, data only have e.target.value. eg: a = [a,a@mail,b] -> input email -> [email]
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
           otp: otp,
         });
         setMessage(res.data.message || "Đăng ký thành công");
         setShowOtpForm(false);
         setTimeout(() => {
           navigate("/login", { replace: true });
         }, 500);
       } catch (err) {
         setError(
           err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn"
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