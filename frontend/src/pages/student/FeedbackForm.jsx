import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useParams, useNavigate } from "react-router-dom";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { Loader2 } from "lucide-react";
function FeedbackForm() {
  const { form_id, fs_id } = useParams();
  const navigate = useNavigate();
  const api = useAxiosPrivate();

  const [formData, setFormData] = useState(null);
  const [facultySubjectResponse, setFacultySubjectResponse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = fs_id ? `/student/${form_id}/${fs_id}` : `/student/${form_id}`;
        const res = await api.get(url);
        setFormData(res.data.data);
      } catch (error) {
        alert(extractErrorMsg(error));
        setErrMsg(extractErrorMsg(error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRating = (fsId, qId, val) => {
    setFacultySubjectResponse((prev) => {
      const fsIndex = prev.findIndex((p) => p._id === fsId);

      if (fsIndex === -1) {
        return [
          ...prev,
          {
            _id: fsId,
            ratings: [{ questionId: qId, answer: val }],
          },
        ];
      }

      return prev.map((fs) => {
        if (fs._id !== fsId) return fs;

        const ratingIndex = fs.ratings.findIndex(
          (r) => r.questionId === qId
        );

        if (ratingIndex !== -1) {
          const updated = [...fs.ratings];
          updated[ratingIndex] = { questionId: qId, answer: val };
          return { ...fs, ratings: updated };
        }

        return {
          ...fs,
          ratings: [...fs.ratings, { questionId: qId, answer: val }],
        };
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete) return;
    setSubmitLoading(true);
    try {
      const url = `/student/${form_id}`;
      await api.post(url, facultySubjectResponse);
      alert("Feedback submitted successfully");
      navigate("/student/forms");
    } catch {
      alert("Something went wrong while submitting.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-blue-600 font-medium">Loading feedback form...</p>
      </div>
    );
  }

  if (errMsg) {
    return <p className="text-red-500 text-center mt-10">{errMsg}</p>;
  }

  const isComplete = facultySubjectResponse?.length === formData.facultySubjects?.length && facultySubjectResponse?.every(fs =>
    fs.ratings.length === formData.questions?.length
  );

  const expired =
    formData?.deadline && new Date(formData.deadline) < new Date();

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-6"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-8">

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {formData.title}
          </h2>
          <div className="flex flex-col justify-center items-center">
            <span
              className={`mt-2 px-3 py-1 text-c font-semibold rounded-full`}
            >
              {formData.formType}
            </span>
            <span
              className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full
              ${expired
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
                }
              `}
            >
              Deadline: {new Date(formData.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {formData.facultySubjects?.map((fs) => (
            <div
              key={fs._id}
              className="bg-gray-50 rounded-xl border p-4 sm:p-6 space-y-4"
            >
              {formData.formType !== "infrastructure" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {fs.subject.name}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full inline-block mt-1">
                    Faculty: {fs.facultyName}
                  </span>
                </div>
              )}

              {formData.questions.map((q, i) => (
                <div
                  key={q.questionId}
                  className="bg-white rounded-lg border p-4 space-y-2 flex flex-wrap justify-between items-center"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {i + 1}. {q.text}
                    <span className="ml-1 text-red-500">*</span>
                  </p>

                  <select
                    defaultValue=""
                    onChange={(e) =>
                      handleRating(
                        fs._id,
                        q.questionId,
                        Number(e.target.value)
                      )
                    }
                    required
                    aria-required="true"
                    className="w-auto border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select rating
                    </option>

                    {Array.from(
                      {
                        length:
                          formData.ratingConfig.max -
                          formData.ratingConfig.min +
                          1,
                      },
                      (_, i) => formData.ratingConfig.min + i
                    ).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t mt-8 pt-4 pb-2">
          <button
            type="submit"
            disabled={submitLoading}
            className={`w-full py-4 rounded-xl text-lg font-semibold transition
              ${submitLoading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : !isComplete
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              }
            `}
          >
            {submitLoading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default FeedbackForm;
