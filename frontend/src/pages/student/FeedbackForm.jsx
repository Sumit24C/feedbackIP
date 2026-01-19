import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { useParams, useNavigate } from "react-router-dom";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { Loader2 } from "lucide-react";
import { invalidateLastFetch } from "@/store/studentForm";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

function FeedbackForm() {
  const { form_id, fs_id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState(null);
  const [studentResponses, setStudentResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = fs_id
          ? `/student/${form_id}/${fs_id}`
          : `/student/${form_id}`;
        const res = await api.get(url);
        setFormData(res.data.data);
      } catch (error) {
        setErrMsg(extractErrorMsg(error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRating = (fsId, qId, val) => {
    setStudentResponses((prev) => {
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

  const isComplete =
    studentResponses?.length === formData?.entities?.length &&
    studentResponses?.every(
      (fs) => fs.ratings.length === formData?.questions?.length
    );

  const expired =
    formData?.deadline && new Date(formData.deadline) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete) return;

    setSubmitLoading(true);
    try {
      const res = await api.post(`/student/${form_id}`, studentResponses);
      dispatch(invalidateLastFetch());
      toast.success(res.data.message || "Feedback submitted successfully");
      navigate("/student/forms");
    } catch (error) {
      toast.error(extractErrorMsg(error) || "Something went wrong while submitting.");
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

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-6">
      <form onSubmit={handleSubmit}>
        {/* <div className="sticky top-16 z-30 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
        flex items-center gap-2
        text-sm font-medium text-gray-600
        hover:text-blue-600
        transition
      "
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div> */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-8">
          <div className="mb-6 border-b pb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center">
              {formData.title}
            </h2>
            <div className="flex flex-col items-center mt-3 gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                {formData.formType}
              </span>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${expired
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
                  }`}
              >
                Deadline:{" "}
                {new Date(formData.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="space-y-10">
            {formData.entities?.map((en) => (
              <div
                key={en._id}
                className="bg-gray-50 rounded-xl border p-4 sm:p-6 space-y-4"
              >
                {formData.formType !== "infrastructure" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {en.subject}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full inline-block mt-1">
                      Faculty: {en.facultyName}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.questions.map((q, i) => (
                    <div
                      key={q.questionId}
                      className="bg-white rounded-lg border p-4 space-y-3 hover:shadow-sm transition"
                    >
                      <p className="text-sm font-medium text-gray-700">
                        {i + 1}. {q.text}
                        <span className="ml-1 text-red-500">*</span>
                      </p>

                      <div className="flex gap-3 overflow-x-auto py-2">
                        {Array.from(
                          {
                            length:
                              formData.ratingConfig.max -
                              formData.ratingConfig.min +
                              1,
                          },
                          (_, i) => formData.ratingConfig.min + i
                        ).map((v) => (
                          <label key={v}>
                            <input
                              type="radio"
                              name={`${en._id}-${q.questionId}`}
                              onChange={() =>
                                handleRating(en._id, q.questionId, v)
                              }
                              className="peer hidden"
                              required
                            />
                            <div
                              className="
                                min-w-[48px] h-12
                                flex items-center justify-center
                                rounded-xl border
                                text-sm font-semibold
                                transition
                                peer-checked:bg-blue-600
                                peer-checked:text-white
                                peer-checked:border-blue-600
                                hover:border-blue-400
                                active:scale-95
                              "
                            >
                              {v}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white pt-6 mt-10 border-t flex justify-center">
            <button
              type="submit"
              disabled={submitLoading || !isComplete}
              className={`w-full sm:w-2/3 py-4 rounded-xl text-lg font-semibold transition
                ${submitLoading
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : !isComplete
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                }`}
            >
              {submitLoading ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}

export default FeedbackForm;
