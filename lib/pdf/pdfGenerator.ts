// lib/pdf/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface CompanyData {
  company_name: string;
  company_type: string;
  capital_amount: number;
  activity_description: string;
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  country: string;
  president_first_name: string;
  president_last_name: string;
  president_birth_date: string;
  president_birth_place: string;
  president_nationality: string;
  president_address: string;
  duree: string;
  bank_name?: string;
  iban?: string;
  exercice_debut?: string;
  exercice_fin?: string;
  profession?: string;
  apports_numeraire?: number;
  apports_nature?: string;
  apports_nature_valorisation?: number;
}

interface Shareholder {
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  address: string;
  shares_count: number;
  shares_percentage: number;
  apport_numeraire?: number;
  is_president?: boolean;
  is_gerant?: boolean;
}

// ============================================
// HELPERS COMMUNS
// ============================================

function addHeader(doc: jsPDF, title: string, companyName: string) {
  // Logo placeholder (à remplacer par ton vrai logo)
  doc.setFillColor(230, 126, 34); // Orange Déclic
  doc.rect(15, 10, 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉCLIC', 17, 19);
  doc.text('ENTREPRENEURS', 17, 24);
  
  // Titre du document
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 30, { align: 'center' });
  
  // Nom de la société
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, 105, 40, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(230, 126, 34);
  doc.setLineWidth(0.5);
  doc.line(15, 45, 195, 45);
  
  return 55; // Position Y après le header
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Page ${pageNumber} sur ${totalPages}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(
    `Document généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`,
    105,
    pageHeight - 5,
    { align: 'center' }
  );
}

function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
}

function numberToWords(num: number): string {
  if (num === 0) return 'zéro';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  
  if (num < 10) return units[num];
  if (num >= 10 && num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return tens[ten] + (unit ? `-${units[unit]}` : '');
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    const centText = hundred === 1 ? 'cent' : `${units[hundred]} cent`;
    return rest ? `${centText} ${numberToWords(rest)}` : centText;
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    const milleText = thousand === 1 ? 'mille' : `${numberToWords(thousand)} mille`;
    return rest ? `${milleText} ${numberToWords(rest)}` : milleText;
  }
  
  return num.toString();
}

