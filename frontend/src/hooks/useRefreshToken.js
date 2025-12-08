import { api } from '@/api/api';
import { useDispatch } from 'react-redux'

const useRefreshToken = () => {
    const dispatch = useDispatch();
    const refreshToken = async () => {
        try {
            const response = await api.get('/user/refresh-token')
            return true
        } catch (error) {
            console.error("refreshToken :: error :: ", error)
            return null
        }
    }
    return refreshToken;
}

export { useRefreshToken };