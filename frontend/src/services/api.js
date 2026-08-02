export const enviarArchivosParaAnalisis = async (files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  const response = await fetch("http://127.0.0.1:5000/api/analizar", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Error en el servidor");
  return await response.json();
};