import React from "react";
import { useNavigate } from "react-router-dom";

import Dashboard from "../components/layout/Dashboard";

function HomePage() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");

  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default HomePage;
