// next/og (Satori) no tiene acceso a las fuentes cargadas por next/font en
// las páginas normales — hay que darle el archivo de la fuente directo.
// Patrón estándar: pedirle a Google Fonts el CSS, sacar la URL del archivo
// real, y descargarlo.
export async function loadGoogleFont(
  font: string,
  weight: number
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@${weight}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);

  if (!match) {
    throw new Error(`No se pudo encontrar el archivo de la fuente ${font}.`);
  }

  const response = await fetch(match[1]);
  if (!response.ok) {
    throw new Error(`No se pudo descargar la fuente ${font}.`);
  }

  return response.arrayBuffer();
}
