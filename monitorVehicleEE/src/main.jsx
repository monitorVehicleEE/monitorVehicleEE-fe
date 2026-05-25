// import { StrictMode } from 'react'
// import React from "react";
// import ReactDOM from "react-dom/client";
// import { AppRouter } from './routes/AppRouter';
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css"

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <AppRouter />
//   </React.StrictMode>
// );

import { StrictMode } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
