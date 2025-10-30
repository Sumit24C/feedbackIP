import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function Questions() {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    const fetchTemplates = async () => {
        setLoading(true);
        setErrMsg("");

        try {
            const res = await axiosPrivate.get("/faculty/q");
            setTemplates(res.data.data);
        } catch (error) {
            setErrMsg(extractErrorMsg(error));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this template?");
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            await axiosPrivate.delete(`/faculty/q/${id}`);
            setTemplates((prev) => prev.filter((t) => t._id !== id));
            alert("Template deleted ✅");
        } catch (error) {
            alert("Failed to delete template ❌");
            console.error(error);
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-5">Question Templates</h2>

            {loading && <p className="text-blue-500">Loading...</p>}
            {errMsg && <p className="text-red-500">{errMsg}</p>}

            {!loading && templates.length === 0 && (
                <p className="text-gray-600">No templates found.</p>
            )}

            <div className="space-y-6">
                {templates.map((template) => (
                    <div
                        key={template._id}
                        className="p-5 bg-white border rounded-lg shadow hover:shadow-md transition-all"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold">{template.name || "Untitled Template"}</h3>

                            <span
                                className={`px-3 py-1 rounded text-white capitalize text-sm ${template.formType === "practical"
                                    ? "bg-green-600"
                                    : "bg-blue-600"
                                    }`}
                            >
                                {template.formType}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                            Department: {template.dept?.name || template.dept}
                        </p>

                        <h4 className="mt-4 font-medium">Questions:</h4>
                        <ul className="mt-2 space-y-2">
                            {template.question.map((q, index) => (
                                <li
                                    key={q._id}
                                    className="border p-3 rounded bg-gray-50"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                            {index + 1}. {q.questionText}
                                        </span>
                                        <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded">
                                            {q.questionType}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4">
                            {/* <button
                                onClick={() => navigate(`/faculty/questions/edit/${template._id}`)}
                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                                Edit
                            </button> */}

                            <Button
                                loading={deleteLoading}
                                onClick={() => handleDelete(template._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Questions;
