import React from 'react'
import { useSelector } from 'react-redux';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';

function FormCard({ form, handleDelete }) {
    const isExpired = new Date(form.deadline) < new Date();
    const { userData } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    return (
        <div
            className={`border p-4 rounded-2xl shadow-md hover:shadow-md transition relative 
                ${isExpired ?
                    "border-red-500 bg-red-50"
                    : "border-gray-300"
                } 
                ${userData._id === form.createdBy ?
                    "bg-blue-200" : "bg-white"}`}
        >
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute top-3 right-3 p-1 rounded">
                        ⋮
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                        onClick={() => navigate(`/faculty/dashboard/${form._id}`)}
                    >
                        View
                    </DropdownMenuItem>

                    {userData._id === form.createdBy && (
                        <>
                            <DropdownMenuItem
                                onClick={() => navigate(`/faculty/form/${form._id}`)}
                            >
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(form._id)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <div>
                <div className="flex justify-between items-center mb-1 pr-8">
                    <h2
                        className={`text-lg font-semibold ${isExpired ? "text-red-600" : ""
                            }`}
                    >
                        {form.title}
                    </h2>

                    <span
                        className={`text-sm px-2 py-1 rounded whitespace-nowrap ${isExpired ? "bg-red-200 text-red-700" : userData._id === form.createdBy
                            ? "bg-black text-white"
                            : "bg-blue-100 text-blue-600"
                            }`}
                    >
                        {form.formType}
                    </span>
                </div>

                <p
                    className={`text-sm ${isExpired ? "text-red-600" : "text-gray-600"
                        }`}
                >
                    Deadline:{" "}
                    <strong>{new Date(form.deadline).toLocaleDateString()}</strong>
                    {isExpired && " (Expired)"}
                </p>

                <p className="text-sm text-gray-700">
                    Total Responses: <strong>{form.responseCount}</strong>
                </p>

                {form.responsesByClass && form.responsesByClass.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                        {form.responsesByClass.map((r, idx) => (
                            <div key={idx}>
                                {r.year} - {r.classSection}:{" "}
                                <span className="font-semibold">{r.count}</span> responses
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FormCard