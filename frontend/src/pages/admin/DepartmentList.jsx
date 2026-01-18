import { useEffect, useState, useRef } from "react";
import { api } from "@/api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MoreVertical, Eye, Trash } from "lucide-react";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function DepartmentList() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  const fetchDepartment = async () => {
    try {
      const res = await api.get(`/admin`);
      setDepartments(res.data.data);
    } catch (error) {
      toast.error(extractErrorMsg(error) || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchDepartment();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    setLoading(true);
    try {
      const res = await api.delete(`/admin/${id}`);
      await fetchDepartment();
      toast.success(res.data.message || "Department deleted");
    } catch (error) {
      toast.error(extractErrorMsg(error) || "Failed to delete");
    } finally {
      setLoading(false)
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin" />
          <p className="text-gray-700 font-semibold">Loading departments...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Departments</h2>

      <div className="bg-white rounded-xl shadow border">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Students</th>
              <th className="p-4 font-semibold">Faculties</th>
              <th className="p-4 font-semibold">Classes</th>
              <th className="p-4 font-semibold">Subjects</th>
              <th className="p-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {departments.map((dept) => (
              <tr
                key={dept._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-4">{dept.name}</td>
                <td className="p-4">{dept.studentCount}</td>
                <td className="p-4">{dept.facultyCount}</td>
                <td className="p-4">{dept.classCount}</td>
                <td className="p-4">{dept.subjectCount}</td>

                <td className="p-4 relative text-center">
                  <button
                    onClick={() =>
                      setOpenMenu((prev) => (prev === dept._id ? null : dept._id))
                    }
                    className="p-2 rounded hover:bg-gray-200 transition"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenu === dept._id && (
                    <div
                      ref={menuRef}
                      className="absolute right-4 top-10 bg-white shadow-lg border rounded-md w-36 z-20 animate-fade-in"
                    >
                      <button
                        onClick={() => navigate(`${dept._id}`)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100"
                      >
                        <Eye size={16} /> View
                      </button>

                      <button
                        onClick={() => handleDelete(dept._id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-100"
                      >
                        <Trash size={16} /> Delete
                      </button>
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default DepartmentList;
