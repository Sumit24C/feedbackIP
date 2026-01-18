import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/api";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import EntityFormModal from "@/components/EntityFormModal";

function FacultyTab() {
  const { dept_id } = useOutletContext();

  const [faculties, setFaculties] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const isEditing = (id) => editingId === id;

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/faculties/${dept_id}`);
      setFaculties(res.data.data);
    } catch (error) {
      toast.error(extractErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, [dept_id]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("faculties", file);
    try {
      await api.post(`/admin/add-faculties/${dept_id}`, formData);
      toast.success("Faculties uploaded");
      setOpen(false);
      fetchFaculties();
    } catch (error) {
      toast.error(extractErrorMsg(error));
    }
  };

  const handleCreate = async (data) => {
    setLoading(true);
    try {
      const res = await api.post(
        `/admin/faculties/${dept_id}`,
        {
          ...data
        }
      );
      toast.success(res.data.message || "successfully added faculty");
    } catch (error) {
      console.error(extractErrorMsg(error));
      toast.error(extractErrorMsg(error));
    } finally {
      setOpen(false);
      setLoading(false)
      fetchFaculties();
    }
  }

  const handleUpdate = async (facultyId) => {
    setLoading(true);
    try {
      const res = await api.patch(
        `/admin/faculty/${dept_id}/${facultyId}`,
        { ...editData }
      );
      toast.success(res.data.message || "Faculty updated");
      setEditingId(null);
      setEditData({});
      fetchFaculties();
    } catch (error) {
      toast.error(extractErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Faculties</h2>
          <p className="text-sm text-gray-500">
            List of faculty members in this department
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Add Faculties
        </button>
      </div>
      <div className="relative border rounded-2xl shadow-sm overflow-x-auto max-h-[420px]">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="text-gray-700">
              <th className="p-3 font-semibold text-left">Name</th>
              <th className="p-3 font-semibold text-left">Email</th>
              <th className="p-3 font-semibold text-left">Designation</th>
              <th className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">
                      Loading faculties...
                    </p>
                  </div>
                </td>
              </tr>
            ) : faculties.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-10 text-center text-gray-500">
                  No faculties found
                </td>
              </tr>
            ) : (
              faculties.map((f, index) => (
                <tr
                  key={f._id}
                  className={`
                    border-b transition
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    hover:bg-blue-50
                  `}
                >
                  <td className="p-3">
                    {isEditing(f._id) ? (
                      <input
                        value={editData.fullname}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            fullname: e.target.value,
                          })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      f.user_id?.fullname || "—"
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing(f._id) ? (
                      <input
                        value={editData.email}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            email: e.target.value,
                          })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {f.user_id?.email || "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing(f._id) ? (
                      <select
                        value={editData.designation}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            designation: e.target.value
                          })
                        }
                        className="border rounded px-2 py-1 text-sm text-center bg-white"
                      >
                        {[
                          "Assistant Professor",
                          "Associate Professor",
                          "Professor",
                          "HOD",
                          "Lecturer",
                          "Visiting Faculty"
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-600">
                        {f.designation || "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(f._id) ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleUpdate(f._id)}
                          className="px-3 py-1 text-sm rounded-md bg-green-600 text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditData({});
                          }}
                          className="px-3 py-1 text-sm rounded-md bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(f._id);
                          setEditData({
                            fullname: f.user_id?.fullname || "",
                            email: f.user_id?.email || "",
                            designation: f.designation || ""
                          });
                        }}
                        className="px-3 py-1 rounded-md text-sm font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <EntityFormModal
          entity="faculty"
          onClose={() => {
            setOpen(false);
            setEditData({});
          }}
          onCreate={handleCreate}
          onUpload={handleUpload}
        />
      )}
    </>
  );
}

export default FacultyTab;
