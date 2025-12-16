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

function CreateFeedbackForm() {
  const { form_id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [formType, setFormType] = useState("");
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
    if (!title || !formType || !deadline || questions.length === 0) {
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
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold text-gray-800">
          {form_id ? "Edit Feedback Form" : "Create Feedback Form"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Form Title</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
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
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
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

      <h2 className="font-medium">Rating Scale</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Min (1)</label>
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
          <label className="text-sm">Max (10)</label>
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
      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-medium">
          Questions ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <p className="text-sm text-gray-500">No questions added yet</p>
        ) : (
          questions.map((q, i) => (
            <div
              key={i}
              className="flex justify-between items-center border rounded-lg px-3 py-2"
            >
              <span>{q.questionText}</span>
              <button
                onClick={() => removeQuestion(i)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
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
  );
}

export default CreateFeedbackForm;
