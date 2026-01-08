import React, { useState } from "react";
import { authApi } from "../api/authApi";

function RegisterPage() {
    const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form, // copy data from form
            [e.target.name]: e.target.value, // overrite current input field  
            // without ...form, data only have e.target.value. eg: a = [a,a@mail,b] -> input email -> [email]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); //Ngăn form reload trang khi submit
        setMessage('');
        setError('');
         if (form.password !== form.confirmPassword) {
           setError("The re-entered password does not match.");
           return;
         }
        setLoading(true);
        try{
            const res = await authApi.register(form);
            console.log(res);
            
            setMessage(res.data.message || 'Register success');
        // eslint-disable-next-line no-unused-vars
        } catch (err){
          console.log("ERR:", err);
          console.log("STATUS:", err.response && err.response.status);
          console.log("DATA:", err.response && err.response.data);
          if (err.response && err.response.data && err.response.data.message){
            setError(err.response.data.message);
          } else{
             setError("Register failed");
          }
           
        } finally {
            setLoading(false);
        }
    }
    return (
      <form onSubmit={handleSubmit}>
        <div>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            required
          />
        </div>
        <div>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
        </div>
        <div>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    );
}

export default RegisterPage;