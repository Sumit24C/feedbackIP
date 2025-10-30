import { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function FeedbackFormList() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await axiosPrivate.get("/student");
        setForms(res.data.data);
      } catch (error) {
        toast.error("Failed to load forms");
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const today = new Date();

  if (loading) return <div className="text-center p-6 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Available Feedback Forms</h1>

      {forms.length === 0 && (
        <p className="text-gray-500">No forms assigned to you.</p>
      )}

      {forms.map((form) => {
        const expired = new Date(form.deadline) < today;
        const submitted = form.status === "submitted";

        return (
          <div
            key={form.formId}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow transition"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">{form.title}</h2>

              <span
                className={`text-xs px-2 py-1 rounded ${
                  submitted
                    ? "bg-green-100 text-green-700"
                    : expired
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {submitted ? "Submitted" : expired ? "Expired" : "Pending"}
              </span>
            </div>

            <p className="text-sm text-gray-600">
              Deadline:{" "}
              <strong>{new Date(form.deadline).toLocaleDateString()}</strong>
            </p>

            {!submitted && !expired && (
              <button
                onClick={() => navigate(`/student/form/${form.formId}`)}
                className="mt-3 px-4 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Fill Form
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
