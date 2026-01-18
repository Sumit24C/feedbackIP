import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ClassCard({ en, formId = "", formType = "", isWeekly = false }) {
    const location = useLocation();
    const navigate = useNavigate();

    const path = isWeekly ? `/faculty/weekly-feedback/entity/${en._id}` : `/faculty/feedback/${formType}/${formId}/entity/${en._id}`;
    const active = location.pathname === path;
    if (formType === "infrastructure") {
        return (
            <div
                role="button"
                aria-current={active}
                onClick={() => navigate(path)}
                className={`cursor-pointer rounded-lg p-3 text-sm transition border
                ${active
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-800 truncate">
                        {en.class_year} · {en.class_name}
                    </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                    {en?.totalResponses || 0} response
                </p>
            </div>
        );
    } else {
        return (
            <div
                role="button"
                aria-current={active}
                onClick={() => navigate(path)}
                className={`cursor-pointer rounded-lg p-3 text-sm transition border
                ${active
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-800 truncate">
                        {en.subject} · {en.class_year} · {en.batch_code || en.class_name}
                    </p>
                </div>
                {!isWeekly ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                        {en?.totalResponses || 0} response
                    </p>
                ) : (
                    <p className="text-xs text-gray-500 mt-0.5">
                        {en?.formType}
                    </p>
                )}
            </div>
        );
    }

}

export default memo(ClassCard);
