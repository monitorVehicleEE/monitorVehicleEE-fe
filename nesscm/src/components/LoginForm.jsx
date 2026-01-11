import { Form, Button } from "react-bootstrap";

function LoginForm({ form, loading, message, error, onChange, onSubmit }) {
  return (
    <Form
      onSubmit={onSubmit}
      className="p-4 border rounded"
      style={{ maxWidth: 400, margin: "0 auto" }}
    >
      <h3 className="mb-3 text-center">Đăng nhập</h3>

      <Form.Group className="mb-3" controlId="loginEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Nhập email"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="loginPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="Nhập mật khẩu"
          required
        />
      </Form.Group>

      <div className="d-grid">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </div>

      {message && <div className="text-success mt-2">{message}</div>}
      {error && <div className="text-danger mt-2">{error}</div>}
    </Form>
  );
}

export default LoginForm;
