import React from "react";
import { Link } from "react-router-dom";
import { Form, Button, Alert, Spinner } from "react-bootstrap";

function LoginForm({ form, loading, message, error, onChange, onSubmit }) {
  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h3 className="mb-3">Đăng nhập</h3>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Tên đăng nhập</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="Nhập username"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Mật khẩu</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Nhập mật khẩu"
            required
          />
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-100"
        >
          {loading ? <Spinner size="sm" animation="border" /> : "Đăng nhập"}
        </Button>
      </Form>

      <div style={{ marginTop: "15px", textAlign: "center" }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </div>
    </div>
  );
}

export default LoginForm;
