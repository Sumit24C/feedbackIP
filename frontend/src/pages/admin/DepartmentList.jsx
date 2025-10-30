import { useEffect, useState, useRef } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Trash } from "lucide-react";

function DepartmentList() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosPrivate.get("/admin");
        setDepartments(res.data.data);
      } catch (err) {
        toast.error("Failed to load departments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  console.log(departments)

  // ✅ Close menu on outside click
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

    try {
      await axiosPrivate.delete(`/admin/${id}`);
      setDepartments((prev) => prev.filter((d) => d._id !== id));
      toast.success("Department deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div className="p-6 text-lg font-medium">Loading departments...</div>;

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
