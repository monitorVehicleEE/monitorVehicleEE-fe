import Lottie from "lottie-react";
import rippleLoader from "../assets/Ripple loading animation.json";

function LoadingCamera() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Lottie animationData={rippleLoader} loop={true} style={{ width: 120 }} />
      
    </div>
  );
}

export default LoadingCamera;
