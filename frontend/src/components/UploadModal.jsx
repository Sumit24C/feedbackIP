import React, { useState } from "react";

function UploadModal({ isOpen, onClose, onUpload }) {
  const [file, setFile] = useState(null);

  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>

        <input
          type="file"
          accept=".xlsx,.xls"
          className="border p-2 w-full rounded"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <div className="flex justify-end mt-4 gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!file}
            onClick={() => onUpload(file)}
          >
            ➕ Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
