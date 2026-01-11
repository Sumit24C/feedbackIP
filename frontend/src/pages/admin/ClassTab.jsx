import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import EntityFormModal from "@/components/EntityFormModal";

function ClassTab() {
    const { dept_id } = useOutletContext();
    const axiosPrivate = useAxiosPrivate();

    const [classes, setClasses] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const isEditing = (id) => editingId === id;

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await axiosPrivate.get(`/admin/classes/${dept_id}`);
            setClasses(res.data.data);
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [dept_id]);

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append("classes", file);

        try {
            await axiosPrivate.post(`/admin/add-classes/${dept_id}`, formData);
            toast.success("Classes uploaded successfully");
            setOpen(false);
            fetchClasses();
        } catch (error) {
            toast.error(extractErrorMsg(error));
        }
    };

    const handleCreate = async (data) => {
        setLoading(true);
        try {
            await axiosPrivate.post(`/admin/classes/${dept_id}`, data);
            toast.success("Class created successfully");
        } catch (error) {
            toast.error(extractErrorMsg(error));
        } finally {
            setOpen(false);
            setLoading(false);
            fetchClasses();
        }
    };

    const handleUpdate = async (classId) => {
        setLoading(true);
        try {
            await axiosPrivate.patch(
                `/admin/class/${dept_id}/${classId}`,
                editData
            );
            toast.success("Class updated");
            setEditingId(null);
            setEditData({});
            fetchClasses();
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
                    <h2 className="text-xl font-semibold text-gray-800">Classes</h2>
                    <p className="text-sm text-gray-500">
                        Classes and batch structure for this department
                    </p>
                </div>

                <button
                    onClick={() => setOpen(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                    Add Classes
                </button>
            </div>

            <div className="relative border rounded-2xl shadow-sm overflow-x-auto max-h-[420px]">
                <div className="grid gap-5">
                    {classes.map((cls) => (
                        <div
                            key={cls._id}
                            className="bg-white border rounded-2xl shadow-sm p-5"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {cls.year} {cls.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Strength: {cls.strength}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setEditingId(cls._id);
                                        setEditData({
                                            year: cls.year,
                                            name: cls.name,
                                            strength: cls.strength,
                                        });
                                    }}
                                    className="text-sm font-semibold text-blue-600 hover:underline"
                                >
                                    Edit Class
                                </button>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cls.batches.map((b, i) => (
                                    <div
                                        key={i}
                                        className="border rounded-xl p-3 bg-gray-50"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-800">
                                                {b.code}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                {b.type}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600">
                                            Rolls:{" "}
                                            <span className="font-medium text-gray-800">
                                                {b.rollRange.from} – {b.rollRange.to}
                                            </span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {open && (
                <EntityFormModal
                    entity="class"
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

export default ClassTab;
