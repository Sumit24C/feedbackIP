import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/api";
import EntityFormModal from "@/components/EntityFormModal";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function FacultySubjectTab() {
    const { dept_id } = useOutletContext();

    const [facultySubjects, setFacultySubjects] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const isEditing = (id) => editingId === id;

    const [meta, setMeta] = useState(null);
    const [metaLoading, setMetaLoading] = useState(false);

    const [facultyFilter, setFacultyFilter] = useState("");

    const fetchFacultySubjects = async () => {
        try {
            const res = await api.get(
                `/admin/faculty-subjects/${dept_id}`
            );
            setFacultySubjects(res.data.data);
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFacultySubjects();
    }, [dept_id]);

    const handleCreate = async (data) => {
        setLoading(true);
        try {
            const res = await api.post(
                `/admin/faculty-subjects/${dept_id}`,
                data
            );
            toast.success(res.data.message || "FacultySubject added");
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setOpen(false);
            setLoading(false);
            fetchFacultySubjects();
        }
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append("facultysubjects", file);

        setLoading(true);
        try {
            const res = await api.post(
                `/admin/add-faculty-subjects/${dept_id}`,
                formData
            );
            toast.success(res.data.message || "FacultySubjects uploaded");
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setLoading(false);
            setOpen(false);
            fetchFacultySubjects();
        }
    };

    const handleUpdate = async (fsId) => {
        setLoading(true);
        try {
            const res = await api.patch(
                `/admin/faculty-subject/${dept_id}/${fsId}`,
                editData
            );
            toast.success(res.data.message || "FacultySubject updated");
            setEditingId(null);
            setEditData({});
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setLoading(false);
            fetchFacultySubjects();
        }
    };

    const handleOpenAdd = async (isEdit, fs) => {
        if (isEdit) {
            setEditingId(fs._id);
            setEditData({
                faculty_id: fs.faculty?._id,
                subject_id: fs.subject?._id,
                class_id: fs.class_id?._id,
                formType: fs.formType,
                batch_code: fs.batch_code,
            });
        } else {
            setOpen(true);
        }
        if (meta) return;

        setMetaLoading(true);
        try {
            const res = await api.get(
                `/admin/faculty-subjects/meta/${dept_id}`
            );
            setMeta(res.data.data);
        } catch (error) {
            toast.error(extractErrorMsg(error));
            setOpen(false);
        } finally {
            setMetaLoading(false);
        }
    };

    const facultyEmails = useMemo(() => {
        const set = new Set();
        facultySubjects.forEach((fs) => {
            if (fs.faculty?.user_id?.email) {
                set.add(fs.faculty.user_id.email);
            }
        });
        return Array.from(set);
    }, [facultySubjects]);

    const filteredFacultySubjects = useMemo(() => {
        if (!facultyFilter) return facultySubjects;
        return facultySubjects.filter(
            (fs) => fs.faculty?.user_id?.email === facultyFilter
        );
    }, [facultySubjects, facultyFilter]);

    const selectedSubject = useMemo(() => {
        if (!meta || !editData.subject_id) return null;
        return meta.subjects.find(s => s._id === editData.subject_id);
    }, [meta, editData.subject_id]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Faculty–Subject Mapping
                    </h2>
                    <p className="text-sm text-gray-500">
                        Faculty assignments for subjects and classes
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    <select
                        value={facultyFilter}
                        onChange={(e) => setFacultyFilter(e.target.value)}
                        className="border rounded px-3 py-2 text-sm w-72"
                    >
                        <option value="">All Faculties</option>
                        {facultyEmails.map((email) => (
                            <option key={email} value={email}>
                                {email}
                            </option>
                        ))}
                    </select>

                    {facultyFilter && (
                        <button
                            onClick={() => setFacultyFilter("")}
                            className="text-sm text-blue-600"
                        >
                            Clear filter
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenAdd(false, null)}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        Add Mapping
                    </button>
                </div>
            </div>

            <div className="relative border rounded-2xl shadow-sm overflow-x-auto max-h-[420px]">
                <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-gray-700">
                            <th className="p-3 text-left">Faculty</th>
                            <th className="p-3 text-left">Subject</th>
                            <th className="p-3 text-left">Subject-Type</th>
                            <th className="p-3 text-left">Class</th>
                            <th className="p-3 text-center">Form Type</th>
                            <th className="p-3 text-center">Batch</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="py-12 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredFacultySubjects.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-10 text-center text-gray-500">
                                    No faculty–subject mappings found
                                </td>
                            </tr>
                        ) : (
                            filteredFacultySubjects.map((fs, index) => (
                                <tr
                                    key={fs._id}
                                    className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-blue-50`}
                                >
                                    <td className="p-3">
                                        {isEditing(fs._id) ? (
                                            <select
                                                value={editData.faculty_id || ""}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        faculty_id: e.target.value,
                                                    })
                                                }
                                                className="w-full border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="">Select Faculty</option>
                                                {meta?.faculties.map((f) => (
                                                    <option key={f._id} value={f._id}>
                                                        {f?.email}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            fs.faculty?.user_id?.email || "—"
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing(fs._id) ? (
                                            <select
                                                value={editData.subject_id || ""}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        subject_id: e.target.value,
                                                    })
                                                }
                                                className="w-full border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="">Select Subject</option>
                                                {meta?.subjects.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            fs.subject?.name || "—"
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {isEditing(fs._id) && selectedSubject
                                            ? selectedSubject.type
                                            : fs.subject?.type || "—"}
                                    </td>
                                    <td className="p-3">
                                        {isEditing(fs._id) ? (
                                            <select
                                                disabled={selectedSubject?.type === "elective"}
                                                value={editData.class_id || ""}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        class_id: e.target.value,
                                                    })
                                                }
                                                className={`w-full border rounded px-2 py-1 text-sm
                                                                ${selectedSubject?.type === "elective"
                                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                        : "bg-white"
                                                    }`}
                                            >
                                                <option value="">Select Class</option>

                                                {meta?.classes
                                                    ?.filter(c =>
                                                        selectedSubject?.type !== "elective" &&
                                                        c.year === selectedSubject?.year
                                                    )
                                                    .map((c) => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.year} - {c.name}
                                                        </option>
                                                    ))}
                                            </select>

                                        ) : (
                                            `${fs.class_id?.year || "—"} - ${fs.class_id?.name || "—"}`
                                        )}
                                    </td>
                                    < td className="p-3 text-center" >
                                        {isEditing(fs._id) ? (
                                            <select
                                                value={editData.formType}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        formType: e.target.value,
                                                    })
                                                }
                                                className="border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="theory">Theory</option>
                                                <option value="practical">Practical</option>
                                                <option value="tutorial">Tutorial</option>
                                            </select>
                                        ) : (
                                            fs.formType
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {isEditing(fs._id) ? (
                                            <input
                                                value={editData.batch_code || ""}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        batch_code: e.target.value,
                                                    })
                                                }
                                                className="border rounded px-2 py-1 text-sm w-20 text-center"
                                            />
                                        ) : (
                                            fs.batch_code || "—"
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {isEditing(fs._id) ? (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleUpdate(fs._id)}
                                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditData({});
                                                    }}
                                                    className="px-3 py-1 bg-gray-200 text-sm rounded-md"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    handleOpenAdd(true, fs);

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
                </table >
            </div >

            {open && (
                <EntityFormModal
                    entity="facultySubjects"
                    meta={meta}
                    metaLoading={metaLoading}
                    onClose={() => setOpen(false)}
                    onCreate={handleCreate}
                    onUpload={handleUpload}
                />
            )
            }
        </>
    );
}

export default FacultySubjectTab;
