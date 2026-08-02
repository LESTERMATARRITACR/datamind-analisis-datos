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

      <div className="upload-area">

        <input
          id="file-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />


        <label
          htmlFor="file-upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 25px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "15px",
            transition: "0.3s",
            boxShadow: "0 8px 20px rgba(124,58,237,.25)"
          }}
        >
          📂 Seleccionar archivos
        </label>


        <p style={{
          marginTop: "15px",
          color: "#94a3b8",
          fontSize: "14px"
        }}>
          Formatos soportados: CSV, XLS y XLSX
        </p>


        {selectedFiles.length > 0 && (
          <div className="selected-files">

            {Array.from(selectedFiles).map((file) => (

              <div 
                key={file.name} 
                className="file-item"
              >
                📄 {file.name}
              </div>

            ))}

          </div>
        )}

      </div>


      <button 
        type="submit"
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          background: "#22c55e",
          color: "white",
          fontSize: "16px",
          fontWeight: "700",
          cursor: "pointer",
          transition: "0.3s"
        }}
      >
        🚀 Analizar Datos
      </button>


    </form>
  );
}