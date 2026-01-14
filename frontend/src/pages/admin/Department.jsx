import { Outlet, NavLink, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";

function DepartmentLayout() {
    const { dept_id } = useParams();
    const axiosPrivate = useAxiosPrivate();
    const [dept, setDept] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepartment = async () => {
            try {
                const res = await axiosPrivate.get(`/admin/${dept_id}`);
                setDept(res.data.data);
            } catch {
                toast.error("Failed to load department");
            } finally {
                setLoading(false);
            }
        };
        fetchDepartment();
    }, [dept_id]);

    if (loading) {
        return (
            <div className="w-full h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin" />
                    <p className="text-gray-700 font-semibold">Loading department...</p>
                </div>
            </div>
        );
    }

    if (!dept) return <div>Department not found</div>;

    return (
        <div className="bg-gray-50 p-2 space-y-4">

            <div className="flex items-center justify-between gap-4 flex-wrap">

                <div className="bg-white rounded-xl shadow px-5 py-4 min-w-[220px]">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                        {dept.name}
                    </h1>
                </div>

                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {[
                        { to: "", label: "Students" },
                        { to: "classess", label: "Class" },
                        { to: "faculties", label: "Faculties" },
                        { to: "subjects", label: "Subjects" },
                        { to: "faculty-subjects", label: "Faculty-Subjects" },
                        { to: "electives", label: "Electives" },
                    ].map((tab) => (
                        <NavLink
                            key={tab.label}
                            to={tab.to}
                            end
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-lg text-sm font-semibold
                                whitespace-nowrap transition-all
                                ${isActive
                                    ? "bg-blue-600 text-white shadow"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
                <Outlet context={{ dept_id }} />
            </div>
        </div>
    );


}

export default DepartmentLayout;
