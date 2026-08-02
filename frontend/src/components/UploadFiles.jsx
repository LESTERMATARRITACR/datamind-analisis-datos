import React, { useState } from "react";

export function UploadFiles({ onAnalisisCompleto, setCargando }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert("Selecciona al menos un archivo CSV o Excel.");
      return;
    }

    setCargando(true);

    try {
      const data = await import("../services/api").then((m) =>
        m.enviarArchivosParaAnalisis(selectedFiles)
      );

      onAnalisisCompleto(data);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="upload-area">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">📂</div>
        <h3>Selecciona uno o varios archivos</h3>
        <p>Formatos soportados: CSV, XLS y XLSX</p>
        
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            {Array.from(selectedFiles).map((file) => (
              <div key={file.name} className="file-item">
                📄 {file.name}
              </div>
            ))}
          </div>
        )}
      </label>
      
      <button type="submit" style={{ marginTop: '20px' }}>
        Analizar Datos
      </button>
    </form>
  );
}