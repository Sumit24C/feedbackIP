import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function FormContainer({
    formType,
    setFormType,
    selectedClasses,
    setSelectedClasses,
    targetType,
    setTargetType,
}) {
    const { form_id } = useParams();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const { userData } = useSelector((state) => state.auth);

    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [loadingForm, setLoadingForm] = useState(false);
    const [submitAction, setSubmitAction] = useState("create");

    const today = new Date().toISOString().split("T")[0];
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            title: "",
            deadline: "",
            startDate: new Date().toISOString().split("T")[0],
            ratingMin: 1,
            ratingMax: 5,
        },
    });

    useEffect(() => {
        if (!form_id) return;

        (async () => {
            setLoadingForm(true);
            try {
                const res = await axiosPrivate.get(`/form/${form_id}`);
                const form = res.data.data;

                reset({
                    title: form.title,
                    deadline: form.deadline.split("T")[0],
                    startDate: form.startDate.split("T")[0],
                    ratingMin: form.ratingConfig.min,
                    ratingMax: form.ratingConfig.max,
                });

                setFormType(form.formType);
                setTargetType(form.targetType);
                setSelectedClasses(form.facultySubject);

                setQuestions(
                    form.questions.map((q) => ({
                        _id: q._id,
                        questionText: q.questionText,
                    }))
                );
            } catch (error) {
                toast.error(extractErrorMsg(error) || "Failed to load form");
            } finally {
                setLoadingForm(false);
            }
        })();

    }, [form_id, reset]);

    const addQuestion = () => {
        if (!newQuestion.trim()) {
            return toast.error("Question cannot be empty");
        }
        setQuestions((prev) => [...prev, { questionText: newQuestion.trim() }]);
        setNewQuestion("");
    };

    const removeQuestion = (index) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data, action) => {
        if (!targetType) {
            return toast.error("Target type is required");
        }

        if (!selectedClasses.length && targetType === "CLASS") {
            return toast.error("Select at least one class");
        }
        const start = new Date(data.startDate);
        const end = new Date(data.deadline);
        if (end < start) {
            return toast.error("Deadline must be after the start date");
        }

        if (data.ratingMax <= data.ratingMin) {
            return toast.error("Rating max must be greater than min");
        }

        if (questions.length === 0) {
            return toast.error("Atleast one question is required");
        }

        const payload = {
            title: data.title,
            formType: formType,
            deadline: data.deadline,
            startDate: data.startDate,
            ratingConfig: {
                min: data.ratingMin,
                max: data.ratingMax,
            },
            targetType,
            existingQuestionIds: questions
                .filter((q) => q._id)
                .map((q) => q._id),

            questions: questions
                .filter((q) => !q._id)
                .map((q) => q.questionText),
        };

        if (targetType === "DEPARTMENT") {
            payload.dept = [userData?.dept];
        } else if (targetType === "CLASS") {
            payload.facultySubject = selectedClasses;
        }

        try {
            if (form_id && action === "update") {
                await axiosPrivate.put(`/form/${form_id}`, payload);
                toast.success("Form updated successfully");
            } else {
                await axiosPrivate.post("/form", payload);
                toast.success("Form created successfully");
            }
            navigate(`/${userData?.role}/all-forms`);
        } catch (err) {
            toast.error(extractErrorMsg(err) || "Failed to save form");
        }
    };

    const startDateValue = watch("startDate");
    const maxRating = watch("ratingMax");
    const minRating = watch("ratingMin");

    if (loadingForm) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-transparent border-t-blue-500 border-l-blue-400 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
            <form
                className="bg-white rounded-2xl shadow-lg p-5 space-y-5"
                onSubmit={handleSubmit((data) => onSubmit(data, submitAction))}
            >
                <div>
                    <label className="text-sm font-medium">Form Title</label>
                    <input
                        {...register("title", { required: "Title is required" })}
                        className="w-full border rounded-lg px-3 py-2 mt-1"
                    />
                    {errors.title && (
                        <p className="text-xs text-red-500">{errors.title.message}</p>
                    )}
                </div>

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
                                {userData?.role === "admin" && (
                                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                )}
                                <SelectItem value="tutorial">Tutorial</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            min={today}
                            {...register("startDate", { required: true })}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.startDate && (
                            <p className="text-xs text-red-500">{errors.startDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Deadline
                        </label>
                        <input
                            type="date"
                            min={startDateValue || today}
                            {...register("deadline", {
                                required: true,
                                validate: (value) =>
                                    !startDateValue || value >= startDateValue
                                        ? true
                                        : "Deadline cannot be before start date",
                            })}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.deadline && (
                            <p className="text-xs text-red-500">{errors.deadline.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Min Rating</label>
                        <input
                            type="number"
                            {...register("ratingMin", { valueAsNumber: true })}
                            min={1}
                            max={(maxRating ?? 10) - 1}
                            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Max Rating</label>
                        <input
                            type="number"
                            {...register("ratingMax", { valueAsNumber: true })}
                            min={(minRating ?? 1) + 1}
                            max={10}
                            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="border rounded-xl p-4">
                    <label className="text-sm font-medium">Add Question</label>
                    <div className="flex gap-2 mt-1">
                        <input
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (!newQuestion.trim()) {
                                        return toast.error("Empty question cannot be added");
                                    }
                                    addQuestion();
                                }
                            }}
                            className="flex-1 border rounded-lg px-3 py-2"
                        />

                        <button
                            type="button"
                            onClick={addQuestion}
                            className="bg-blue-600 text-white rounded-lg px-3"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => setSubmitAction("create")}
                        className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin mx-auto" />
                        ) : form_id ? "Recreate Form" : "Create Form"}
                    </button>

                    {form_id && (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={() => setSubmitAction("update")}
                            className="flex-1 py-3 rounded-xl border border-blue-600 text-blue-600 font-semibold"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin mx-auto" />
                            ) : (
                                "Update Form"
                            )}
                        </button>
                    )}
                </div>
            </form>

            <div className="bg-white rounded-2xl shadow-lg p-4 h-[520px] overflow-y-auto">
                <p className="text-gray-600 p-2">Questions List</p>
                {questions.map((q, i) => (
                    <div
                        key={i}
                        className="flex justify-between items-center border rounded-lg px-3 py-2 mb-2"
                    >
                        <p className="text-sm">{i + 1}. {q.questionText}</p>
                        <button
                            onClick={() => removeQuestion(i)}
                            className="text-red-500"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FormContainer;
