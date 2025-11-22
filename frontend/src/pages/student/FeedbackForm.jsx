import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useParams, useNavigate } from "react-router-dom";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { Loader2 } from "lucide-react";

function FeedbackForm() {
  const { form_id } = useParams();
  const navigate = useNavigate();
  const axios = useAxiosPrivate();

  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`/student/${form_id}`)
      .then((res) => setFormData(res.data.data))
      .catch((err) => {
        alert(extractErrorMsg(err));
        console.log(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRatingChange = (subjectId, questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [questionId]: value,
      },
    }));
  };

  const handleBulkRating = (subjectId, value) => {
    setResponses((prev) => {
      const updated = { ...(prev[subjectId] || {}) };
      formData.questions.forEach((q) => {
        updated[q.questionId] = value;
      });
      return { ...prev, [subjectId]: updated };
    });
  };

  const isFormComplete = () => {
    return formData.subjects.every((sub) =>
      formData.questions.every((q) =>
        responses[sub.subjectMappingId]?.[q.questionId]
      )
    );
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      if (!isFormComplete()) {
        alert("Please rate all questions for all subjects.");
        return;
      }

      const subjectsPayload = formData.subjects.map((sub) => ({
        subjectMappingId: sub.subjectMappingId,
        responses: Object.entries(responses[sub.subjectMappingId] || {}).map(
          ([qId, ans]) => ({
            questionId: qId,
            answer: ans,
          })
        ),
      }));

      const res = await axios.post(`/student/${form_id}`, {
        subjects: subjectsPayload,
      });

      if (res.data?.message === "Form is expired") {
        alert("❌ Form is expired!");
      } else {
        alert("✅ Feedback submitted successfully");
        navigate("/student/forms");
      }
    } catch (error) {
      alert("Something went wrong while submitting.");
    } finally {
      setSubmitLoading(false)
    }
  };


  if (loading)
    return (
      <div className="flex flex-col justify-center items-center gap-4 mt-32">
        <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />

        <div className="text-indigo-600 font-medium text-lg animate-pulse tracking-wide">
          Loading feedback forms...
        </div>
      </div>
    );

  if (formData.status === "submitted") {
    return (
      <div className="text-center p-10 font-medium text-green-700">
        Feedback already submitted 🎉
      </div>
    );
  }

  const expired = new Date(formData.deadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="max-w-5xl w-full bg-white shadow-lg rounded-2xl p-8 border border-gray-200">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{formData.title}</h2>
          <p
            className={`text-sm mt-1 font-medium ${expired ? "text-red-600" : "text-gray-600"
              }`}
          >
            Deadline: {new Date(formData.deadline).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-10">
          {formData.subjects.map((sub) => (
            <div key={sub.subjectMappingId} className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {sub.subject}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Faculty: <span className="font-medium">{sub.facultyName}</span>
                  </p>
                </div>

                <select
                  className="px-3 py-2 rounded-md border border-gray-300 text-sm 
                  bg-white focus:ring-2 ring-blue-500 focus:outline-none"
                  onChange={(e) =>
                    handleBulkRating(sub.subjectMappingId, e.target.value)
                  }
                >
                  <option value="">Rate All</option>
                  {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <table className="w-full border-collapse">
                <thead className="bg-gray-100 rounded-md">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="p-3">Question</th>
                    <th className="p-3 text-center">Rating (4–10)</th>
                  </tr>
                </thead>

                <tbody>
                  {formData.questions.map((q) => (
                    <tr
                      key={q.questionId}
                      className="border-b last:border-none hover:bg-gray-50 transition"
                    >
                      <td className="p-3 text-gray-800">{q.text}</td>
                      <td className="p-2 text-center">
                        <select
                          required
                          className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white
                          focus:outline-none focus:ring-2 ring-blue-500"
                          value={
                            responses[sub.subjectMappingId]?.[q.questionId] || ""
                          }
                          onChange={(e) =>
                            handleRatingChange(
                              sub.subjectMappingId,
                              q.questionId,
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormComplete() || loading}
          className={`w-full mt-10 py-3 text-lg rounded-xl font-semibold flex items-center justify-center gap-2 transition
    ${isFormComplete() && !loading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
        >
          {submitLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </button>

      </div>
    </div>
  );
}

export default FeedbackForm;
