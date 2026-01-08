import httpClient from "./httpClient";
export const authApi = {
  register(data) {
    return httpClient.post("/api/auth/register", data);
  },
  login(data) {
    return httpClient.post("/api/auth/login", data);
  },
};
