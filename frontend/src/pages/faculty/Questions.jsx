import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { extractErrorMsg } from "@/utils/extractErrorMsg";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function Questions() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await axiosPrivate.get("/faculty/q");
      setTemplates(res.data.data);
    } catch (error) {
      setErrMsg(extractErrorMsg(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this template?");
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await axiosPrivate.delete(`/faculty/q/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-wide text-gray-800">
          Question Templates
        </h2>

        <Button
          onClick={() => navigate("/faculty/create-question-template")}
          className="bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          + Add Template
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center mt-24">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {errMsg && <p className="text-red-600 mt-2">{errMsg}</p>}

      {!loading && templates.length === 0 ? (
        <div className="mt-10 text-center text-gray-500 text-lg">
          No templates available yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className="
                p-6 rounded-xl border bg-white 
                shadow-sm hover:shadow-lg transition-all
                hover:-translate-y-1 duration-300
              "
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {template.name || "Untitled Template"}
                </h3>

                <span
                  className={`
                    px-3 py-1 rounded-lg text-xs uppercase font-semibold 
                    ${template.formType === "practical"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"}
                  `}
                >
                  {template.formType}
                </span>
              </div>

              <p className="text-gray-500 text-sm mt-1">
                Dept: {template.dept?.name || template.dept}
              </p>

              <div className="mt-4">
                <p className="font-medium text-gray-700 mb-2">
                  Questions ({template.question.length})
                </p>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                  {template.question.map((q, index) => (
                    <div
                      key={q._id}
                      className="bg-gray-50 border rounded-lg p-3 text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800">
                          {index + 1}. {q.questionText}
                        </span>

                        <span className="bg-gray-700 text-white text-[10px] px-2 py-1 rounded">
                          {q.questionType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(template._id)}
                  disabled={deleteLoading}
                  className="shadow-sm"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Questions;
