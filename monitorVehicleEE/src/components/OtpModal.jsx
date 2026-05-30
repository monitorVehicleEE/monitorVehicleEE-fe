function OtpModal({
  show,
  email,
  otp,
  error,
  onClose,
  onChangeOtp,
  onConfirm,
}) {
  if (!show) return null;

  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="auth-modal-header">
          <h2 id="otp-modal-title">Nhập mã OTP</h2>
          <button
            type="button"
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </header>

        <div className="auth-modal-body">
          <p className="auth-modal-text">
            OTP đã gửi tới email <b>{email}</b>
          </p>
          <input
            className="auth-otp-input"
            type="text"
            value={otp}
            onChange={(e) => onChangeOtp(e.target.value)}
            placeholder="Nhập OTP 6 số"
          />
          {error && <div className="auth-error-text">{error}</div>}
        </div>

        <footer className="auth-modal-footer">
          <button type="button" className="auth-secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="auth-primary" onClick={onConfirm}>
            Xác nhận
          </button>
        </footer>
      </section>
    </div>
  );
}

export default OtpModal;
