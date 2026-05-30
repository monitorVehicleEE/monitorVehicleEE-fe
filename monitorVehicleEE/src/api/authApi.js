import httpClient from "./httpClient";
export const authApi = {
  sendOtp(data) {
    return httpClient.post("/auth/send-otp", data);
  },
  register(data) {
    return httpClient.post("/auth/register", data);
  },
  confirmRegister(data){
    return httpClient.post("/auth/confirm-register", data);
  },
  login(data) {
    return httpClient.post("/auth/login", data);
  },
};
