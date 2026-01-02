import { refreshApi } from '@/api/api';

const useRefreshToken = () => {
    const refreshToken = async () => {
        try {
            await refreshApi.get('/user/refresh-token')
            return true
        } catch (error) {
            return null
        }
    }
    return refreshToken;
}

export { useRefreshToken };