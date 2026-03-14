import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface SimulationData {
  clientName: string;
  clientEmail: string;
  results: {
    situationActuelle: {
      ca: number;
      charges: number;
      remunerationBrute: number;
      chargesSociales: number;
      impots: number;
      netCash: number;
    };
    situationOptimisee: {
      ca: number;
      charges: number;
      ik: number;
      mda: number;
      chargesSociales: number;
      impots: number;
      netCash: number;
    };
    gain: number;
    recommandations: string[];
    isZFRR?: boolean;
    isAFR?: boolean;
    isQPV?: boolean;
    isBER?: boolean;
  };
  closerName?: string;
}

const COLORS = {
  primary: '#F97316',
  secondary: '#FBBF24',
  green: '#22C55E',
  dark: '#0F172A',
  gray: '#64748B',
  lightGray: '#F1F5F9',
};

export function generateSimulationPDF(data: SimulationData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ═══════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════
  
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉCLIC ENTREPRENEURS', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Simulation d\'Optimisation Fiscale', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth / 2, 33, { align: 'center' });
  
  // ═══════════════════════════════════════════════
  // CLIENT INFO
  // ═══════════════════════════════════════════════
  
  let yPos = 50;
  
  doc.setFillColor(COLORS.lightGray);
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
  
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS CLIENT', 20, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client: ${data.clientName}`, 20, yPos + 16);
  doc.text(`Email: ${data.clientEmail}`, 20, yPos + 22);
  
  yPos += 35;
  
  // ═══════════════════════════════════════════════
  // RÉSULTAT PRINCIPAL
  // ═══════════════════════════════════════════════
  
  doc.setFillColor(COLORS.lightGray);
  doc.rect(15, yPos, pageWidth - 30, 50, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('RÉSULTAT DE L\'OPTIMISATION', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Situation actuelle:', 25, yPos + 23);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.results.situationActuelle.netCash.toLocaleString('fr-FR')} €`, pageWidth - 25, yPos + 23, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.text('Avec Méthode Déclic:', 25, yPos + 33);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.green);
  doc.text(`${data.results.situationOptimisee.netCash.toLocaleString('fr-FR')} €`, pageWidth - 25, yPos + 33, { align: 'right' });
  
  // GAIN
  doc.setFillColor(COLORS.secondary);
  doc.rect(15, yPos + 40, pageWidth - 30, 10, 'F');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(`GAIN ANNUEL: +${data.results.gain.toLocaleString('fr-FR')} €`, pageWidth / 2, yPos + 47, { align: 'center' });
  
  yPos += 60;
  
  // ═══════════════════════════════════════════════
  // TABLEAU COMPARATIF
  // ═══════════════════════════════════════════════
  
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPARATIF DÉTAILLÉ', 15, yPos);
  
  yPos += 5;
  
  (doc as any).autoTable({
    startY: yPos,
    head: [['', 'Situation actuelle', 'Méthode Déclic', 'Écart']],
    body: [
      [
        'Chiffre d\'affaires',
        `${data.results.situationActuelle.ca.toLocaleString('fr-FR')} €`,
        `${data.results.situationOptimisee.ca.toLocaleString('fr-FR')} €`,
        '-'
      ],
      [
        'Charges déductibles',
        `${data.results.situationActuelle.charges.toLocaleString('fr-FR')} €`,
        `${data.results.situationOptimisee.charges.toLocaleString('fr-FR')} €`,
        `+${(data.results.situationOptimisee.charges - data.results.situationActuelle.charges).toLocaleString('fr-FR')} €`
      ],
      [
        'dont IK remboursés',
        '0 €',
        `${data.results.situationOptimisee.ik.toLocaleString('fr-FR')} €`,
        `+${data.results.situationOptimisee.ik.toLocaleString('fr-FR')} €`
      ],
      [
        'dont MDA habitation',
        '0 €',
        `${data.results.situationOptimisee.mda.toLocaleString('fr-FR')} €`,
        `+${data.results.situationOptimisee.mda.toLocaleString('fr-FR')} €`
      ],
      [
        'Charges sociales',
        `${data.results.situationActuelle.chargesSociales.toLocaleString('fr-FR')} €`,
        `${data.results.situationOptimisee.chargesSociales.toLocaleString('fr-FR')} €`,
        `${(data.results.situationOptimisee.chargesSociales - data.results.situationActuelle.chargesSociales).toLocaleString('fr-FR')} €`
      ],
      [
        'Impôts',
        `${data.results.situationActuelle.impots.toLocaleString('fr-FR')} €`,
        `${data.results.situationOptimisee.impots.toLocaleString('fr-FR')} €`,
        `${(data.results.situationOptimisee.impots - data.results.situationActuelle.impots).toLocaleString('fr-FR')} €`
      ],
      [
        'NET CASH',
        `${data.results.situationActuelle.netCash.toLocaleString('fr-FR')} €`,
        `${data.results.situationOptimisee.netCash.toLocaleString('fr-FR')} €`,
        `+${data.results.gain.toLocaleString('fr-FR')} €`
      ],
    ],
    headStyles: { 
      fillColor: [249, 115, 22], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 10
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { fontStyle: 'bold', textColor: [22, 163, 74] }
    }
  });
  
  // ═══════════════════════════════════════════════
  // RECOMMANDATIONS
  // ═══════════════════════════════════════════════
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('NOS RECOMMANDATIONS', 15, yPos);
  
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  data.results.recommandations.forEach((reco, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    const lines = doc.splitTextToSize(`${idx + 1}. ${reco}`, pageWidth - 30);
    doc.text(lines, 15, yPos);
    yPos += lines.length * 5 + 3;
  });
  
  // ═══════════════════════════════════════════════
  // ZONES FISCALES
  // ═══════════════════════════════════════════════
  
  if (data.results.isZFRR || data.results.isAFR || data.results.isQPV || data.results.isBER) {
    yPos += 10;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(220, 252, 231);
    doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('🎯 ÉLIGIBILITÉ ZONES FISCALES AVANTAGEUSES', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    if (data.results.isZFRR) {
      doc.text('✓ ZFRR: Exonération fiscale jusqu\'à 50% pendant 5 ans', 20, yPos);
      yPos += 6;
    }
    if (data.results.isAFR) {
      doc.text('✓ AFR: Aides à la finalité régionale disponibles', 20, yPos);
      yPos += 6;
    }
    if (data.results.isQPV) {
      doc.text('✓ QPV: Exonérations fiscales et sociales (quartier prioritaire)', 20, yPos);
      yPos += 6;
    }
    if (data.results.isBER) {
      doc.text('✓ BER: Aides à l\'implantation (bassin d\'emploi à redynamiser)', 20, yPos);
    }
  }
  
  // ═══════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════
  
  const pageCount = (doc as any).internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Déclic Entrepreneurs - www.declic-entrepreneurs.fr - contact@declic-entrepreneurs.fr', pageWidth / 2, 285, { align: 'center' });
    doc.text('Ce document est une simulation indicative. Les chiffres exacts seront confirmés après audit complet.', pageWidth / 2, 290, { align: 'center' });
    
    if (data.closerName) {
      doc.text(`Préparé par: ${data.closerName}`, pageWidth / 2, 280, { align: 'center' });
    }
  }
  
  return doc;
}

export function downloadSimulationPDF(data: SimulationData) {
  const doc = generateSimulationPDF(data);
  doc.save(`Simulation_${data.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}