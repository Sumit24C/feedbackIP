import React from "react";
import { Link } from "react-router-dom";

function StudentFeedbackCard({ form }) {
  const expired = new Date(form.deadline) < new Date();
  const submitted = form.status === "submitted";
  const disabled = submitted || expired;
  return (
    <Link
      to={
        disabled
          ? "#"
          : form.targetType === "DEPARTMENT"
            ? `/student/form/${form.formId}`
            : `/student/form/${form.formId}/${form.facultySubjectId}`
      }
      className={`block rounded-xl border bg-white px-5 py-4
        hover:-translate-y-0.5
        transition-all duration-200 shadow-md
        ${disabled
          ? "cursor-not-allowed opacity-70"
          : "hover:shadow-xl hover:border-blue-200"
        }`}
      aria-disabled={disabled}
      onClick={(e) => disabled && e.preventDefault()}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {form.title}
        </h2>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize
            ${submitted
              ? "bg-green-100 text-green-700"
              : expired
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-700"
            }`}
        >
          {submitted ? "Submitted" : expired ? "Expired" : "Pending"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        {form.targetType !== "DEPARTMENT" && (
          <span className="truncate">
            Faculty:{" "}
            <span className="font-medium text-gray-900">
              {form.facultyName}
            </span>
          </span>
        )}

        <span>
          Type:{" "}
          <span className="font-medium text-gray-900">
            {form.formType}
          </span>
        </span>

        <span>
          Deadline:{" "}
          <span className="font-medium text-gray-900">
            {new Date(form.deadline).toLocaleDateString()}
          </span>
        </span>
      </div>
    </Link>
  );
}

export default StudentFeedbackCard;
