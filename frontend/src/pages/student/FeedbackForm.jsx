import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useParams, useNavigate } from "react-router-dom";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function FeedbackForm() {
  const { form_id } = useParams();
  const navigate = useNavigate();
  const axios = useAxiosPrivate();

  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/student/${form_id}`)
      .then((res) => setFormData(res.data.data))
      .catch((err) => {
        alert(extractErrorMsg(err));
        console.log(err)
      })
      .finally(() => setLoading(false));
  }, []);
  console.log(formData);
  const handleRatingChange = (subjectId, questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [questionId]: value,
      },
    }));
  };

  // ✅ Bulk rating
  const handleBulkRating = (subjectId, value) => {
    setResponses((prev) => {
      const updated = { ...(prev[subjectId] || {}) };
      formData.questions.forEach((q) => {
        updated[q.questionId] = value;
      });
      return {
        ...prev,
        [subjectId]: updated,
      };
    });
  };

  // ✅ check all fields filled
  const isFormComplete = () => {
    return formData.subjects.every((sub) =>
      formData.questions.every((q) =>
        responses[sub.subjectMappingId] &&
        responses[sub.subjectMappingId][q.questionId]
      )
    );
  };

  const handleSubmit = async () => {
    try {
      if (!isFormComplete()) {
        alert("Please rate all questions for all subjects.");
        return;
      }

      if (!formData?.subjects?.length) {
        alert("No subjects found!");
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

      const res = await axios.post(
        `/student/${form_id}`, {
        subjects: subjectsPayload
      });

      if (res.data?.message === "Form is expired") {
        alert("❌ Form is expired!");
      } else {
        alert("✅ Feedback submitted successfully");
        navigate("/student/forms");
      }
    } catch (error) {
      if (error.response?.data?.message === "Response already submitted") {
        alert("❌ You have already submitted this form.");
      } else {
        console.log(error);
        alert("Something went wrong while submitting.");
      }
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (formData.status === "submitted") {
    return <div className="text-center p-10">Already submitted</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-xl p-6 rounded-2xl border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-800 text-center">
          {formData?.title || "Feedback Form"}
        </h2>
        <p className="text-sm text-blue-600 text-center mb-6">
          Deadline: {new Date(formData?.deadline).toLocaleDateString()}
        </p>

        {formData?.subjects?.map((sub) => (
          <div
            key={sub.subjectMappingId}
            className="mb-8 bg-gradient-to-r from-blue-800 to-blue-900 text-white p-4 rounded-lg shadow-lg"
          >
            <h3 className="text-lg font-semibold">
              {sub.subject} &nbsp;•&nbsp; Faculty:{" "}
              <span className="font-bold">{sub.facultyName}</span>
            </h3>

            {/* ✅ Bulk rating dropdown */}
            <div className="flex justify-end mt-2">
              <select
                className="p-2 rounded-lg border border-blue-400 bg-blue-50 text-blue-800 font-semibold"
                onChange={(e) =>
                  handleBulkRating(sub.subjectMappingId, e.target.value)
                }
              >
                <option value="">Rate All</option>
                {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <table className="w-full bg-white mt-4 rounded-lg overflow-hidden">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="p-2 text-left">Question</th>
                  <th className="p-2 text-center">Rating (4–10)</th>
                </tr>
              </thead>

              <tbody>
                {formData?.questions?.map((q) => (
                  <tr key={q.questionId} className="border-b">
                    <td className="p-3 text-gray-800">{q.text}</td>
                    <td className="p-2 text-center">
                      <select
                        className="p-2 rounded-lg border border-blue-400 bg-blue-50 focus:outline-none text-blue-800 font-semibold"
                        required
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

        <button
          onClick={handleSubmit}
          disabled={!isFormComplete()}
          className={`w-full p-3 mt-4 rounded-xl font-bold transition-all ${
            isFormComplete()
              ? "bg-blue-700 text-white hover:bg-blue-800"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
}

export default FeedbackForm;
