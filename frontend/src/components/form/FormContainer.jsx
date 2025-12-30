import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSelector } from "react-redux";

function FormContainer({ formType, setFormType, selectedClasses, setSelectedClasses, targetType, setTargetType }) {
    const { form_id } = useParams();
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.auth);
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [ratingMin, setRatingMin] = useState(1);
    const [ratingMax, setRatingMax] = useState(5);
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [loadingForm, setLoadingForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const today = new Date().toISOString().split("T")[0];
    useEffect(() => {
        if (!form_id) return;

        const fetchForm = async () => {
            setLoadingForm(true);
            try {
                const res = await axiosPrivate.get(`/form/${form_id}`);
                const form = res.data.data;
                
                setTitle(form.title);
                setFormType(form.formType);
                setDeadline(form.deadline?.split("T")[0]);
                setRatingMin(form.ratingConfig?.min ?? 1);
                setRatingMax(form.ratingConfig?.max ?? 5);
                setSelectedClasses(form.facultySubjects);
                setTargetType(form.targetType);
                const formattedQuestions = form.questions.map((q) => ({
                    questionText: q.questionText,
                    questionId: q._id,
                }));

                setQuestions(formattedQuestions);
            } catch {
                toast.error("Failed to load form details");
            } finally {
                setLoadingForm(false);
            }
        };

        fetchForm();
    }, [form_id]);

    const handleAddQuestion = () => {
        if (!newQuestion.trim()) {
            return toast.error("Question cannot be empty");
        }
        setQuestions([...questions, { questionText: newQuestion }]);
        setNewQuestion("");
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title || !formType || !deadline || questions.length === 0 || !targetType) {
            return toast.error("Please fill all fields & add at least 1 question");
        }

        if (ratingMax <= ratingMin) {
            return toast.error("Rating max must be greater than min");
        }

        if (!(ratingMin >= 1 && ratingMin < 10)) {
            return toast.error("Enter a valid min rating");
        }

        if (!(ratingMax >= 2 && ratingMax <= 10)) {
            return toast.error("Enter a valid max rating");
        }

        if (!selectedClasses || selectedClasses.length === 0) {
            return toast.error("Select atleast 1 class");
        }

        setSubmitLoading(true);

        const customQuestions = questions
            .filter((q) => !q.questionId)
            .map((q) => ({ questionText: q.questionText }));

        const existingQuestionIds = questions
            .filter((q) => q.questionId)
            .map((q) => q.questionId);

        try {
            const payload = {
                title,
                formType,
                deadline,
                questions: customQuestions,
                questionsId: existingQuestionIds,
                ratingConfig: {
                    min: ratingMin,
                    max: ratingMax,
                },
                facultySubject: selectedClasses,
                targetType: targetType
            };

            if (form_id) {
                await axiosPrivate.put(`/form/${form_id}`, payload);
                toast.success("Form updated successfully");
            } else {
                
                await axiosPrivate.post(`/form`, payload);
                toast.success("Form created successfully");
            }

            navigate("/faculty/all-forms");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to save form");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loadingForm) {
        return <div className="p-6 text-center">Loading form...</div>;
    }

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 justify-around">
            <div className="flex-1 space-y-5">
                <div className="bg-white rounded-2xl shadow-lg p-5 space-y-5">
                    <p className="text-sm text-gray-500 text-center">
                        Fill the form details and add questions
                    </p>

                    <div>
                        <label className="text-sm font-medium">Form Title</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Form Type</label>
                            <Select value={formType} onValueChange={setFormType}>
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Select form type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Form Type</SelectLabel>
                                        <SelectItem value="theory">Theory</SelectItem>
                                        <SelectItem value="practical">Practical</SelectItem>
                                        {userData.role === "admin" && (
                                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                        )}
                                        <SelectItem value="tutorial">Tutorial</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Deadline</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg px-3 py-2 mt-1"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                min={today}
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="font-medium mb-2">Rating Scale</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm">Min</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={9}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                    value={ratingMin}
                                    onChange={(e) => setRatingMin(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-sm">Max</label>
                                <input
                                    type="number"
                                    min={2}
                                    max={10}
                                    className="w-full border rounded-lg px-3 py-2 mt-1"
                                    value={ratingMax}
                                    onChange={(e) => setRatingMax(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 space-y-2">
                        <label className="text-sm font-medium">Add Question</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border rounded-lg px-3 py-2"
                                placeholder="e.g. How was the teaching quality?"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddQuestion();
                                    }
                                }}
                            />
                            <button
                                onClick={handleAddQuestion}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitLoading}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex justify-center items-center gap-2"
                    >
                        {submitLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                {form_id ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            form_id ? "Update Form" : "Create Form"
                        )}
                    </button>
                </div>
            </div>
            <div className="scroll-py-0">
                <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3 sticky top-20 h-[520px] flex flex-col">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">
                            Questions
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {questions.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {questions.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center mt-10">
                                No questions added yet
                            </p>
                        ) : (
                            questions.map((q, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between items-start gap-2 border rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                                >
                                    <p className="text-sm text-gray-800">
                                        <span className="font-medium mr-1">
                                            {i + 1}.
                                        </span>
                                        {q.questionText}
                                    </p>

                                    <button
                                        onClick={() => removeQuestion(i)}
                                        className="text-red-500 hover:text-red-600 shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}

export default FormContainer