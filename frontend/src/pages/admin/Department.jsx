import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import UploadModal from "@/components/UploadModal";
function Department() {
    const { dept_id } = useParams();
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    const [dept, setDept] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUpLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("students");

    const [openSubjectModal, setOpenSubjectModal] = useState(false);
    const [openStudentModal, setOpenStudentModal] = useState(false);
    const [openFacultyModal, setOpenFacultyModal] = useState(false);

    const fetchDepartment = async () => {
        setLoading(true);
        try {
            const res = await axiosPrivate.get(`/admin/${dept_id}`);
            setDept(res.data.data);
            console.log(res.data);
        } catch (err) {
            toast.error("Failed to load department");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDepartment();
    }, [dept_id]);

    {
        uploading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-white font-medium text-lg">Uploading...</p>
                </div>
            </div>
        )
    }

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

    if (!dept) return <div className="p-6">Department not found</div>;

    const hod = dept.faculties.find((f) => f.isHOD);

    const handleStudentUpload = async (file) => {
        setUpLoading(true);
        const formData = new FormData();
        formData.append("students", file);

        try {
            const res = await axiosPrivate.post(`/admin/add-students/${dept_id}`, formData);
            toast.success(res.data.message);
            setOpenStudentModal(false);
            fetchDepartment();
        } catch (e) {
            toast.error("Failed to upload students");
        } finally {
            setUpLoading(false);
        }
    };

    const handleFacultyUpload = async (file) => {
        setUpLoading(true);
        const formData = new FormData();
        formData.append("faculties", file);

        try {
            const res = await axiosPrivate.post(`/admin/add-faculties/${dept_id}`, formData);
            toast.success(res.data.message);
            setOpenFacultyModal(false);
            fetchDepartment();
        } catch (e) {
            toast.error("Failed to upload faculties");
        } finally {
            setUpLoading(false);
        }
    };

    const handleSubjectUpload = async (file) => {
        setUpLoading(true);
        const formData = new FormData();
        formData.append("subjects", file);

        try {
            const res = await axiosPrivate.post(`/admin/add-subjects/${dept_id}`, formData);
            toast.success(res.data.message);
            setOpenSubjectModal(false);
            fetchDepartment();
        } catch (e) {
            toast.error("Failed to upload subjects");
        } finally {
            setUpLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{dept.name}</h1>
                    {hod && (
                        <p className="mt-1 text-gray-600">
                            HOD: <span className="font-semibold">{hod.user?.fullname.toUpperCase() || "HOD"}</span>
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setOpenStudentModal(true)}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        ➕ Add Students
                    </button>

                    <button
                        onClick={() => setOpenFacultyModal(true)}
                        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                    >
                        ➕ Add Faculties
                    </button>
                    <button
                        onClick={() => setOpenSubjectModal(true)}
                        className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                        ➕ Add Subjects
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    className={`px-4 py-2 rounded ${activeTab === "students" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setActiveTab("students")}
                >
                    Students
                </button>

                <button
                    className={`px-4 py-2 rounded ${activeTab === "faculties" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setActiveTab("faculties")}
                >
                    Faculties
                </button>
                <button
                    className={`px-4 py-2 rounded ${activeTab === "subjects" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setActiveTab("subjects")}
                >
                    Subjects
                </button>
            </div>

            {activeTab === "students" && (
                <section>
                    <h2 className="text-xl font-semibold mb-3">Students</h2>

                    <div className="overflow-x-auto overflow-y-scroll border rounded-lg h-96">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-3">Roll No</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Section</th>
                                    <th className="p-3">Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dept.students.map((s) => (
                                    <tr key={s._id} className="border-b hover:bg-gray-100">
                                        <td className="p-3">{s.roll_no}</td>
                                        <td className="p-3">{s.user?.fullname || "Unknown"}</td>
                                        <td className="p-3">{s.user?.email || "Unknown"}</td>
                                        <td className="p-3">{s.classSection}</td>
                                        <td className="p-3">{s.academic_year}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === "faculties" && (
                <section>
                    <h2 className="text-xl font-semibold mb-3">Faculties</h2>

                    <div className="w-70% overflow-y-scroll border rounded-lg h-80">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dept.faculties.map((f) => (
                                    <tr key={f._id} className="border-b hover:bg-gray-100">
                                        <td className="p-3">{f.user?.fullname}</td>
                                        <td className="p-3">{f.user?.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === "subjects" && (
                <section>
                    <h2 className="text-xl font-semibold mb-3">Faculties</h2>

                    <div className="w-70% overflow-y-scroll border rounded-lg h-80">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">subject_code</th>
                                    <th className="p-3">year</th>
                                    <th className="p-3">type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dept.subjects.map((sub) => (
                                    <tr key={sub._id} className="border-b hover:bg-gray-100">
                                        <td className="p-3">{sub.name}</td>
                                        <td className="p-3">{sub.subject_code}</td>
                                        <td className="p-3">{sub.year}</td>
                                        <td className="p-3">{sub.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            <UploadModal
                isOpen={openStudentModal}
                onClose={() => setOpenStudentModal(false)}
                onUpload={handleStudentUpload}
            />

            <UploadModal
                isOpen={openFacultyModal}
                onClose={() => setOpenFacultyModal(false)}
                onUpload={handleFacultyUpload}
            />
            <UploadModal
                isOpen={openSubjectModal}
                onClose={() => setOpenSubjectModal(false)}
                onUpload={handleSubjectUpload}
            />

        </div>

    );
}

export default Department;
