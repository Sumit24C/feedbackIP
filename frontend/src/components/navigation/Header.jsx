import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { extractErrorMsg } from "@/utils/extractErrorMsg.js";
import { api } from "@/api/api";
import { User, LogOut, Settings, Loader2 } from "lucide-react";
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
      { path: "/admin/faculty-subject", name: "Faculty-Subject" },
    ],
    faculty: [
      { path: "/faculty/all-forms", name: "All Forms" },
      { path: "/faculty/create-form", name: "Create Form" },
      { path: "/faculty/view-attendance", name: "Attendance" },
    ],
    student: [
      { path: "/student/forms", name: "Feedback Form" },
      { path: "/student/attendance", name: "Attendance" }
    ],
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
        shadow-2xs
        border-b border-blue-200/50
        px-6 py-3 flex items-center justify-between
        transition-colors duration-300
      "
    >
      <div className="flex items-center gap-3 justify-between">
        <div
          className="
            w-11 h-11 rounded-2xl
            bg-gradient-to-br bg-blue-700
            flex items-center justify-center
            text-white text-lg font-bold sm:hidden
          "
        >
          C
        </div>

        <Link
          to={`/${navLogo[userData?.role]}`}
          className="
            sm:text-xl font-black tracking-wide
            bg-gradient-to-r bg-blue-700
            text-transparent bg-clip-text hidden sm:block
          "
        >
          ClassSetu
        </Link>
      </div>

      <div className="sm:flex items-center gap-4">
        <NavigationMenu className="hidden sm:block">
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

        {userData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="
                  w-10 h-10 rounded-full cursor-pointer bg-blue-700
                  flex items-center justify-center text-white font-semibold select-none
                  hover:scale-105 transition-all
                "
              >
                {userData?.email?.[0]?.toUpperCase() || "U"}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-40 sm:w-44 mx-2 text-xm truncate">
              <DropdownMenuItem className="text-xs text-gray-700 font-medium">
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
                className="text-red-600 font-semibold focus:bg-red-50 dark:focus:bg-red-900 cursor-pointer gap-2 flex items-center"
                onSelect={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging out...
                  </span>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

export default Header;
