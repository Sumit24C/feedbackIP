import { Plus, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function QuestionActions({
    newQuestion,
    setNewQuestion,
    addQuestion,
    isSubmitting,
    submitAction,
    setSubmitAction,
    form_id,
    onSubmit,
}) {
    return (
        <div className="space-y-4">
            <div className="border rounded-xl p-4">
                <label className="text-sm font-medium">Add Question</label>
                <div className="flex gap-2 mt-1">
                    <input
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addQuestion();
                            }
                        }}
                        className="flex-1 min-w-0 border rounded-lg px-3 py-2"
                    />
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="bg-blue-600 text-white rounded-lg px-3"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
            <div className="flex gap-3 items-end">
                {form_id && (
                    <div className="w-40">
                        <Select value={submitAction} onValueChange={setSubmitAction}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Select action</SelectLabel>
                                    <SelectItem value="recreate">Recreate</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <button
                    type={onSubmit ? "button" : "submit"}
                    disabled={isSubmitting}
                    onClick={onSubmit}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-semibold
                     flex items-center justify-center disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : submitAction === "update" ? (
                        "Update"
                    ) : (
                        "Create Form"
                    )}
                </button>
            </div>
        </div>
    );
}

export default QuestionActions;
