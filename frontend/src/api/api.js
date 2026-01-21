import axios from "axios";
import { BASE_URL } from "@/constants";

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export const refreshApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const prevRequest = error.config;

        if (
            error.response?.status === 401 &&
            !prevRequest._retry
        ) {
            prevRequest._retry = true;

            try {
                await refreshApi.get("/user/refresh-token");
                return api(prevRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
