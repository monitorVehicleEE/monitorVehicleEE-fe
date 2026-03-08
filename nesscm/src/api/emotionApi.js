import httpClient from "./httpClient";

export const emotionApi = {
    getTodayEmotion(){
        return httpClient.get("api/emotions/today");
    },

    createEmotion(data) {
        return httpClient.post("/api/emotions", data);
    },
    
    getHistory() {
        return httpClient.get("/api/emotions/history");
    }
}