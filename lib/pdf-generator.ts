import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ClientData {
  firstName: string;
  lastName: string;
  company: string;
  pack: string;
}

interface RDVData {
  objectifs?: string;
  notes?: string;
  next_steps?: string;
  [key: string]: string | undefined;
}

const COLORS = {
  primary: '#F97316', // Orange Déclic
  secondary: '#FBBF24', // Gold
  dark: '#0F172A',
  gray: '#64748B',
  lightGray: '#F1F5F9',
};

export function generateRDVPDF(
  clientData: ClientData,
  rdvNumber: number,
  rdvData: RDVData,
  expertName: string = 'Expert Déclic Entrepreneurs'
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // ═══════════════════════════════════════════════
  // HEADER - LOGO + TITRE
  // ═══════════════════════════════════════════════
  
  // Rectangle orange en haut
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Titre blanc
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉCLIC ENTREPRENEURS', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Compte-rendu RDV Expert #${rdvNumber}`, pageWidth / 2, 25, { align: 'center' });

  // Date
  doc.setFontSize(9);
  const today = new Date().toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(today, pageWidth / 2, 33, { align: 'center' });

  yPos = 50;

  // ═══════════════════════════════════════════════
  // SECTION CLIENT
  // ═══════════════════════════════════════════════
  
  doc.setFillColor(COLORS.lightGray);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

  doc.setTextColor(COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS CLIENT', 20, yPos + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const clientInfo = [
    `Nom : ${clientData.firstName} ${clientData.lastName}`,
    `Entreprise : ${clientData.company || 'Non renseignée'}`,
    `Pack : ${clientData.pack.toUpperCase()}`,
  ];

  clientInfo.forEach((info, idx) => {
    doc.text(info, 20, yPos + 18 + (idx * 6));
  });

  yPos += 45;

  // ═══════════════════════════════════════════════
  // SECTION OBJECTIFS
  // ═══════════════════════════════════════════════
  
  if (rdvData.objectifs) {
    doc.setFillColor(COLORS.primary);
    doc.rect(15, yPos, 4, 8, 'F');
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OBJECTIFS DU RENDEZ-VOUS', 22, yPos + 6);

    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    
    const objectifLines = doc.splitTextToSize(rdvData.objectifs, pageWidth - 40);
    doc.text(objectifLines, 20, yPos);
    yPos += objectifLines.length * 5 + 10;
  }

  // ═══════════════════════════════════════════════
  // SECTION NOTES
  // ═══════════════════════════════════════════════
  
  if (rdvData.notes) {
    // Vérifier si on a assez de place, sinon nouvelle page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.primary);
    doc.rect(15, yPos, 4, 8, 'F');
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES & POINTS ABORDÉS', 22, yPos + 6);

    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    
    const notesLines = doc.splitTextToSize(rdvData.notes, pageWidth - 40);
    doc.text(notesLines, 20, yPos);
    yPos += notesLines.length * 5 + 10;
  }

  // ═══════════════════════════════════════════════
  // SECTION PROCHAINES ÉTAPES
  // ═══════════════════════════════════════════════
  
  if (rdvData.next_steps) {
    // Vérifier si on a assez de place, sinon nouvelle page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(COLORS.secondary);
    doc.rect(15, yPos, 4, 8, 'F');
    
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCHAINES ÉTAPES', 22, yPos + 6);

    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    
    const stepsLines = doc.splitTextToSize(rdvData.next_steps, pageWidth - 40);
    doc.text(stepsLines, 20, yPos);
    yPos += stepsLines.length * 5 + 10;
  }

  // ═══════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════
  
  const footerY = pageHeight - 20;
  
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, pageWidth - 15, footerY);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.text('Déclic Entrepreneurs - Accompagnement Expert', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`Expert : ${expertName}`, pageWidth / 2, footerY + 10, { align: 'center' });
  doc.text('www.declic-entrepreneurs.fr', pageWidth / 2, footerY + 15, { align: 'center' });

  return doc;
}

export function downloadPDF(doc: jsPDF, fileName: string) {
  doc.save(fileName);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

export function getPDFBase64(doc: jsPDF): string {
  return doc.output('dataurlstring');
}