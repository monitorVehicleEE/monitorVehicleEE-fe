import Lottie from "lottie-react";
import loaderCat from "../assets/Loader cat.json";

function Loading() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#f8f9fa",
      }}
    >
      <Lottie animationData={loaderCat} loop={true} style={{ width: 200 }} />
      <p>Đang tải dữ liệu...</p>
    </div>
  );
}

export default Loading;
