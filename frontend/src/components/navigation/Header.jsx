import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { extractErrorMsg } from "@/utils/extractErrorMsg.js";
import { api } from "@/api/api";
import { User, Mail, LogOut, Settings } from "lucide-react";

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

function Header() {
  const { userData } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItemsByRole = {
    admin: [
      { path: "/admin/create-department", name: "Create Dept" },
      { path: "/admin/department", name: "Departments" },
    ],
    faculty: [
      { path: "/faculty/all-forms", name: "All Forms" },
      { path: "/faculty/create-form", name: "Create Form" },
      { path: "/faculty/questions", name: "Questions" },
      { path: "/faculty/create-question-template", name: "Add Questions" },
    ],
    student: [{ path: "/student/forms", name: "Feedback Form" }],
  };

  const navLogo = {
    student: "student/forms",
    faculty: "faculty/all-forms",
    admin: "admin/department",
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
    <header
      className="
        w-full fixed top-0 left-0 z-50
        bg-white/85 backdrop-blur-lg
        shadow-[0_8px_24px_rgba(30,64,175,0.12)]
        border-b border-blue-200/50
        px-6 py-3 flex items-center justify-between
        transition-colors duration-300
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="
            w-11 h-11 rounded-2xl
            bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center
            text-white text-lg font-bold
            shadow-[0_0_14px_rgba(59,130,246,0.55)]
            animate-[pulse_3s_ease-in-out_infinite]
          "
        >
          FB
        </div>

        <Link
          to={`/${navLogo[userData?.role]}`}
          className="
            text-xl font-black tracking-wide
            bg-gradient-to-r from-blue-600 to-indigo-600
            text-transparent bg-clip-text
          "
        >
          Feedback Portal
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <NavigationMenu>
          <NavigationMenuList className="flex gap-2">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `
                      px-4 py-2 rounded-lg font-medium text-sm md:text-base
                      transition-all duration-300
                      ${isActive
                      ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-300/50"
                      : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                    }
                    `
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
              <div
                className="
                  w-10 h-10 rounded-full cursor-pointer
                  bg-gradient-to-br from-blue-500 to-indigo-600
                  flex items-center justify-center text-white font-semibold select-none
                  shadow-[0_0_10px_rgba(59,130,246,0.6)]
                  hover:scale-105 transition-all
                "
              >
                {userData?.email?.[0]?.toUpperCase() || "U"}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 p-1">
              <DropdownMenuItem className="text-sm text-gray-700 font-medium">
                {userData?.email}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {userData?.role !== "admin" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={`/${userData?.role}/profile`} className="w-full">
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="w-full">
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}


              <DropdownMenuItem
                className="text-red-600 cursor-pointer font-semibold"
                onSelect={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                {loading ? "Signing out..." : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

export default Header;
