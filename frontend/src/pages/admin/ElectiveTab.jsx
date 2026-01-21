import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/api";
import EntityFormModal from "@/components/EntityFormModal";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function ElectiveTab() {
    const { dept_id } = useOutletContext();

    const [electives, setElectives] = useState([]);
    const [electiveStudents, setElectiveStudents] = useState([]);
    const [subjectFilter, setSubjectFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);

    const fetchElectives = async () => {
        try {
            const res = await api.get(`/admin/faculty-subjects/${dept_id}?type=elective`);
            setElectives(res.data.data);
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchElectives();
    }, [dept_id]);

    const fetchElectiveStudents = async (facultySubjectId) => {
        setStudentsLoading(true);
        try {
            const res = await api.get(
                `/admin/electives/${facultySubjectId}`
            );
            setElectiveStudents(res.data.data);
            setSelectedIds([]);
        } catch (error) {
            toast.error(extractErrorMsg(error));
            setElectiveStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    useEffect(() => {
        if (subjectFilter) {
            fetchElectiveStudents(subjectFilter);
        } else {
            setElectiveStudents([]);
            setSelectedIds([]);
        }
    }, [subjectFilter]);

    const subjectOptions = useMemo(() => {
        return electives.map((fs) => ({
            _id: fs._id,
            label: `${fs.subject?.name} (${fs.faculty?.user_id?.fullname})`,
        }));
    }, [electives]);

    const handleCreate = async ({ facultySubjectId, email }) => {
        try {
            const res = await api.post(
                `/admin/electives/${facultySubjectId}`,
                { email }
            );
            toast.success(res.data.message || "Student enrolled");
            setOpen(false);
            fetchElectiveStudents(facultySubjectId);
        } catch (error) {
            toast.error(extractErrorMsg(error));
        }
    };

    const handleUpload = async (facultySubjectId, file) => {
        const formData = new FormData();
        formData.append("students", file);

        try {
            const res = await api.post(
                `/admin/add-electives/${facultySubjectId}`,
                formData
            );
            const { skipped, inserted } = res.data.data;
            toast.success(`Inserted: ${inserted}, Skipped: ${skipped}`);
            setOpen(false);
            fetchElectiveStudents(facultySubjectId);
        } catch (error) {
            toast.error(extractErrorMsg(error));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`Remove ${selectedIds.length} student(s) from elective?`)) return;

        try {
            await api.delete("/admin/electives/students", {
                data: { elective_ids: selectedIds }
            });

            toast.success("Selected students removed");
            fetchElectiveStudents(subjectFilter);
        } catch (error) {
            toast.error(extractErrorMsg(error));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === electiveStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(electiveStudents.map(e => e._id));
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Elective Enrollments
                    </h2>
                    <p className="text-sm text-gray-500">
                        Manage students enrolled in elective subjects ({electiveStudents?.length || 0})
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="border rounded px-3 py-2 text-sm max-w-xs"
                    >
                        <option value="">Select Elective Subject</option>
                        {subjectOptions.map((opt) => (
                            <option key={opt._id} value={opt._id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setOpen(true)}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        Add Students
                    </button>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                        >
                            Delete Selected ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="relative border rounded-2xl shadow-sm overflow-x-auto max-h-[420px]">
                <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr className="text-gray-700">
                            <th className="p-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={
                                        electiveStudents.length > 0 &&
                                        selectedIds.length === electiveStudents.length
                                    }
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="p-3 text-left">Student Name</th>
                            <th className="p-3 text-left">Email</th>
                            <th className="p-3 text-left">Class</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading || studentsLoading ? (
                            <tr>
                                <td colSpan="4" className="py-12 text-center">
                                    Loading students...
                                </td>
                            </tr>
                        ) : !subjectFilter ? (
                            <tr>
                                <td colSpan="4" className="py-10 text-center text-gray-500">
                                    Select an elective to view students
                                </td>
                            </tr>
                        ) : electiveStudents.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-10 text-center text-gray-500">
                                    No students enrolled
                                </td>
                            </tr>
                        ) : (
                            electiveStudents.map((e, index) => (
                                <tr
                                    key={e._id}
                                    className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-blue-50`}
                                >
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(e._id)}
                                            onChange={() => toggleSelect(e._id)}
                                        />
                                    </td>
                                    <td className="p-3">
                                        {e.student?.user_id?.fullname || "—"}
                                    </td>
                                    <td className="p-3">
                                        {e.student?.user_id?.email || "—"}
                                    </td>
                                    <td className="p-3">
                                        {e.student?.class_id?.year || "—"} -{" "}
                                        {e.student?.class_id?.name || "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {open && (
                <EntityFormModal
                    entity="electives"
                    meta={electives}
                    metaLoading={loading}
                    onClose={() => setOpen(false)}
                    onCreate={handleCreate}
                    onUpload={handleUpload}
                />
            )}
        </>
    );
}

export default ElectiveTab;
