import { Spinner } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import Loading from "../components/Loading";

function HomePage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);




  // lấy user info
  let user = JSON.parse(storedUser);
  // đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };


  useEffect(() => {
   
  }, []);

  // if (loading) {
  //   return <Loading/>;
  // }


 
  return (
    <Container style={{ marginTop: "60px" }}>
      <h2>Trang chủ</h2>
      <hr />
      <h4>Xin chào {user?.username} 👋</h4>
      <Button variant="danger" className="mt-3" onClick={handleLogout}>
        Đăng xuất
      </Button>
    </Container>
  );
}

export default HomePage;
