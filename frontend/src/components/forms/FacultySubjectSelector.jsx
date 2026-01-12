import { useEffect, useMemo, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelector } from "react-redux";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

function FacultySubjectSelector({
    form_id,
    submitAction,
    formType,
    selectedClasses,
    setSelectedClasses,
    targetType,
    setTargetType
}) {
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [years, setYears] = useState([]);
    const { userData } = useSelector((state) => state.auth);

    useEffect(() => {
        (async () => {
            try {
                const url = userData?.role === "admin" ? "/form/admin/dept" : "/form/faculty/class"
                const res = await axiosPrivate.get(url);
                if (userData?.role === "faculty") {
                    const classes = res.data.data;
                    setYears([...new Set(classes.map(c => c.class_year))]);
                }
                setData(res.data.data);
            } catch (error) {
                toast.error(
                    extractErrorMsg(error) || "Failed to fetch data"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredData = useMemo(
        () => data.filter((d) => d.formType === formType),
        [data, formType]
    );

    const tabs = userData?.role === "faculty" ? ["CLASS", "DEPARTMENT"] : ["DEPARTMENT", "INSTITUTE"];

    const toggleYearSelection = (year) => {
        const yearIds = filteredData
            .filter((d) => d.class_year === year)
            .map((d) => d._id);

        const allSelected = yearIds.every((id) => selectedClasses.includes(id));

        setSelectedClasses((prev) =>
            allSelected
                ? prev.filter((id) => !yearIds.includes(id))
                : Array.from(new Set([...prev, ...yearIds]))
        );
    };

    const selectAll = () => {
        setSelectedClasses(filteredData.map((d) => d._id));
    };

    const toggleSelection = (id) => {
        setSelectedClasses((prev) =>
            prev.includes(id)
                ? prev.filter((p) => p !== id)
                : [...prev, id]
        );
    };

    const clearAll = () => {
        setSelectedClasses([]);
    };

    useEffect(() => {
        if (formType === "infrastructure") {
            setTargetType("DEPARTMENT");
        }

        if (!form_id) {
            setSelectedClasses([]);
        }
    }, [formType, form_id]);


    return (
        <div className="w-full">
            <div className="bg-white rounded-2xl shadow-md p-4 sticky top-20 space-y-4 min-w-full">

                <div className="flex rounded-xl border bg-gray-50 p-1">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            disabled={formType === "infrastructure" || (form_id && submitAction === "update")}
                            onClick={() => setTargetType(t)}
                            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition
                            ${targetType === t
                                    ? "bg-white text-blue-700 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"}
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {targetType === "CLASS" && (
                    <div className="space-y-4">

                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800">
                                Assign Classes
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-ful text-blue-700">
                                {selectedClasses.length} selected
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-50 transition"
                            >
                                Select all
                            </button>
                            <button
                                onClick={clearAll}
                                className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-50 transition"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {years.map((y) => (
                                <button
                                    key={y}
                                    onClick={() => toggleYearSelection(y)}
                                    className="px-3 py-1 text-xs rounded-full border bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition"
                                >
                                    {y}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-transparent border-t-blue-500 border-l-blue-400 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                                {filteredData.length > 0 ? (
                                    filteredData.map((item) => {
                                        const isChecked = selectedClasses.includes(item._id.toString());
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={() => toggleSelection(item._id)}
                                                className={`flex gap-3 px-3 py-2 rounded-lg border cursor-pointer transition
                                                    ${isChecked
                                                        ? "bg-blue-50 border-blue-300"
                                                        : "bg-white hover:bg-gray-50 border-gray-200"}
                                                `}
                                            >
                                                <Checkbox checked={isChecked} className="mt-1" />

                                                <div className="flex-1 text-sm">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-medium text-gray-800">
                                                            {item.class_year} - {item.department} - {item.formType === "theory" ? item.class_name : item.batch_code}
                                                        </p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                            {item.formType}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {item.subject}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-10">
                                        No classes found
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {userData?.role === "admin" && targetType === "DEPARTMENT" && (
                    <div className="space-y-4">

                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800">
                                Assign Department
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-ful text-blue-700">
                                {selectedClasses.length} selected
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-50 transition"
                            >
                                Select all
                            </button>
                            <button
                                onClick={clearAll}
                                className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-50 transition"
                            >
                                Clear
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-transparent border-t-blue-500 border-l-blue-400 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                                {data.length > 0 ? (
                                    data.map((item) => {
                                        const isChecked = selectedClasses.includes(item._id);

                                        return (
                                            <div
                                                key={item._id}
                                                onClick={() => toggleSelection(item._id)}
                                                className={`flex gap-3 px-3 py-2 rounded-lg border cursor-pointer transition
                                                    ${isChecked
                                                        ? "bg-blue-50 border-blue-300"
                                                        : "bg-white hover:bg-gray-50 border-gray-200"}
                                                `}
                                            >
                                                <Checkbox checked={isChecked} className="mt-1" />
                                                <div className="flex items-start justify-center gap-2">
                                                    <p className="font-medium text-sm text-gray-800">
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-10">
                                        No department found
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

}

export default FacultySubjectSelector;
