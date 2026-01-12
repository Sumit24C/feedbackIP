import { useForm, useFieldArray } from "react-hook-form";
import { ENTITY_CONFIG } from "@/utils/entityFormConfig";
import { useState } from "react";
import { toast } from "sonner";
import { validateBatches } from "@/utils/validateBatches";

function EntityFormModal({
  entity,
  meta,
  metaLoading,
  onClose,
  onCreate,
  onUpload,
}) {
  const config = ENTITY_CONFIG[entity];
  const [uploadMode, setUploadMode] = useState(false);
  const isFacultySubject = entity === "facultySubjects";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
  } = useForm(
    entity === "classes"
      ? {
        defaultValues: {
          batches: [
            Object.fromEntries(
              config.batches.fields.map((f) => [f.name, ""])
            ),
          ],
        },
      }
      : {}
  );

  const formType = watch("formType");

  const batchArray =
    config?.batches &&
    useFieldArray({
      control,
      name: "batches",
    });

  const submitHandler = (data) => {
    if (entity === "classes") {
      const payload = {
        ...data,
        batches: data.batches.map((b) => ({
          code: b.code,
          type: b.type,
          rollRange: {
            from: Number(b.from),
            to: Number(b.to),
          },
        })),
      };

      const error = validateBatches(payload.batches, payload.strength);
      if (error) return toast.error(error);

      onCreate(payload);
      reset();
      return;
    }

    if (isFacultySubject && data.formType === "theory") {
      data.batch_code = null;
    }

    onCreate(data);
    reset();
  };

  if (metaLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="w-10 h-10 border-4 border-gray-400 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const faculties = meta?.faculties || [];
  const subjects = meta?.subjects || [];
  const classes = meta?.classes || [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[480px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {uploadMode ? config.uploadTitle : config.title}
        </h3>

        {!uploadMode ? (
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
            {isFacultySubject ? (
              <>
                <select
                  {...register("faculty_id", { required: true })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.email}
                    </option>
                  ))}
                </select>

                <select
                  {...register("subject_id", { required: true })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  {...register("class_id", { required: true })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.year} - {c.name}
                    </option>
                  ))}
                </select>

                <select
                  {...register("formType", { required: true })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                  <option value="tutorial">Tutorial</option>
                </select>

                {formType !== "theory" && (
                  <input
                    {...register("batch_code", { required: true })}
                    placeholder="Batch Code (A1, B2...)"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                )}
              </>
            ) : (
              <>
                {config.fields.map((field) =>
                  field.type === "select" ? (
                    <select
                      key={field.name}
                      {...register(field.name, field.rules)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      key={field.name}
                      type={field.type}
                      placeholder={field.label}
                      {...register(field.name, field.rules)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  )
                )}
                {config.batches && (
                  <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">
                        {config.batches.label}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          batchArray.append(
                            Object.fromEntries(
                              config.batches.fields.map((f) => [f.name, ""])
                            )
                          )
                        }
                        className="text-sm text-blue-600"
                      >
                        + Add
                      </button>
                    </div>

                    {batchArray.fields.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-5 gap-2 items-center"
                      >
                        <input
                          {...register(`batches.${index}.code`, {
                            required: true,
                          })}
                          placeholder="A1"
                          className="border px-2 py-1 text-sm rounded"
                        />

                        <select
                          {...register(`batches.${index}.type`, {
                            required: true,
                          })}
                          className="border px-2 py-1 text-sm rounded"
                        >
                          <option value="">Type</option>
                          <option value="practical">Practical</option>
                          <option value="tutorial">Tutorial</option>
                        </select>

                        <input
                          type="number"
                          {...register(`batches.${index}.from`, {
                            required: true,
                          })}
                          placeholder="From"
                          className="border px-2 py-1 text-sm rounded"
                        />

                        <input
                          type="number"
                          {...register(`batches.${index}.to`, {
                            required: true,
                          })}
                          placeholder="To"
                          className="border px-2 py-1 text-sm rounded"
                        />

                        {batchArray.fields.length > config.batches.min ? (
                          <button
                            type="button"
                            onClick={() => batchArray.remove(index)}
                            className="text-xs text-red-600"
                          >
                            Remove
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}


            <div className="flex justify-between items-center gap-3 pt-4">
              <button
                className="mt-3 text-sm text-blue-600"
                onClick={() => setUploadMode(true)}
              >
                Upload File
              </button>
              <div className="flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <input
              type="file"
              accept={config.uploadAccept}
              className="border p-2 w-full rounded"
              onChange={(e) => onUpload(e.target.files[0])}
            />
            <button
              onClick={() => setUploadMode(false)}
              className="mt-3 text-sm text-blue-600"
            >
              Back to single entry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EntityFormModal;
