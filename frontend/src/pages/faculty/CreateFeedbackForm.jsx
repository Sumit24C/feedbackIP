import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";

function CreateFeedbackForm() {
  const { form_id } = useParams();   // ✅ Read form_id for edit mode
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

  // ✅ Load templates from backend
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

  // ✅ If EDIT mode, load form details
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

        // ✅ Combine template and custom questions into UI format
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

  // ✅ Add custom manually-entered question
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return toast.error("Question cannot be empty");
    setQuestions([...questions, { questionText: newQuestion }]);
    setNewQuestion("");
  };

  // ✅ Add ALL questions from selected template
  const handleAddTemplate = (template) => {
    if (!template?.question || template.question.length === 0)
      return toast.error("Template has no questions");

    const newQuestions = template.question.map((q) => ({
      questionText: q.questionText,
      questionId: q._id,           // ✅ store real question ID
      questionType: q.questionType || "rating",
    }));

    setQuestions((prev) => [...prev, ...newQuestions]);
  };


  // ✅ Remove question
  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // ✅ Submit form (Create or Edit)
  const handleSubmit = async () => {
    if (!title || !formType || !deadline || questions.length === 0) {
      return toast.error("Please fill all fields & add at least 1 question");
    }

    // NEW custom questions (no questionId)
    const customQuestions = questions
      .filter((q) => !q.questionId)
      .map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType || "rating",
      }));

    // Pre-existing template questions (with questionId)
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

      navigate(-1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save form");
    }
  };


  if (loadingForm) return <div className="p-4">Loading form...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">
        {form_id ? "✏️ Edit Feedback Form" : "Create Feedback Form"}
      </h1>

      {/* Title */}
      <div>
        <label className="block font-medium">Form Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block font-medium">Form Type</label>
        <select
          className="w-full border p-2 rounded mt-1"
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
        >
          <option value="">Select Form Type</option>
          <option value="theory">theory</option>
          <option value="practical">practical</option>
        </select>
      </div>

      {/* Deadline */}
      <div>
        <label className="block font-medium">Deadline</label>
        <input
          type="date"
          className="w-full border p-2 rounded mt-1"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      {/* Add Questions */}
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

      {/* Templates */}
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

      {/* Question List */}
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
        className="w-full px-4 py-2 bg-blue-600 text-white rounded"
      >
        {form_id ? "✅ Update Form" : "✅ Create Form"}
      </button>
    </div>
  );
}

export default CreateFeedbackForm;
