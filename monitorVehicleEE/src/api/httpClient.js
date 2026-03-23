import axios from "axios";

const httpClient = axios.create({
  baseURL: "http://localhost:8080",
});

httpClient.interceptors.request.use((config) =>{
    const token = localStorage.getItem("access_token");
    console.log("TOKEN:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
})

export default httpClient