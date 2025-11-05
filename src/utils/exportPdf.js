// Utilidad para exportar una sección HTML a PDF manteniendo estilos y colores
// Requiere dependencias: jspdf y html2canvas
// npm i jspdf html2canvas

export async function exportElementToPdf(el, { filename = 'estadisticas.pdf', background } = {}) {
  if (!el) throw new Error('Elemento no encontrado para exportar');
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const bg = background || getComputedStyle(document.body).backgroundColor || '#ffffff';

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: bg,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Ajustar imagen a página manteniendo relación
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const renderWidth = canvas.width * ratio;
  const renderHeight = canvas.height * ratio;
  const marginX = (pageWidth - renderWidth) / 2;
  const topPadding = 12;

  if (renderHeight <= pageHeight) {
    pdf.addImage(imgData, 'PNG', marginX, topPadding, renderWidth, renderHeight);
  } else {
    // Particionar en múltiples páginas
    const sliceHeight = Math.floor((pageHeight - topPadding * 2) / ratio);
    let position = 0;
    let page = 0;
    while (position < canvas.height) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeight, canvas.height - position);
      const sctx = sliceCanvas.getContext('2d');
      sctx.drawImage(
        canvas,
        0,
        position,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height
      );
      const sliceImg = sliceCanvas.toDataURL('image/png');
      if (page > 0) pdf.addPage();
      pdf.addImage(
        sliceImg,
        'PNG',
        marginX,
        topPadding,
        renderWidth,
        sliceCanvas.height * ratio
      );
      position += sliceHeight;
      page += 1;
    }
  }

  pdf.save(filename);
}

