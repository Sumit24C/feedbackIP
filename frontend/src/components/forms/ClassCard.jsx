import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ClassCard({ fs, formId, formType }) {
    const location = useLocation();
    const navigate = useNavigate();

    const path = `/faculty/feedback/${formType}/${formId}/subject/${fs._id}`;
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
                        {fs.classYear} · {fs.classSection}
                    </p>
                    <span className="shrink-0 px-2 py-0.5 rounded-xs bg-gray-100 text-gray-700">
                        {fs.formType}
                    </span>
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                    {fs?.totalResponses || 0} responses
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
                        {fs.subject.name} · {fs.classSection}
                    </p>

                    <span className="shrink-0 px-2 py-0.5 rounded-xs bg-gray-100 text-gray-700">
                        {fs.formType}
                    </span>
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                    {fs.totalResponses} responses
                </p>
            </div>
        );
    }

}

export default memo(ClassCard);
