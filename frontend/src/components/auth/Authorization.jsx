import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom';

function Authorization({ role }) {
    const userData = useSelector((state) => state.auth.userData);
    const navigate = useNavigate();

    useEffect(() => {
        if (userData?.role !== role) {
            navigate("/unauthorized")
        }
    }, [userData])

    return (
        <div>
            <Outlet />
        </div>
    )
}

export default Authorization