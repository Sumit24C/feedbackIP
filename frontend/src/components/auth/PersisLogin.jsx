import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAxiosPrivate } from '@/hooks/useAxiosPrivate'
import { useRefreshToken } from '@/hooks/useRefreshToken'
import { login, logout } from "@/store/authSlice.js"
import { Outlet } from 'react-router-dom'
function PersistLogin() {
    const axiosPrivate = useAxiosPrivate()
    const refresh = useRefreshToken()
    const [isLoading, setIsLoading] = useState(true)
    const { userData } = useSelector((state) => state.auth)
    const dispatch = useDispatch()

    useEffect(() => {
        const verify = async () => {
            try {
                await refresh()
                const res = await axiosPrivate.get('/user/current-user')
                dispatch(login(res.data.data))
                console.log("user: ", res.data.data)
                return res.data.data
            } catch (error) {
                dispatch(logout());
                console.error(error)
                return false
            } finally {
                setIsLoading(false)
            }
        }

        (async () => {
            if (!userData) {
                await verify()
            } else {
                setIsLoading(false)
            }
        })()
    }, [userData])

    return (
        <>
            {isLoading ? (<div className="flex flex-col justify-center items-center gap-4 mt-32">
                <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />
            </div>) : <Outlet />}
        </>
    )
}

export default PersistLogin