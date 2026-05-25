import React, { useState } from "react";
import {
  Navbar,
  Container,
  Button,
  Offcanvas,
} from "react-bootstrap";

function DashboardNavbar({
  user,
  onLogout,
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Navbar
        expand="lg"
        className="dashboard-navbar"
        style={{
          background: "#ffffff",
          padding: "14px 20px",
        }}
      >
        <Container fluid>
          {/* FULL WIDTH FLEX */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* LEFT */}
            <Navbar.Brand
              style={{
                fontWeight: 700,
                fontSize: 24,
                color: "#111827",
                margin: 0,
              }}
            >
              MOVEE
            </Navbar.Brand>

            {/* RIGHT DESKTOP */}
            <div
              className="d-none d-lg-flex"
              style={{
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* USERNAME */}
              <div
                style={{
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                Xin chào, {user?.username}
              </div>

              {/* LOGOUT */}
              <Button variant="danger" onClick={onLogout}>
                Đăng xuất
              </Button>
            </div>

            {/* MOBILE TOGGLE */}
            <div className="d-lg-none">
              <Navbar.Toggle onClick={() => setShow(true)} />
            </div>
          </div>
        </Container>
      </Navbar>

      {/* MOBILE SIDEBAR */}
      <Offcanvas show={show} onHide={() => setShow(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          {/* USER */}
          <div
            style={{
              marginBottom: 20,
              fontWeight: 500,
            }}
          >
            Xin chào, {user?.username}
          </div>

          {/* LOGOUT */}
          <Button
            variant="danger"
            style={{
              width: "100%",
            }}
            onClick={onLogout}
          >
            Đăng xuất
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default DashboardNavbar;