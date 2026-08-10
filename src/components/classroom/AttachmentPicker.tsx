"use client";

import { useState } from "react";
import type { Attachment } from "@/src/types";

function AttachmentPicker({
  attachments,
  onChange,
}: {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "No se pudo subir el archivo");
        return;
      }
      onChange([...attachments, data]);
    } catch (err) {
      console.error("Error uploading attachment:", err);
      setError("Error de conexión al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="attachment-picker">
      <label className="attachment-input-label">
        📎 {uploading ? "Subiendo..." : "Adjuntar archivo"}
        <input
          type="file"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </label>
      {attachments.length > 0 && (
        <ul className="attachment-list">
          {attachments.map((attachment, index) => (
            <li key={`${attachment.url}-${index}`}>
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                🔗 {attachment.name}
              </a>
              <button
                type="button"
                className="action-btn red small"
                onClick={() => onChange(attachments.filter((_, i) => i !== index))}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default AttachmentPicker;