function addSignatureBlock(doc: jsPDF, y: number, signerLabel: string, width: number = 180) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(15, y, width, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(signerLabel, 20, y + 10);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('(Précédé de la mention "Lu et approuvé")', 20, y + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date : _______________', 20, y + 30);
  doc.text('Signature :', 120, y + 30);
  
  return y + 45;
}

// ============================================
// 1. STATUTS (SASU, EURL, SAS, SARL, SCI)
// ============================================

export function generateStatutsPDF(data: CompanyData, shareholders: Shareholder[] = []): jsPDF {
  const doc = new jsPDF();
  const companyType = data.company_type;
  const isUnipersonnel = ['SASU', 'EURL'].includes(companyType);
  const dirigeantTitre = ['SASU', 'SAS'].includes(companyType) ? 'Président' : 'Gérant';
  
  let y = addHeader(doc, `STATUTS ${companyType}`, data.company_name);
  
  // Page de garde
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.company_name, 105, y + 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(companyType, 105, y + 35, { align: 'center' });
  doc.text(`Capital social : ${data.capital_amount.toLocaleString('fr-FR')} €`, 105, y + 45, { align: 'center' });
  doc.text(`Siège social : ${data.city}`, 105, y + 55, { align: 'center' });
  
  doc.addPage();
  y = addHeader(doc, 'STATUTS', data.company_name);
  
  // TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE', 15, y);
  y += 12;
  
  // Article 1 - Forme
  doc.setFontSize(12);
  doc.text('ARTICLE 1 - FORME', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const formeText = isUnipersonnel 
    ? `Il est formé une société par actions simplifiée unipersonnelle (${companyType}) régie par les lois et règlements en vigueur, notamment les articles L.227-1 et suivants du Code de commerce, et par les présents statuts.`
    : `Il est formé une société régie par les lois et règlements en vigueur, et par les présents statuts.`;
  
  const formeSplit = doc.splitTextToSize(formeText, 180);
  doc.text(formeSplit, 15, y);
  y += formeSplit.length * 5 + 8;
  
  // Article 2 - Dénomination
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 2 - DÉNOMINATION SOCIALE', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`La dénomination sociale de la société est : ${data.company_name}`, 15, y);
  y += 10;
  
  // Article 3 - Objet
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 3 - OBJET SOCIAL', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const objetSplit = doc.splitTextToSize(`La société a pour objet : ${data.activity_description}`, 180);
  doc.text(objetSplit, 15, y);
  y += objetSplit.length * 5 + 8;
  
  // Article 4 - Siège social
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 4 - SIÈGE SOCIAL', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const siegeComplet = `${data.address_line1}${data.address_line2 ? ', ' + data.address_line2 : ''}, ${data.postal_code} ${data.city}, ${data.country}`;
  doc.text(`Le siège social est fixé à : ${siegeComplet}`, 15, y);
  y += 10;
  
  // Article 5 - Durée
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 5 - DURÉE', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`La durée de la société est fixée à ${data.duree} années, sauf dissolution anticipée ou prorogation.`, 15, y);
  y += 15;
  
  // TITRE II - CAPITAL SOCIAL
  if (y > 230) {
    doc.addPage();
    y = addHeader(doc, 'STATUTS', data.company_name);
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TITRE II - CAPITAL SOCIAL ET APPORTS', 15, y);
  y += 12;
  
  // Article 6 - Capital
  doc.setFontSize(12);
  doc.text('ARTICLE 6 - CAPITAL SOCIAL', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const capitalText = `Le capital social est fixé à la somme de ${data.capital_amount.toLocaleString('fr-FR')} euros (${numberToWords(data.capital_amount)} euros).`;
  doc.text(capitalText, 15, y);
  y += 10;
  
  // Répartition du capital
  if (!isUnipersonnel && shareholders.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ARTICLE 7 - RÉPARTITION DU CAPITAL', 15, y);
    y += 8;
    
    const tableData = shareholders.map(sh => [
      `${sh.first_name} ${sh.last_name}`,
      sh.shares_count.toString(),
      `${sh.shares_percentage.toFixed(2)}%`,
      `${(sh.apport_numeraire || 0).toLocaleString('fr-FR')} €`
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Associé', 'Parts', 'Pourcentage', 'Apport']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [230, 126, 34] }
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // TITRE III - DIRECTION
  if (y > 230) {
    doc.addPage();
    y = addHeader(doc, 'STATUTS', data.company_name);
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TITRE III - ${dirigeantTitre.toUpperCase()}`, 15, y);
  y += 12;
  
  doc.setFontSize(12);
  doc.text(`ARTICLE 8 - ${dirigeantTitre.toUpperCase()}`, 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const directionText = isUnipersonnel
    ? `La société est dirigée par un ${dirigeantTitre} unique.`
    : `La société est dirigée par un ${dirigeantTitre}.`;
  doc.text(directionText, 15, y);
  y += 10;
  
  // Désignation du dirigeant
  const dirigeantNom = `${data.president_first_name} ${data.president_last_name}`;
  doc.text(`Est nommé(e) en qualité de ${dirigeantTitre} pour une durée indéterminée :`, 15, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(dirigeantNom, 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Né(e) le ${formatDate(data.president_birth_date)} à ${data.president_birth_place}`, 15, y);
  y += 6;
  doc.text(`De nationalité ${data.president_nationality}`, 15, y);
  y += 6;
  doc.text(`Demeurant : ${data.president_address}`, 15, y);
  y += 15;
  
  // TITRE IV - EXERCICE SOCIAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TITRE IV - EXERCICE SOCIAL', 15, y);
  y += 12;
  
  doc.setFontSize(12);
  doc.text('ARTICLE 9 - EXERCICE SOCIAL', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const exerciceDebut = data.exercice_debut || '1er janvier';
  const exerciceFin = data.exercice_fin || '31 décembre';
  doc.text(`L'exercice social commence le ${exerciceDebut} et se termine le ${exerciceFin} de chaque année.`, 15, y);
  y += 15;
  
  // Signatures
  if (y > 200) {
    doc.addPage();
    y = addHeader(doc, 'STATUTS', data.company_name);
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 10;
  
  doc.text('Fait en autant d\'exemplaires que de parties, dont un pour les formalités.', 15, y);
  y += 15;
  
  if (isUnipersonnel) {
    addSignatureBlock(doc, y, `L'Associé Unique et ${dirigeantTitre}`);
  } else {
    addSignatureBlock(doc, y, `Les Associés et le ${dirigeantTitre}`);
  }
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 2. PV DE DÉCISION UNIQUE (SASU/EURL)
// ============================================

export function generatePVDecisionUnique(data: CompanyData): jsPDF {
  const doc = new jsPDF();
  const dirigeantTitre = data.company_type === 'SASU' ? 'Président' : 'Gérant';
  
  let y = addHeader(doc, 'PROCÈS-VERBAL DE DÉCISION UNIQUE', data.company_name);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`De l'associé unique de la société ${data.company_name}`, 105, y, { align: 'center' });
  y += 15;
  
  // Identité de l'associé
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICATION DE L\'ASSOCIÉ UNIQUE', 15, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom : ${data.president_first_name} ${data.president_last_name}`, 15, y);
  y += 6;
  doc.text(`Né(e) le : ${formatDate(data.president_birth_date)} à ${data.president_birth_place}`, 15, y);
  y += 6;
  doc.text(`Nationalité : ${data.president_nationality}`, 15, y);
  y += 6;
  doc.text(`Domicile : ${data.president_address}`, 15, y);
  y += 15;
  
  // Décisions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉCISIONS PRISES', 15, y);
  y += 10;
  
  // Première décision - Approbation des statuts
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PREMIÈRE DÉCISION - Approbation des statuts', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const texte1 = `L'associé unique approuve le projet de statuts de la société ${data.company_name} qui lui a été soumis.`;
  const split1 = doc.splitTextToSize(texte1, 180);
  doc.text(split1, 15, y);
  y += split1.length * 5 + 10;
  
  // Deuxième décision - Nomination du dirigeant
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`DEUXIÈME DÉCISION - Nomination du ${dirigeantTitre}`, 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const texte2 = `L'associé unique nomme en qualité de ${dirigeantTitre} de la société, pour une durée indéterminée : ${data.president_first_name} ${data.president_last_name}, né(e) le ${formatDate(data.president_birth_date)} à ${data.president_birth_place}, demeurant ${data.president_address}.`;
  const split2 = doc.splitTextToSize(texte2, 180);
  doc.text(split2, 15, y);
  y += split2.length * 5 + 10;
  
  // Troisième décision - Siège social
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TROISIÈME DÉCISION - Siège social', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const siegeComplet = `${data.address_line1}${data.address_line2 ? ', ' + data.address_line2 : ''}, ${data.postal_code} ${data.city}`;
  doc.text(`L'associé unique fixe le siège social au : ${siegeComplet}`, 15, y);
  y += 10;
  
  // Quatrième décision - Dépôt du capital
  if (y > 200) {
    doc.addPage();
    y = addHeader(doc, 'PV DE DÉCISION UNIQUE', data.company_name);
  }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('QUATRIÈME DÉCISION - Dépôt du capital social', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const texte4 = `L'associé unique constate que le capital social d'un montant de ${data.capital_amount.toLocaleString('fr-FR')} euros a été intégralement souscrit et libéré${data.bank_name ? ` auprès de ${data.bank_name}` : ''}.`;
  const split4 = doc.splitTextToSize(texte4, 180);
  doc.text(split4, 15, y);
  y += split4.length * 5 + 10;
  
  // Cinquième décision - Pouvoirs
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CINQUIÈME DÉCISION - Pouvoirs pour formalités', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const texte5 = `L'associé unique confère tous pouvoirs au ${dirigeantTitre} pour effectuer toutes formalités de publicité et de dépôt nécessaires à l'immatriculation de la société.`;
  const split5 = doc.splitTextToSize(texte5, 180);
  doc.text(split5, 15, y);
  y += split5.length * 5 + 20;
  
  // Date et signatures
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, 'L\'Associé Unique');
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 3. PV ASSEMBLÉE GÉNÉRALE CONSTITUTIVE (SAS/SARL)
// ============================================

export function generatePVAGConstitutive(data: CompanyData, shareholders: Shareholder[]): jsPDF {
  const doc = new jsPDF();
  const dirigeantTitre = ['SAS', 'SELAS'].includes(data.company_type) ? 'Président' : 'Gérant';
  
  let y = addHeader(doc, 'PROCÈS-VERBAL D\'ASSEMBLÉE GÉNÉRALE CONSTITUTIVE', data.company_name);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`De la société ${data.company_name}`, 105, y, { align: 'center' });
  y += 15;
  
  // Date et lieu
  doc.setFontSize(10);
  doc.text(`Le ${formatDate(new Date())}`, 15, y);
  y += 6;
  doc.text(`À ${data.city}`, 15, y);
  y += 15;
  
  // Liste des associés présents
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSOCIÉS PRÉSENTS', 15, y);
  y += 10;
  
  shareholders.forEach(sh => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• ${sh.first_name} ${sh.last_name}`, 15, y);
    y += 5;
    doc.text(`  ${sh.shares_count} parts (${sh.shares_percentage.toFixed(2)}%)`, 20, y);
    y += 8;
  });
  
  y += 5;
  
  // Résolutions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSOLUTIONS ADOPTÉES À L\'UNANIMITÉ', 15, y);
  y += 10;
  
  // Première résolution
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PREMIÈRE RÉSOLUTION - Approbation des statuts', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('L\'assemblée approuve les statuts de la société tels qu\'ils lui ont été présentés.', 15, y);
  y += 10;
  
  // Deuxième résolution
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`DEUXIÈME RÉSOLUTION - Nomination du ${dirigeantTitre}`, 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const president = shareholders.find(sh => sh.is_president || sh.is_gerant) || shareholders[0];
  const texte2 = `L'assemblée nomme en qualité de ${dirigeantTitre} : ${president.first_name} ${president.last_name}, pour une durée indéterminée.`;
  const split2 = doc.splitTextToSize(texte2, 180);
  doc.text(split2, 15, y);
  y += split2.length * 5 + 10;
  
  if (y > 230) {
    doc.addPage();
    y = addHeader(doc, 'PV AG CONSTITUTIVE', data.company_name);
  }
  
  // Troisième résolution
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TROISIÈME RÉSOLUTION - Constatation de la libération du capital', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const texte3 = `L'assemblée constate que le capital social de ${data.capital_amount.toLocaleString('fr-FR')} euros a été intégralement souscrit et libéré.`;
  doc.text(texte3, 15, y);
  y += 10;
  
  // Quatrième résolution
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('QUATRIÈME RÉSOLUTION - Pouvoirs pour formalités', 15, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`L'assemblée confère tous pouvoirs au ${dirigeantTitre} pour effectuer les formalités d'immatriculation.`, 15, y);
  y += 20;
  
  // Signatures
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, 'Les Associés');
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 4. ATTESTATION DE DOMICILIATION
// ============================================

export function generateAttestationDomiciliation(data: CompanyData): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'ATTESTATION DE DOMICILIATION', data.company_name);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const texte = `Je soussigné(e), ${data.president_first_name} ${data.president_last_name}, né(e) le ${formatDate(data.president_birth_date)} à ${data.president_birth_place}, de nationalité ${data.president_nationality}, demeurant ${data.president_address},

Atteste sur l'honneur que la société ${data.company_name}, en cours de constitution, est domiciliée à l'adresse suivante :

${data.address_line1}
${data.address_line2 || ''}
${data.postal_code} ${data.city}
${data.country}

Cette domiciliation prend effet à compter du ${formatDate(new Date())}.

Je m'engage à fournir un justificatif de domicile de moins de 3 mois à l'appui de la présente attestation.

Fait pour servir et valoir ce que de droit.`;
  
  const lines = doc.splitTextToSize(texte, 180);
  doc.text(lines, 15, y);
  y += lines.length * 5 + 20;
  
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, `${data.president_first_name} ${data.president_last_name}`);
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 5. ATTESTATION DE NON-CONDAMNATION
// ============================================

export function generateAttestationNonCondamnation(data: CompanyData): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'ATTESTATION DE NON-CONDAMNATION', data.company_name);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const texte = `Je soussigné(e), ${data.president_first_name} ${data.president_last_name}, né(e) le ${formatDate(data.president_birth_date)} à ${data.president_birth_place}, de nationalité ${data.president_nationality}, demeurant ${data.president_address},

Agissant en qualité de ${['SASU', 'SAS'].includes(data.company_type) ? 'Président' : 'Gérant'} de la société ${data.company_name},

Atteste sur l'honneur :

• Ne pas avoir fait l'objet d'une condamnation définitive pour crime ou délit,
• Ne pas avoir fait l'objet d'une interdiction de gérer ou d'administrer,
• Ne pas être en état de faillite personnelle ou de liquidation judiciaire,
• Ne pas avoir été frappé de déchéance commerciale,
• Ne faire l'objet d'aucune mesure d'incapacité prévue par les lois et règlements.

Je déclare être parfaitement en mesure d'exercer les fonctions de direction au sein de la société.

Fait pour servir et valoir ce que de droit.`;
  
  const lines = doc.splitTextToSize(texte, 180);
  doc.text(lines, 15, y);
  y += lines.length * 5 + 20;
  
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, `${data.president_first_name} ${data.president_last_name}`);
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 6. DÉCLARATION DES BÉNÉFICIAIRES EFFECTIFS
// ============================================

export function generateDeclarationBeneficiaires(data: CompanyData, shareholders: Shareholder[] = []): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'DÉCLARATION DES BÉNÉFICIAIRES EFFECTIFS', data.company_name);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const intro = `Conformément à l'article L.561-46 du Code monétaire et financier, je déclare ci-après l'identité du ou des bénéficiaires effectifs de la société ${data.company_name}.

Est considérée comme bénéficiaire effectif toute personne physique qui détient, directement ou indirectement, plus de 25% du capital ou des droits de vote, ou qui exerce un contrôle sur les organes de direction.`;
  
  const introLines = doc.splitTextToSize(intro, 180);
  doc.text(introLines, 15, y);
  y += introLines.length * 5 + 15;
  
  // Bénéficiaires
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BÉNÉFICIAIRES EFFECTIFS DÉCLARÉS', 15, y);
  y += 10;
  
  if (shareholders.length === 0) {
    // Cas unipersonnel
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bénéficiaire effectif :', 15, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom et prénom : ${data.president_first_name} ${data.president_last_name}`, 15, y);
    y += 6;
    doc.text(`Date de naissance : ${formatDate(data.president_birth_date)}`, 15, y);
    y += 6;
    doc.text(`Lieu de naissance : ${data.president_birth_place}`, 15, y);
    y += 6;
    doc.text(`Nationalité : ${data.president_nationality}`, 15, y);
    y += 6;
    doc.text(`Adresse : ${data.president_address}`, 15, y);
    y += 6;
    doc.text('Pourcentage de détention : 100%', 15, y);
    y += 6;
    doc.text('Modalités de contrôle : Détention directe du capital', 15, y);
  } else {
    // Cas multi-associés
    shareholders.forEach((sh, index) => {
      if (sh.shares_percentage >= 25) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Bénéficiaire effectif n°${index + 1} :`, 15, y);
        y += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Nom et prénom : ${sh.first_name} ${sh.last_name}`, 15, y);
        y += 6;
        doc.text(`Date de naissance : ${formatDate(sh.birth_date)}`, 15, y);
        y += 6;
        doc.text(`Lieu de naissance : ${sh.birth_place}`, 15, y);
        y += 6;
        doc.text(`Nationalité : ${sh.nationality}`, 15, y);
        y += 6;
        doc.text(`Adresse : ${sh.address}`, 15, y);
        y += 6;
        doc.text(`Pourcentage de détention : ${sh.shares_percentage.toFixed(2)}%`, 15, y);
        y += 6;
        doc.text('Modalités de contrôle : Détention directe du capital', 15, y);
        y += 12;
      }
    });
  }
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, `Le ${['SASU', 'SAS'].includes(data.company_type) ? 'Président' : 'Gérant'}`);
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 7. FORMULAIRE M0 (PRÉ-REMPLI)
// ============================================

export function generateFormulaireM0(data: CompanyData, shareholders: Shareholder[] = []): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'FORMULAIRE M0 - DÉCLARATION DE CRÉATION', data.company_name);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Document pré-rempli - À compléter et signer avant dépôt au greffe', 105, y, { align: 'center' });
  y += 15;
  
  // Cadre 1 - Identification de la société
  doc.setFillColor(230, 126, 34);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICATION DE LA SOCIÉTÉ', 20, y + 5);
  doc.setTextColor(0, 0, 0);
  y += 12;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dénomination : ${data.company_name}`, 20, y);
  y += 6;
  doc.text(`Forme juridique : ${data.company_type}`, 20, y);
  y += 6;
  doc.text(`Capital social : ${data.capital_amount.toLocaleString('fr-FR')} €`, 20, y);
  y += 6;
  const siegeComplet = `${data.address_line1}${data.address_line2 ? ', ' + data.address_line2 : ''}, ${data.postal_code} ${data.city}`;
  doc.text(`Adresse du siège : ${siegeComplet}`, 20, y);
  y += 6;
  doc.text(`Durée : ${data.duree} ans`, 20, y);
  y += 6;
  doc.text(`Date de clôture d'exercice : ${data.exercice_fin || '31 décembre'}`, 20, y);
  y += 12;
  
  // Cadre 2 - Objet social
  doc.setFillColor(230, 126, 34);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('2. OBJET SOCIAL', 20, y + 5);
  doc.setTextColor(0, 0, 0);
  y += 12;
  
  doc.setFont('helvetica', 'normal');
  const objetLines = doc.splitTextToSize(data.activity_description, 170);
  doc.text(objetLines, 20, y);
  y += objetLines.length * 5 + 12;
  
  // Cadre 3 - Dirigeant
  if (y > 230) {
    doc.addPage();
    y = addHeader(doc, 'FORMULAIRE M0', data.company_name);
  }
  
  doc.setFillColor(230, 126, 34);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const dirigeantTitre = ['SASU', 'SAS'].includes(data.company_type) ? 'PRÉSIDENT' : 'GÉRANT';
  doc.text(`3. ${dirigeantTitre}`, 20, y + 5);
  doc.setTextColor(0, 0, 0);
  y += 12;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom : ${data.president_last_name}`, 20, y);
  y += 6;
  doc.text(`Prénom : ${data.president_first_name}`, 20, y);
  y += 6;
  doc.text(`Date de naissance : ${formatDate(data.president_birth_date)}`, 20, y);
  y += 6;
  doc.text(`Lieu de naissance : ${data.president_birth_place}`, 20, y);
  y += 6;
  doc.text(`Nationalité : ${data.president_nationality}`, 20, y);
  y += 6;
  doc.text(`Adresse personnelle : ${data.president_address}`, 20, y);
  y += 12;
  
  // Cadre 4 - Associés (si multi-associés)
  if (shareholders.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = addHeader(doc, 'FORMULAIRE M0', data.company_name);
    }
    
    doc.setFillColor(230, 126, 34);
    doc.rect(15, y, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('4. ASSOCIÉS / ACTIONNAIRES', 20, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 12;
    
    const tableData = shareholders.map(sh => [
      `${sh.first_name} ${sh.last_name}`,
      `${sh.shares_percentage.toFixed(2)}%`,
      `${(sh.apport_numeraire || 0).toLocaleString('fr-FR')} €`
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Nom et Prénom', 'Part du capital', 'Apport']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [230, 126, 34] }
    });
    
    y = (doc as any).lastAutoTable.finalY + 12;
  }
  
  // Signature
  if (y > 220) {
    doc.addPage();
    y = addHeader(doc, 'FORMULAIRE M0', data.company_name);
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFIE EXACT LES RENSEIGNEMENTS PORTÉS CI-DESSUS', 15, y);
  y += 10;
  
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, `Le ${dirigeantTitre}`);
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// 8. ÉTAT DES ACTES ACCOMPLIS
// ============================================

export function generateEtatActesAccomplis(data: CompanyData): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'ÉTAT DES ACTES ACCOMPLIS', data.company_name);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const intro = `Je soussigné(e), ${data.president_first_name} ${data.president_last_name}, agissant en qualité de ${['SASU', 'SAS'].includes(data.company_type) ? 'Président' : 'Gérant'} de la société en formation ${data.company_name},

Déclare qu'aucun acte n'a été accompli pour le compte de la société avant son immatriculation, à l'exception des actes suivants :`;
  
  const introLines = doc.splitTextToSize(intro, 180);
  doc.text(introLines, 15, y);
  y += introLines.length * 5 + 15;
  
  // Liste des actes
  const actes = [
    'Rédaction et signature des statuts',
    'Dépôt du capital social',
    'Ouverture d\'un compte bancaire professionnel',
    'Souscription d\'une assurance responsabilité civile professionnelle (si applicable)',
  ];
  
  doc.setFont('helvetica', 'bold');
  doc.text('Actes accomplis :', 15, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  actes.forEach(acte => {
    doc.text(`• ${acte}`, 20, y);
    y += 6;
  });
  
  y += 10;
  
  const conclusion = `Ces actes ont été accomplis dans le strict respect de la réglementation en vigueur et dans l'intérêt de la société.

Je m'engage à ce que tous ces actes soient repris par la société dès son immatriculation.`;
  
  const conclusionLines = doc.splitTextToSize(conclusion, 180);
  doc.text(conclusionLines, 15, y);
  y += conclusionLines.length * 5 + 15;
  
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à ${data.city}, le ${formatDate(new Date())}`, 15, y);
  y += 15;
  
  addSignatureBlock(doc, y, `Le ${['SASU', 'SAS'].includes(data.company_type) ? 'Président' : 'Gérant'}`);
  
  addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  
  return doc;
}

// ============================================
// FONCTION EXPORT PRINCIPALE
// ============================================

export interface GenerateAllDocumentsParams {
  companyData: CompanyData;
  shareholders?: Shareholder[];
  documentsToGenerate?: string[]; // Liste optionnelle des docs à générer
}

export function generateAllDocuments(params: GenerateAllDocumentsParams): Record<string, jsPDF> {
  const { companyData, shareholders = [], documentsToGenerate } = params;
  const docs: Record<string, jsPDF> = {};
  const isUnipersonnel = ['SASU', 'EURL'].includes(companyData.company_type);
  
  const allPossibleDocs = [
    'statuts',
    isUnipersonnel ? 'pv_decision_unique' : 'pv_ag_constitutive',
    'attestation_domiciliation',
    'attestation_non_condamnation',
    'declaration_beneficiaires',
    'formulaire_m0',
    'etat_actes_accomplis',
  ];
  
  const toGenerate = documentsToGenerate || allPossibleDocs;
  
  if (toGenerate.includes('statuts')) {
    docs['statuts'] = generateStatutsPDF(companyData, shareholders);
  }
  
  if (toGenerate.includes('pv_decision_unique') && isUnipersonnel) {
    docs['pv_decision_unique'] = generatePVDecisionUnique(companyData);
  }
  
  if (toGenerate.includes('pv_ag_constitutive') && !isUnipersonnel) {
    docs['pv_ag_constitutive'] = generatePVAGConstitutive(companyData, shareholders);
  }
  
  if (toGenerate.includes('attestation_domiciliation')) {
    docs['attestation_domiciliation'] = generateAttestationDomiciliation(companyData);
  }
  
  if (toGenerate.includes('attestation_non_condamnation')) {
    docs['attestation_non_condamnation'] = generateAttestationNonCondamnation(companyData);
  }
  
  if (toGenerate.includes('declaration_beneficiaires')) {
    docs['declaration_beneficiaires'] = generateDeclarationBeneficiaires(companyData, shareholders);
  }
  
  if (toGenerate.includes('formulaire_m0')) {
    docs['formulaire_m0'] = generateFormulaireM0(companyData, shareholders);
  }
  
  if (toGenerate.includes('etat_actes_accomplis')) {
    docs['etat_actes_accomplis'] = generateEtatActesAccomplis(companyData);
  }
  
  return docs;
}