import { useEffect } from "react";
import { api } from "../api/api.js";
import { useRefreshToken } from "./useRefreshToken.js";
const useAxiosPrivate = () => {
    const refresh = useRefreshToken()
    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config
                if ((error?.response?.status === 403 || error?.response?.status === 401) && !prevRequest.sent) {
                    try {
                        prevRequest.sent = true
                        const refreshed = await refresh()
                        if (refreshed) {
                            return api(prevRequest)
                        }
                    } catch (refreshError) {
                        return Promise.reject(refreshError)
                    }
                }
                return Promise.reject(error)
            }
        )

        return () => {
            api.interceptors.response.eject(responseInterceptor)
        }

    }, [refresh])

    return api
}

export { useAxiosPrivate }