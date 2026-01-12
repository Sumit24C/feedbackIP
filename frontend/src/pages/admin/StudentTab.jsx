import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import EntityFormModal from "@/components/EntityFormModal";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function StudentTab() {
  const { dept_id } = useOutletContext();
  const axiosPrivate = useAxiosPrivate();
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const isEditing = (id) => editingId === id;
  const fetchStudents = async () => {
    try {
      const res = await axiosPrivate.get(`/admin/students/${dept_id}`);
      setStudents(res.data.data);
    } catch (error) {
      console.error(`student :: error :: ${extractErrorMsg(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [dept_id]);

  const handleCreate = async (data) => {
    if (data.roll_no < 1 || data.roll_no > 100) {
      toast.error("rollno must be valid");
      return;
    }
    if (!["A", "B", "C", "D"].includes(data.class_name)) {
      toast.error("class_name must be valid");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosPrivate.post(
        `/admin/students/${dept_id}`,
        {
          ...data
        }
      );
      toast.success(res.data.message || "successfully added student");
    } catch (error) {
      console.error(extractErrorMsg(error));
      toast.error(extractErrorMsg(error));
    } finally {
      setOpen(false);
      setLoading(false)
      fetchStudents();
    }
  }

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("students", file);
    setLoading(true);
    try {
      const res = await axiosPrivate.post(`/admin/add-students/${dept_id}`, formData);
      toast.success(res.data.message || "Students uploaded");
    } catch (error) {
      console.error(extractErrorMsg(error));
      toast.error(extractErrorMsg(error));
    } finally {
      setLoading(false)
    }
    setOpen(false);
    fetchStudents();
  };

  const handleUpdate = async (sId) => {
    if (editData.roll_no < 1 || editData.roll_no > 100) {
      toast.error("rollno must be valid");
      return;
    }
    if (!["A", "B", "C", "D"].includes(editData.class_name)) {
      toast.error("class_name must be valid");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosPrivate.patch(
        `/admin/student/${dept_id}/${sId}`,
        {
          ...editData
        }
      );
      toast.success(res.data.message || "successfully updated student");
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error(extractErrorMsg(error));
      toast.error(extractErrorMsg(error));
    } finally {
      setLoading(false)
      fetchStudents();
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Students
          </h2>
          <p className="text-sm text-gray-500">
            List of enrolled students in this department
          </p>
        </div>

        <button
          onClick={() => {
            setOpen(true);
            setUploadMode(false);
          }}
          className="
              inline-flex items-center gap-2
              px-4 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-semibold
              hover:bg-blue-700 transition
            "
        >
          Add Students
        </button>

      </div>

      <div
        className="
    relative
    border rounded-2xl shadow-sm
    overflow-x-auto
    max-h-[420px]
  "
      >
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="text-gray-700">
              <th className="p-3 font-semibold text-left">Roll No</th>
              <th className="p-3 font-semibold text-left">Name</th>
              <th className="p-3 font-semibold text-left">Email</th>
              <th className="p-3 font-semibold text-center">Section</th>
              <th className="p-3 font-semibold text-center">Year</th>
              <th className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">
                      Loading students...
                    </p>
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((s, index) => (
                <tr
                  key={s._id}
                  className={`
                    border-b transition
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    hover:bg-blue-50`}
                >
                  <td className="p-3">
                    {isEditing(s._id) ? (
                      <input
                        value={editData.roll_no}
                        type="number"
                        min={1}
                        max={100}
                        onChange={(e) =>
                          setEditData({ ...editData, roll_no: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="font-medium">{s.roll_no || "—"}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing(s._id) ? (
                      <input
                        value={editData.fullname}
                        onChange={(e) =>
                          setEditData({ ...editData, fullname: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      s.user_id?.fullname || "—"
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing(s._id) ? (
                      <input
                        value={editData.email}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {s.user_id?.email || "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(s._id) ? (
                      <input
                        value={editData.class_name}
                        onChange={(e) =>
                          setEditData({ ...editData, class_name: e.target.value })
                        }
                        className="w-20 border rounded px-2 py-1 text-sm text-center"
                      />
                    ) : (
                      s.class_id?.name || "—"
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(s._id) ? (
                      <input
                        value={editData.academic_year}
                        onChange={(e) =>
                          setEditData({ ...editData, academic_year: e.target.value })
                        }
                        className="w-20 border rounded px-2 py-1 text-sm text-center"
                      />
                    ) : (
                      s.academic_year || "—"
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(s._id) ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleUpdate(s._id)}
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
                          setEditingId(s._id);
                          setEditData({
                            roll_no: s.roll_no,
                            fullname: s.user_id?.fullname || "",
                            email: s.user_id?.email || "",
                            class_name: s.class_id?.name,
                            academic_year: s.academic_year,
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
          entity="student"
          onClose={() => {
            setOpen(false);
            setEditData({});
          }}
          onCreate={handleCreate}
          onUpload={handleUpload}
        />
      )}

    </>
  )

}

export default StudentTab;
