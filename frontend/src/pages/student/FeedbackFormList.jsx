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

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center gap-4 mt-32">
        <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />

        <div className="text-indigo-600 font-medium text-lg animate-pulse tracking-wide">
          Loading feedback forms...
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Feedback Forms
        </h1>
        <p className="text-gray-500 text-sm">
          Complete your pending feedback before the deadline.
        </p>
      </div>

      {forms.length === 0 && (
        <div className="text-center text-gray-500 border rounded-lg p-10 bg-gray-50">
          🎉 No forms assigned to you right now.
        </div>
      )}

      <div className="space-y-5">
        {forms.map((form) => {
          const expired = new Date(form.deadline) < today;
          const submitted = form.status === "submitted";

          return (
            <div
              key={form.formId}
              className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Top Row */}
              <div className="flex justify-between items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {form.title}
                </h2>

                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                    submitted
                      ? "bg-green-100 text-green-700"
                      : expired
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {submitted ? "Submitted" : expired ? "Expired" : "Pending"}
                </span>
              </div>

              {/* Deadline */}
              <p className="mt-1 text-sm text-gray-700">
                Deadline:{" "}
                <span className="font-medium">
                  {new Date(form.deadline).toLocaleDateString()}
                </span>
              </p>

              {/* Button */}
              {!submitted && !expired && (
                <button
                  onClick={() => navigate(`/student/form/${form.formId}`)}
                  className="mt-4 inline-block px-5 py-2 text-sm rounded-lg 
                  bg-blue-600 text-white hover:bg-blue-700 
                  focus:ring-2 focus:ring-blue-400 focus:outline-none 
                  transition-all"
                >
                  Fill Form
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
