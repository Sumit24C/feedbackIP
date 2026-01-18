import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/api";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import EntityFormModal from "@/components/EntityFormModal";

function SubjectTab() {
  const { dept_id } = useOutletContext();

  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const isEditing = (id) => editingId === id;

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/subjects/${dept_id}`);
      setSubjects(res.data.data);
    } catch (error) {
      toast.error(extractErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [dept_id]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("subjects", file);
    try {
      await api.post(`/admin/add-subjects/${dept_id}`, formData);
      toast.success("Subjects uploaded");
      setOpen(false);
      fetchSubjects();
    } catch (error) {
      toast.error(extractErrorMsg(error));
    }
  };

  const handleCreate = async (data) => {
    setLoading(true);

    try {
      const res = await api.post(
        `/admin/subjects/${dept_id}`,
        {
          ...data
        }
      );
      toast.success(res.data.message || "successfully added subject");
    } catch (error) {
      console.error(extractErrorMsg(error));
      toast.error(extractErrorMsg(error));
    } finally {
      setOpen(false);
      setLoading(false)
      fetchSubjects();
    }
  }

  const handleUpdate = async (subjectId) => {
    setLoading(true);
    try {
      const res = await api.patch(
        `/admin/subject/${dept_id}/${subjectId}`,
        { ...editData }
      );
      toast.success(res.data.message || "Subject updated");
      setEditingId(null);
      setEditData({});
      fetchSubjects();
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
          <h2 className="text-xl font-semibold text-gray-800">Subjects</h2>
          <p className="text-sm text-gray-500">
            Subjects offered by this department
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Add Subjects
        </button>
      </div>
      <div className="relative border rounded-2xl shadow-sm overflow-x-auto max-h-[420px]">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="text-gray-700">
              <th className="p-3 font-semibold text-left">Name</th>
              <th className="p-3 font-semibold text-left">Code</th>
              <th className="p-3 font-semibold text-center">Year</th>
              <th className="p-3 font-semibold text-center">Type</th>
              <th className="p-3 font-semibold text-center">Semester</th>
              <th className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">
                      Loading subjects...
                    </p>
                  </div>
                </td>
              </tr>
            ) : subjects.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-500">
                  No subjects found
                </td>
              </tr>
            ) : (
              subjects.map((sub, index) => (
                <tr
                  key={sub._id}
                  className={`
                    border-b transition
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    hover:bg-blue-50
                  `}
                >
                  <td className="p-3">
                    {isEditing(sub._id) ? (
                      <input
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="font-medium">{sub.name}</span>
                    )}
                  </td>

                  <td className="p-3">
                    {isEditing(sub._id) ? (
                      <input
                        value={editData.subject_code}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            subject_code: e.target.value,
                          })
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      sub.subject_code
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(sub._id) ? (
                      <select
                        value={editData.year}
                        onChange={(e) =>
                          setEditData({ ...editData, year: e.target.value })
                        }
                        className="w-24 border rounded px-2 py-1 text-sm text-center bg-white"
                      >
                        {["FY", "SY", "TY", "BY"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      sub.year
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(sub._id) ? (
                      <select
                        value={editData.type}
                        onChange={(e) =>
                          setEditData({ ...editData, type: e.target.value })
                        }
                        className="w-24 border rounded px-2 py-1 text-sm text-center bg-white"
                      >
                        {["dept", "elective"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      sub.type
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(sub._id) ? (
                      <select
                        value={editData.semester}
                        onChange={(e) =>
                          setEditData({ ...editData, semester: e.target.value })
                        }
                        className="w-24 border rounded px-2 py-1 text-sm text-center bg-white"
                      >
                        {["odd", "even"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      sub.semester
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing(sub._id) ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleUpdate(sub._id)}
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
                          setEditingId(sub._id);
                          setEditData({
                            name: sub.name,
                            subject_code: sub.subject_code,
                            year: sub.year,
                            type: sub.type,
                            semester: sub.semester,
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
          entity="subject"
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

export default SubjectTab;
