import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { logout } from "@/store/authSlice.js"

function AuthLayout({ authenticated = false }) {

    const { status, userData } = useSelector((state) => state.auth)
    const dispatch = useDispatch()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (authenticated && !status) {
            dispatch(logout())
            navigate('/login', { state: { from: location.pathname }, replace: true })
        } else if (authenticated && status) {
            if (userData?.role === "admin" && location.pathname === "/") {
                navigate("/admin/department", { replace: true })
            }
            if (userData?.role === "faculty" && location.pathname === "/") {
                navigate(`/faculty/all-forms`, { replace: true })
            }
            if (userData?.role === "student" && location.pathname === "/") {
                navigate(`/student/forms`, { replace: true })
            }
        } else if (!authenticated && status) {
            navigate("/", { replace: true })
        }
    }, [status, authenticated])

    return (
        <>
            <Outlet />
        </>
    )
}

export default AuthLayout