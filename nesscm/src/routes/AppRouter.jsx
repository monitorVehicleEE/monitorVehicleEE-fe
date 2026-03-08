import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";

function ProtectedRoute({ children }){
  const token = localStorage.getItem("access_token");
  if (!token){
    return <Navigate to="/login" replace />;
  }
  return children
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
      {/*home page*/}
        <Route
          path="/"
          element={
            localStorage.getItem("access_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        {/* Protected route */}
         <Route path="/dashboard" element={<ProtectedRoute> <HomePage /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}
