import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ═══════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════
  
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DECLIC ENTREPRENEURS', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Simulation Optimisation Fiscale', pageWidth / 2, 25, { align: 'center' });
  
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
  doc.text('RESULTAT OPTIMISATION', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Situation actuelle:', 25, yPos + 23);
  doc.setFont('helvetica', 'bold');
  const netActuel = Math.round(data.results.situationActuelle.netCash).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  doc.text(`${netActuel} EUR`, pageWidth - 25, yPos + 23, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.text('Avec Declic:', 25, yPos + 33);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.green);
  const netOptimise = Math.round(data.results.situationOptimisee.netCash).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  doc.text(`${netOptimise} EUR`, pageWidth - 25, yPos + 33, { align: 'right' });
  
  // GAIN
  doc.setFillColor(COLORS.secondary);
  doc.rect(15, yPos + 40, pageWidth - 30, 10, 'F');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.dark);
  doc.setFont('helvetica', 'bold');
  const gain = Math.round(data.results.gain).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  doc.text(`GAIN ANNUEL: +${gain} EUR`, pageWidth / 2, yPos + 47, { align: 'center' });
  
  yPos += 60;
  
  // ═══════════════════════════════════════════════
  // TABLEAU COMPARATIF
  // ═══════════════════════════════════════════════
  
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPARATIF DETAILLE', 15, yPos);
  
  yPos += 5;
  
  const formatNumber = (num: number) => Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' EUR';
  
  autoTable(doc, {
    startY: yPos,
    head: [['Ligne', 'Actuel', 'Declic', 'Ecart']],
    body: [
      ['CA', formatNumber(data.results.situationActuelle.ca), formatNumber(data.results.situationOptimisee.ca), '-'],
      ['Charges', formatNumber(data.results.situationActuelle.charges), formatNumber(data.results.situationOptimisee.charges), '+' + formatNumber(data.results.situationOptimisee.charges - data.results.situationActuelle.charges)],
      ['IK', '0 EUR', formatNumber(data.results.situationOptimisee.ik), '+' + formatNumber(data.results.situationOptimisee.ik)],
      ['MDA', '0 EUR', formatNumber(data.results.situationOptimisee.mda), '+' + formatNumber(data.results.situationOptimisee.mda)],
      ['Charges sociales', formatNumber(data.results.situationActuelle.chargesSociales), formatNumber(data.results.situationOptimisee.chargesSociales), formatNumber(data.results.situationOptimisee.chargesSociales - data.results.situationActuelle.chargesSociales)],
      ['Impots', formatNumber(data.results.situationActuelle.impots), formatNumber(data.results.situationOptimisee.impots), formatNumber(data.results.situationOptimisee.impots - data.results.situationActuelle.impots)],
      ['NET CASH', formatNumber(data.results.situationActuelle.netCash), formatNumber(data.results.situationOptimisee.netCash), '+' + formatNumber(data.results.gain)],
    ],
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { fontStyle: 'bold', textColor: [22, 163, 74], cellWidth: 40 }
    }
  });
  
  // ═══════════════════════════════════════════════
  // RECOMMANDATIONS
  // ═══════════════════════════════════════════════
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.dark);
  doc.text('RECOMMANDATIONS', 15, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  data.results.recommandations.forEach((reco, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    // Simplifier les emojis
    const simplifiedReco = reco
      .replace(/🚗/g, '- IK:')
      .replace(/🏠/g, '- MDA:')
      .replace(/💰/g, '- COMPTA:')
      .replace(/🏢/g, '- STRUCTURE:')
      .replace(/📊/g, '- STRATEGIE:')
      .replace(/⚠️/g, '- ATTENTION:')
      .replace(/📍/g, '- ZONE:');
    
    const lines = doc.splitTextToSize(`${idx + 1}. ${simplifiedReco}`, pageWidth - 30);
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
    doc.text('ZONES FISCALES AVANTAGEUSES', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    if (data.results.isZFRR) {
      doc.text('- ZFRR: Exoneration fiscale 50% pendant 5 ans', 20, yPos);
      yPos += 6;
    }
    if (data.results.isAFR) {
      doc.text('- AFR: Aides investissements productifs (20%)', 20, yPos);
      yPos += 6;
    }
    if (data.results.isQPV) {
      doc.text('- QPV: Exonerations fiscales quartier prioritaire', 20, yPos);
      yPos += 6;
    }
    if (data.results.isBER) {
      doc.text('- BER: Aides implantation bassin emploi', 20, yPos);
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
    doc.setFont('helvetica', 'normal');
    doc.text('Declic Entrepreneurs - www.declic-entrepreneurs.fr', pageWidth / 2, 285, { align: 'center' });
    doc.text('Simulation indicative - Chiffres confirmes apres audit', pageWidth / 2, 290, { align: 'center' });
    
    if (data.closerName) {
      doc.text(`Par: ${data.closerName}`, pageWidth / 2, 280, { align: 'center' });
    }
  }
  
  return doc;
}

export function downloadSimulationPDF(data: SimulationData) {
  const doc = generateSimulationPDF(data);
  const cleanName = data.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Simulation_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}