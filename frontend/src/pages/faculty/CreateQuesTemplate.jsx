import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

function CreateQuesTemplate() {
    const axiosPrivate = useAxiosPrivate();

    const [formType, setFormType] = useState("theory");
    const [templateName, setTemplateName] = useState("");
    const [questions, setQuestions] = useState([
        { questionText: "", questionType: "rating" },
    ]);
    const [question, setQuestion] = useState({ questionText: "", questionType: "rating" });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const handleQuestionChange = (index, value) => {
        setQuestions((prev) => prev.map((p, i) => i === index ? { ...p, questionText: value } : p))
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, { questionText: "", questionType: "rating" }]);
    };

    const removeQuestion = (index) => {
        setQuestions((prev) => prev.filter((p, i) => i !== index))
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

        <div className="flex justify-center ">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-2xl bg-white p-6 space-y-3 m-10 rounded-2xl shadow-2xl"
            >
                <h2 className="text-2xl font-bold text-gray-700">Create Question Template</h2>

                <div>
                    <label className="block font-semibold text-gray-700">
                        Template Name
                    </label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full border rounded px-3 py-2 mt-2"
                        placeholder="e.g., Mid-Sem Theory Feedback Template"
                        required
                    />
                </div>
                <div>
                    <label className="font-semibold text-gray-700">Form Type:</label>
                    <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="border rounded p-2 mx-2"
                    >
                        {["theory", "practical"].map((val) => (
                            <option className="text-xs sm:text-sm" key={val} value={val}>
                                {val}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold relative text-gray-700">Questions:</h3>
                    <div className="max-h-48 min-h-30 max-w-2xl overflow-y-scroll shadow-inner">
                        {questions.map((q, index) => (
                            <div
                                key={index}
                                className="flex items-center border p-2 rounded space-x-2 justify-between"
                            >
                                <input
                                    type="text"
                                    placeholder={`Question ${index + 1}`}
                                    value={q.questionText}
                                    onChange={(e) =>
                                        handleQuestionChange(index, e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (e.target.value.trim() !== "") {
                                                addQuestion();
                                            }
                                        }
                                    }}
                                    className="flex-1 border rounded px-3 py-2"
                                    required
                                    autoFocus
                                />
                                <div className="flex items-center space-x-2">
                                    {index === questions.length - 1 && q.questionText.trim() !== "" && (
                                        <button
                                            type="button"
                                            onClick={addQuestion}
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(index)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold disabled:bg-gray-400 cursor-pointer"
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
