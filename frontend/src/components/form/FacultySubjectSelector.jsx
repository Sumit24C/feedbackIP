import { useCallback, useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

function FacultySubjectSelector({ formType, selectedClasses, setSelectedClasses, targetType, setTargetType }) {
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [years, setYears] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await axiosPrivate.get(`/form/faculty/class`);
                const classes = res.data.data;

                setData(classes);

                setYears([...new Set(classes.map(c => c.classYear))]);
            } catch (error) {
                toast.error(
                    error?.response?.data?.message || "Failed to fetch classes"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleSelection = (id) => {
        setSelectedClasses((prev) =>
            prev.includes(id)
                ? prev.filter((p) => p !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedClasses(data.map((d) => d._id));
    };

    const clearAll = () => {
        setSelectedClasses([]);
    };

    const toggleYearSelection = (year) => {
        const yearIds = data
            .filter((d) => d.classYear === year)
            .map((d) => d._id);

        const allSelected = yearIds.every((id) => selectedClasses.includes(id));

        setSelectedClasses((prev) =>
            allSelected
                ? prev.filter((id) => !yearIds.includes(id))
                : Array.from(new Set([...prev, ...yearIds]))
        );
    };

    const filteredData = data.filter((d) => d.formType === formType);

    return (
        <div className="w-full">
            <div className="bg-white rounded-2xl shadow-md p-4 sticky top-20 space-y-4">

                <div className="flex rounded-xl border bg-gray-50 p-1">
                    {["CLASS", "DEPARTMENT"].map((t) => (
                        <button
                            key={t}
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
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
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

                                                <div className="flex-1 text-sm">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-medium text-gray-800">
                                                            {item.classYear} - {item.classDepartment.code} - {item.classSection}
                                                        </p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                            {item.formType}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {item.subject?.name}
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
            </div>
        </div>
    );

}

export default FacultySubjectSelector;
