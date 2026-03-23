import { Modal, Button, Form } from "react-bootstrap";

function OtpModal({
  show,
  email,
  otp,
  error,
  onClose,
  onChangeOtp,
  onConfirm,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Nhập mã OTP</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          OTP đã gửi tới email <b>{email}</b>
        </p>
        <Form.Control
          type="text"
          value={otp}
          onChange={(e) => onChangeOtp(e.target.value)}
          placeholder="Nhập OTP 6 số"
        />
        {error && <div className="text-danger mt-2">{error}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Xác nhận
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default OtpModal;
