import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  CalendarCheck,
  LayoutDashboard,
  PlusSquare,
  BarChart3,
} from "lucide-react";
import { useSelector } from "react-redux";

function MobileBottomNav() {
  const { userData } = useSelector((state) => state.auth);

  const navItemsByRole = {
    student: [
      {
        path: "/student/forms",
        label: "Forms",
        icon: ClipboardList,
      },
      {
        path: "/student/attendance",
        label: "Attendance",
        icon: CalendarCheck,
      },
    ],
    faculty: [
      {
        path: "/faculty/all-forms",
        label: "Forms",
        icon: ClipboardList,
      },
      {
        path: "/faculty/create-form",
        label: "Create",
        icon: PlusSquare,
      },
      {
        path: "/faculty/weekly-feedback",
        label: "Weekly",
        icon: BarChart3,
      },
      {
        path: "/faculty/view-attendance",
        label: "Attendance",
        icon: CalendarCheck,
      },
    ],
    admin: [
      {
        path: "/admin/department",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  };

  const items = navItemsByRole[userData?.role] || [];

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 backdrop-blur
        border-t border-gray-200
        sm:hidden
      "
    >
      <div className="flex justify-around items-center h-14">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `
              flex flex-col items-center justify-center
              text-[11px] font-medium
              transition-colors
              ${isActive
                ? "text-blue-700"
                : "text-gray-500"
              }
              `
            }
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
