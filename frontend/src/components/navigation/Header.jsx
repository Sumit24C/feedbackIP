import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { extractErrorMsg } from "@/utils/extractErrorMsg.js";
import { api } from "@/api/api";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
} from "@/components/ui/navigation-menu";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

function Header() {
    const { userData } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const navItemsByRole = {
        admin: [
            { path: "/admin/create-department", name: "Create Department" },
            { path: "/admin/department", name: "Departments" },
        ],
        faculty: [
            { path: "/faculty/all-forms", name: "All Forms" },
            { path: "/faculty/create-form", name: "Create Form" },
            { path: "/faculty/questions", name: "Questions" },
            { path: "/faculty/create-question-template", name: "Create Questions" },
        ],
        student: [
            { path: "/student/forms", name: "Feedback Form" },
        ],
    };

    const navItems = navItemsByRole[userData?.role] || [];

    const handleLogout = async () => {
        setLoading(true);
        try {
            await api.post("/user/logout", {});
            dispatch(logout());
            navigate("/login");
        } catch (error) {
            console.error("Logout Error:", extractErrorMsg(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <header className="w-full bg-blue-600 text-white px-6 py-1 flex items-center justify-between shadow-md fixed top-0 left-0 z-50 h-[42px]">

            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-white/20 text-white font-bold flex items-center justify-center text-xs">
                    FB
                </div>
                <Link to="/" className="text-lg font-semibold tracking-wide">
                    FeedBack
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
                <NavigationMenu>
                    <NavigationMenuList className="flex gap-2">
                        {navItems.map((item) => (
                            <NavigationMenuItem key={item.name}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `px-3 py-1 rounded text-sm font-medium transition 
                                        ${isActive ? "bg-white text-blue-600" : "hover:bg-white/20"}`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Avatar Dropdown */}
                {userData && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold bg-white text-blue-600 hover:bg-gray-100"
                            >
                                {userData?.email[0].toUpperCase() || 'U'}
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-40">
                            <DropdownMenuItem className="text-sm text-gray-700">
                                {userData?.email || "unknown"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                                <Link to={`/${userData?.role}/profile`} className="w-full">
                                    Profile
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to="/settings" className="w-full">
                                    Settings
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    handleLogout();
                                }}
                            >
                                {loading ? <span className="flex items-center gap-2">
                                    <span className="animate-spin border-t-2 border-blue-600 rounded-full w-3 h-3"></span>
                                    Signing out...
                                </span> : "Sign out"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}

export default Header;
