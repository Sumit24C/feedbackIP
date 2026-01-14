import { useForm, useFieldArray } from "react-hook-form";
import { ENTITY_CONFIG } from "@/utils/entityFormConfig";
import { useMemo, useState } from "react";
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
  const isElectives = entity === "electives";

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

  const selectedSubjectId = watch("subject_id");
  const selectedSubject = useMemo(() => {
    const subject = meta?.subjects?.find((s) => s._id === selectedSubjectId);
    return subject
  }, [selectedSubjectId, meta?.subjects]);
  const isElectiveSubject = selectedSubject?.type === "elective";
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

    if (isElectives) {
      const { facultySubjectId, email } = data;

      if (!facultySubjectId) {
        return toast.error("Please select an elective");
      }

      onCreate({
        facultySubjectId,
        email,
      });

      reset();
      return;
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[480px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {uploadMode ? config.uploadTitle : config.title}
        </h3>

        {!uploadMode ? (
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">

            {isFacultySubject && (
              <>
                <select
                  {...register("faculty_id", { required: true })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select Faculty</option>
                  {meta?.faculties.map((f) => (
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
                  {meta?.subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {!isElectiveSubject && (
                  <select
                    {...register("class_id")}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Class</option>
                    {meta?.classes.map((c) => (
                      c.year === selectedSubject?.year &&
                      <option key={c._id} value={c._id}>
                        {c.year} - {c.name}
                      </option>
                    ))}
                  </select>
                )}

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
            )}
            {isElectives && (
              <select
                {...register("facultySubjectId", { required: true })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select Elective</option>
                {meta?.map((fs) => (
                  <option key={fs._id} value={fs._id}>
                    {fs.subject?.name} – {fs.faculty?.user_id?.fullname}
                  </option>
                ))}
              </select>
            )}
            {!isFacultySubject && !isElectives &&
              config.fields.map((field) =>
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

              )
            }
            {entity === "classes" && config?.batches && (
              <div className="space-y-4 border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Batches</h4>
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
                    + Add Batch
                  </button>
                </div>

                {batchArray.fields.map((batch, index) => (
                  <div
                    key={batch.id}
                    className="grid grid-cols-2 gap-3 items-end border p-3 rounded-md bg-white"
                  >
                    {config.batches.fields.map((field) =>
                      field.type === "select" ? (
                        <select
                          key={field.name}
                          {...register(
                            `batches.${index}.${field.name}`,
                            field.rules
                          )}
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
                          {...register(
                            `batches.${index}.${field.name}`,
                            field.rules
                          )}
                          className="w-full border rounded px-3 py-2 text-sm"
                        />
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => batchArray.remove(index)}
                      className="col-span-2 text-red-600 text-sm hover:underline"
                    >
                      Remove batch
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setUploadMode(true)}
                className="text-sm text-blue-600"
              >
                Upload File
              </button>

              <div className="flex gap-2">
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
            {isElectives && (
              <select
                {...register("facultySubjectId", { required: true })}
                className="w-full border rounded px-3 py-2 text-sm mb-3"
              >
                <option value="">Select Elective</option>
                {meta?.map((fs) => (
                  <option key={fs._id} value={fs._id}>
                    {fs.subject?.name} – {fs.faculty?.user_id?.fullname}
                  </option>
                ))}
              </select>
            )}

            <input
              type="file"
              accept={config.uploadAccept}
              className="border p-2 w-full rounded"
              onChange={(e) =>
                isElectives
                  ? onUpload(watch("facultySubjectId"), e.target.files[0])
                  : onUpload(e.target.files[0])
              }
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
