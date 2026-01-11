import { useForm } from "react-hook-form";
import { ENTITY_CONFIG } from "@/utils/entityFormConfig";
import { useState } from "react";

function EntityFormModal({
  entity,
  onClose,
  onCreate,
  onUpload,
}) {
  const config = ENTITY_CONFIG[entity];
  const [uploadMode, setUploadMode] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const submitHandler = (data) => {
    onCreate(data);
    reset();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[420px]">
        <h3 className="text-lg font-semibold mb-4">
          {uploadMode ? config.uploadTitle : config.title}
        </h3>

        {!uploadMode ? (
          <form
            onSubmit={handleSubmit(submitHandler)}
            className="space-y-3"
          >
            {config.fields.map((field) => {
              if (field.type === "select") {
                return (
                  <select
                    key={field.name}
                    {...register(field.name, field.rules)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                );
              }

              return (
                <input
                  key={field.name}
                  type={field.type}
                  placeholder={field.label}
                  {...register(field.name, field.rules)}
                  className="w-full border rounded px-3 py-2"
                />
              );
            })}

            <button
              type="button"
              onClick={() => setUploadMode(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Upload using Excel instead
            </button>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                Add
              </button>
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
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Back to single entry
            </button>

            <div className="flex justify-end mt-5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EntityFormModal;
