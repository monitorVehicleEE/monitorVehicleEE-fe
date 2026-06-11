import api from "./api";
export const authApi = {
  sendOtp(data) {
    return api.post("/auth/send-otp", data);
  },
  register(data) {
    return api.post("/auth/register", data);
  },
  confirmRegister(data){
    return api.post("/auth/confirm-register", data);
  },
  login(data) {
    return api.post("/auth/login", data);
  },
};
