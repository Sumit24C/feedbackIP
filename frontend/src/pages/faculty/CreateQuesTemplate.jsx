import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateQuesTemplate() {
    const axiosPrivate = useAxiosPrivate();

    const [formType, setFormType] = useState("theory");
    const [templateName, setTemplateName] = useState("");
    const [questions, setQuestions] = useState([
        { questionText: "", questionType: "rating" },
    ]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const handleQuestionChange = (index, value) => {
        const updated = [...questions];
        updated[index].questionText = value;
        setQuestions(updated);
    };

    const addQuestion = () => {
        setQuestions([...questions, { questionText: "", questionType: "rating" }]);
    };

    const removeQuestion = (index) => {
        const updated = [...questions];
        updated.splice(index, 1);
        setQuestions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!templateName.trim()) {
            return setMessage("Template name is required");
        }

        try {
            setLoading(true);
            const payload = {
                name: templateName,
                formType,
                questions,
            };

            const res = await axiosPrivate.post("/form/q", payload);
            setMessage("Template Created Successfully ✅");
            navigate("/faculty/questions");
        } catch (error) {
            console.error(error);
            setMessage("Failed to create template ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center py-10 bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-2xl bg-white rounded-lg shadow p-8 space-y-6"
            >
                <h2 className="text-2xl font-bold text-gray-700">Create Question Template</h2>

                {/* Template Name */}
                <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                        Template Name
                    </label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g., Mid-Sem Theory Feedback Template"
                        required
                    />
                </div>

                {/* Form Type */}
                <div>
                    <label className="font-semibold text-gray-700">Form Type:</label>
                    <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="ml-2 border rounded px-3 py-1"
                    >
                        <option value="theory">Theory</option>
                        <option value="practical">Practical</option>
                    </select>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Questions:</h3>

                    {questions.map((q, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 border p-2 rounded"
                        >
                            <input
                                type="text"
                                placeholder={`Question ${index + 1}`}
                                value={q.questionText}
                                onChange={(e) =>
                                    handleQuestionChange(index, e.target.value)
                                }
                                className="flex-1 border rounded px-3 py-2"
                                required
                            />

                            {questions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(index)}
                                    className="px-3 py-1 bg-red-500 text-white rounded"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        + Add Question
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 rounded font-semibold disabled:bg-gray-400"
                >
                    {loading ? "Creating..." : "Create Template"}
                </button>

                {message && (
                    <p className="text-center font-medium text-gray-700 mt-2">
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}

export default CreateQuesTemplate;
