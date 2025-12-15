import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Convierte una imagen URL a base64
 */
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo imagen:', error);
    return null;
  }
};

/**
 * Genera PDF de cotización con todos los detalles e imágenes
 */
export const generarPDFCotizacion = async (orden, archivos = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ============================================================================
  // ENCABEZADO
  // ============================================================================
  
  // Logo y título (puedes agregar tu logo aquí)
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Azul #3b82f6
  doc.setFont('helvetica', 'bold');
  doc.text('AUTO SMART', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Inteligente de Gestión para Talleres Automotrices', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // Línea separadora
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  
  yPosition += 10;

  // ============================================================================
  // INFORMACIÓN DE COTIZACIÓN
  // ============================================================================
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 15, yPosition);
  
  yPosition += 10;
  
  // Número de cotización y fecha
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(`N° ${orden.numero_cotizacion || 'N/A'}`, 15, yPosition);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const fechaEmision = new Date().toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Fecha: ${fechaEmision}`, pageWidth - 15, yPosition, { align: 'right' });
  
  yPosition += 8;
  
  // Estado
  doc.setFontSize(10);
  const estadoColors = {
    'pendiente': [254, 243, 199],
    'enviada': [219, 234, 254],
    'aprobada': [209, 250, 229],
    'rechazada': [254, 226, 226]
  };
  
  const estadoColor = estadoColors[orden.estado_cotizacion] || [240, 240, 240];
  doc.setFillColor(...estadoColor);
  doc.roundedRect(15, yPosition - 4, 40, 7, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estado: ${orden.estado_cotizacion?.toUpperCase() || 'PENDIENTE'}`, 17, yPosition);
  
  yPosition += 12;

  // ============================================================================
  // DATOS DEL CLIENTE
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', 15, yPosition);
  
  yPosition += 7;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const datosCliente = [
    [`Cliente:`, orden.nombre_cliente || 'N/A'],
    [`Teléfono:`, orden.telefono_cliente || 'N/A'],
    [`Email:`, orden.email_cliente || orden.cliente?.email || 'N/A'],
    [`N° Orden:`, orden.orden_numero || 'N/A']
  ];
  
  datosCliente.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 50, yPosition);
    yPosition += 5;
  });
  
  yPosition += 5;

  // ============================================================================
  // DATOS DEL VEHÍCULO O PIEZA
  // ============================================================================
  
  if (orden.tipo_orden === 'vehiculo' && orden.vehiculo) {
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL VEHÍCULO', 15, yPosition);
    
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const datosVehiculo = [
      [`Marca:`, orden.vehiculo.marca || 'N/A'],
      [`Modelo:`, orden.vehiculo.modelo || 'N/A'],
      [`Placa:`, orden.vehiculo.placa || 'N/A'],
      [`Año:`, orden.vehiculo.año || 'N/A']
    ];
    
    datosVehiculo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 50, yPosition);
      yPosition += 5;
    });
    
    yPosition += 5;
  } else if (orden.tipo_orden === 'laboratorio') {
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE LA PIEZA', 15, yPosition);
    
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const datosPieza = [
      [`Tipo de Pieza:`, orden.tipo_pieza || 'N/A'],
      [`Marca:`, orden.marca_pieza || 'N/A'],
      [`Modelo Origen:`, orden.modelo_origen || 'N/A'],
      [`N° Parte:`, orden.numero_parte || 'N/A']
    ];
    
    datosPieza.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 50, yPosition);
      yPosition += 5;
    });
    
    yPosition += 5;
  }

  // ============================================================================
  // DETALLE DE ITEMS
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE TRABAJOS Y REPUESTOS', 15, yPosition);
  
  yPosition += 5;
  
  // Tabla de items
  const items = orden.items_cotizacion || [];
  const tableData = items.map(item => [
    item.descripcion,
    item.cantidad.toString(),
    `Bs. ${parseFloat(item.precio_unitario).toFixed(2)}`,
    `Bs. ${parseFloat(item.subtotal).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });
  
  yPosition = doc.lastAutoTable.finalY + 10;

  // ============================================================================
  // RESUMEN DE COSTOS
  // ============================================================================
  
  const subtotal = parseFloat(orden.subtotal) || 0;
  const manoDeObra = parseFloat(orden.mano_de_obra) || 0;
  const total = parseFloat(orden.costo_estimado) || 0;
  
  const xLabels = pageWidth - 80;
  const xValues = pageWidth - 35;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal Items:', xLabels, yPosition, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Bs. ${subtotal.toFixed(2)}`, xValues, yPosition, { align: 'right' });
  
  yPosition += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Mano de Obra:', xLabels, yPosition, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Bs. ${manoDeObra.toFixed(2)}`, xValues, yPosition, { align: 'right' });
  
  yPosition += 8;
  
  // Línea separadora
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 80, yPosition - 2, pageWidth - 15, yPosition - 2);
  
  yPosition += 2;
  
  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('TOTAL:', xLabels, yPosition, { align: 'right' });
  doc.text(`Bs. ${total.toFixed(2)}`, xValues, yPosition, { align: 'right' });
  
  yPosition += 12;

  // ============================================================================
  // VALIDEZ DE LA COTIZACIÓN
  // ============================================================================
  
  if (orden.valida_hasta) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    const fechaValidez = new Date(orden.valida_hasta).toLocaleDateString('es-BO');
    doc.text(`Válida hasta: ${fechaValidez}`, 15, yPosition);
    yPosition += 10;
  }

  // ============================================================================
  // IMÁGENES ADJUNTAS
  // ============================================================================
  
  if (archivos && archivos.length > 0) {
    // Filtrar solo imágenes
    const imagenes = archivos.filter(archivo => 
      archivo.tipo_archivo?.startsWith('image/') || 
      archivo.nombre_archivo?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    
    if (imagenes.length > 0) {
      // Nueva página para imágenes
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.text('IMÁGENES DEL TRABAJO', 15, yPosition);
      
      yPosition += 10;
      
      // Mostrar imágenes en grid 2x2
      const imgWidth = 85;
      const imgHeight = 65;
      const marginX = 15;
      const marginY = 10;
      let imgX = marginX;
      let imgY = yPosition;
      let imgCount = 0;
      
      for (const imagen of imagenes) {
        try {
          const base64Image = await urlToBase64(imagen.url_archivo);
          
          if (base64Image) {
            // Agregar imagen
            doc.addImage(base64Image, 'JPEG', imgX, imgY, imgWidth, imgHeight);
            
            // Agregar nombre debajo de la imagen
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            const nombreCorto = imagen.nombre_archivo?.length > 30 
              ? imagen.nombre_archivo.substring(0, 27) + '...'
              : imagen.nombre_archivo;
            doc.text(nombreCorto || 'Imagen', imgX + imgWidth/2, imgY + imgHeight + 5, { align: 'center' });
            
            imgCount++;
            
            // Posicionar siguiente imagen
            if (imgCount % 2 === 0) {
              // Nueva fila
              imgX = marginX;
              imgY += imgHeight + marginY + 5;
              
              // Si no cabe en la página, crear nueva página
              if (imgY + imgHeight > pageHeight - 20) {
                doc.addPage();
                imgY = 20;
              }
            } else {
              // Siguiente columna
              imgX = pageWidth - marginX - imgWidth;
            }
          }
        } catch (error) {
          console.error('Error agregando imagen al PDF:', error);
        }
      }
    }
  }

  // ============================================================================
  // TÉRMINOS Y CONDICIONES (última página)
  // ============================================================================
  
  if (orden.terminos_condiciones) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS Y CONDICIONES', 15, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const lineas = doc.splitTextToSize(orden.terminos_condiciones, pageWidth - 30);
    doc.text(lineas, 15, yPosition);
  }

  // ============================================================================
  // PIE DE PÁGINA EN TODAS LAS PÁGINAS
  // ============================================================================
  
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    
    // Número de página
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Información del taller
    doc.text(
      'Auto Smart - Sistema Inteligente de Gestión | Tel: +591 67522948',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // ============================================================================
  // GUARDAR PDF
  // ============================================================================
  
  const nombreArchivo = `Cotizacion_${orden.numero_cotizacion || orden.orden_numero}_${new Date().getTime()}.pdf`;
  doc.save(nombreArchivo);
  
  return nombreArchivo;
};