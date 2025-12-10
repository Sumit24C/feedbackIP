import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function CreateFeedbackForm() {
  const { form_id } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [formType, setFormType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axiosPrivate.get(`/faculty/q`);
        setTemplates(res.data.data);
      } catch {
        toast.error("Failed to load question templates");
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [form_id]);

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

        const formattedQuestions = form.questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          questionId: q._id,
        }));

        setQuestions(formattedQuestions);
      } catch (e) {
        toast.error("Failed to load form details");
      } finally {
        setLoadingForm(false);
      }
    };

    fetchForm();
  }, [form_id]);

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return toast.error("Question cannot be empty");
    setQuestions([...questions, { questionText: newQuestion }]);
    setNewQuestion("");
  };

  const handleAddTemplate = (template) => {
    if (!template?.question || template.question.length === 0)
      return toast.error("Template has no questions");

    const newQuestions = template.question.map((q) => ({
      questionText: q.questionText,
      questionId: q._id,
      questionType: q.questionType || "rating",
    }));

    setQuestions((prev) => [...prev, ...newQuestions]);
  };


  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !formType || !deadline || questions.length === 0) {
      return toast.error("Please fill all fields & add at least 1 question");
    }
    setSubmitLoading(true)

    const customQuestions = questions
      .filter((q) => !q.questionId)
      .map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType || "rating",
      }));

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

  const formMode = form_id ? "update" : "create";

  if (loadingForm) return <div className="p-4">Loading form...</div>;
  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-xl font-bold text-center">
          {form_id ? "✏️ Edit Form" : "Create Form"}
        </h1>
        <div className="w-30 border-1 border-blue-300"></div>
      </div>

      <div>
        <label className="block font-medium">Form Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
      </div>
      <div className="flex sm:flex-col sm:justify-start sm:items-baseline justify-between items-center space-y-1">
        <label className="font-medium">Form Type: </label>
        <Select onValueChange={(val) => setFormType(val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a form-type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>form type</SelectLabel>
              <SelectItem value="theory">theory</SelectItem>
              <SelectItem value="practical">practical</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block font-medium">Deadline</label>
        <input
          type="date"
          className="w-full border p-2 rounded mt-1"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={today}
        />
      </div>

      <div className="border p-4 rounded space-y-3">
        <label className="font-medium">Add Custom Question</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border p-2 rounded"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <button
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>

      <div className="border p-4 rounded space-y-3">
        <h2 className="font-medium mb-2">Use Question Templates</h2>

        {loadingTemplates ? (
          <div>Loading templates...</div>
        ) : templates.length === 0 ? (
          <p>No templates available</p>
        ) : (
          templates.map((t) => (
            <div
              key={t._id}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>
                {t.name} ({t.formType}) ({t.question.length} questions)
              </span>
              <button
                onClick={() => handleAddTemplate(t)}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Add
              </button>
            </div>
          ))
        )}
      </div>
      <div className="border p-4 rounded">
        <h2 className="font-medium mb-3">Questions Added</h2>

        {questions.length === 0 ? (
          <p>No questions added yet</p>
        ) : (
          questions.map((q, i) => (
            <div
              key={i}
              className="flex justify-between items-center border p-2 rounded mb-2"
            >
              <span>{q.questionText}</span>
              <button
                className="px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => removeQuestion(i)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2"
        disabled={submitLoading}
      >
        {submitLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {formMode === "create" ? "Creating..." : "Updating..."}
          </>
        ) : (
          formMode === "create" ? "Create Form" : "Update Form"
        )}
      </button>

    </div>
  );
}

export default CreateFeedbackForm;
