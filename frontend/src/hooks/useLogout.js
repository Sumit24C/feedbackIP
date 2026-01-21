import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout as storeLogout } from '../store/authSlice'
import { api } from '@/api/api'
function useLogout() {
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const logout = async () => {
        setLoading(true)
        try {
            const res = await api.post('/users/logout')
            dispatch(storeLogout())
            navigate('/login')
            return true
        } catch (error) {
            // console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return { loading, logout }
}

export { useLogout };
