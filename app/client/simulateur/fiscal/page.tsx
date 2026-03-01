'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, FileText, FileSpreadsheet, TrendingUp, Info, ArrowLeft, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Inputs {
  ca: number;
  charges: number;
  situationFamiliale: 'celibataire' | 'marie' | 'pacs';
  nbParts: number;
  autresRevenus: number;
  nbEnfants: number;
  pctRemuneration: number;
}

interface RegimeResult {
  nom: string;
  description: string;
  couleur: string;
  is: number;
  cotisations: number;
  ir: number;
  totalPrelevements: number;
  netDisponible: number;
  tauxGlobal: number;
  retraite: number;
  protectionSociale: string;
  avantages: string[];
  inconvenients: string[];
  commentaire: string;
  detailCalcul: {
    label: string;
    montant: number;
    explication: string;
  }[];
}

export default function ComparaisonFiscale() {
  const [inputs, setInputs] = useState<Inputs>({
    ca: 100000,
    charges: 30000,
    situationFamiliale: 'celibataire',
    nbParts: 1,
    autresRevenus: 0,
    nbEnfants: 0,
    pctRemuneration: 60,
  });

  const [results, setResults] = useState<RegimeResult[]>([]);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const benefice = inputs.ca - inputs.charges;

  function calculateIR(revenu: number, parts: number): number {
    const qf = revenu / parts;
    let impot = 0;

    if (qf <= 11294) impot = 0;
    else if (qf <= 28797) impot = (qf - 11294) * 0.11;
    else if (qf <= 82341) impot = (28797 - 11294) * 0.11 + (qf - 28797) * 0.30;
    else if (qf <= 177106) impot = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (qf - 82341) * 0.41;
    else impot = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (qf - 177106) * 0.45;

    return Math.max(0, Math.round(impot * parts));
  }

  useMemo(() => {
    const newResults: RegimeResult[] = [];

    // MICRO-ENTREPRISE
    const abattement = inputs.ca * 0.34;
    const revenuImposableMicro = inputs.ca - abattement;
    const cotisationsMicro = Math.round(inputs.ca * 0.22);
    const irMicro = calculateIR(revenuImposableMicro + inputs.autresRevenus, inputs.nbParts);
    const totalMicro = cotisationsMicro + irMicro;
    const netMicro = inputs.ca - totalMicro;

    let commentaireMicro = '';
    if (inputs.ca > 77700) commentaireMicro = '⚠️ Vous dépassez le seuil de la micro-entreprise (77 700€). Passage obligatoire à un autre régime.';
    else if (netMicro < inputs.ca * 0.6) commentaireMicro = '⚠️ Votre taux de prélèvement est élevé (>40%). Un autre régime pourrait être plus avantageux.';
    else commentaireMicro = '✅ Régime simple et adapté pour débuter avec peu de charges.';

    newResults.push({
      nom: 'Micro-entreprise',
      description: 'Régime ultra-simplifié avec abattement forfaitaire de 34% (BNC)',
      couleur: '#3B82F6',
      is: 0,
      cotisations: cotisationsMicro,
      ir: irMicro,
      totalPrelevements: totalMicro,
      netDisponible: netMicro,
      tauxGlobal: (totalMicro / inputs.ca) * 100,
      retraite: cotisationsMicro * 0.25,
      protectionSociale: 'SSI - Protection de base',
      avantages: [
        'Aucune comptabilité',
        'Déclaration mensuelle ou trimestrielle simple',
        'Pas de TVA à gérer (franchise en base)',
        'Idéal pour tester une activité'
      ],
      inconvenients: [
        'Charges non déductibles',
        'Plafond de CA : 77 700€',
        'Protection sociale limitée',
        'Droits retraite faibles'
      ],
      commentaire: commentaireMicro,
      detailCalcul: [
        { label: 'Chiffre d\'affaires', montant: inputs.ca, explication: 'CA déclaré' },
        { label: 'Abattement forfaitaire 34%', montant: -abattement, explication: 'Abattement BNC (prestations de services)' },
        { label: 'Revenu imposable', montant: revenuImposableMicro, explication: 'Base pour le calcul de l\'IR' },
        { label: 'Cotisations sociales 22%', montant: -cotisationsMicro, explication: 'Calculées sur le CA (SSI)' },
        { label: 'Impôt sur le revenu', montant: -irMicro, explication: 'Barème progressif 2026' },
        { label: 'Net disponible', montant: netMicro, explication: 'Ce qu\'il vous reste réellement' }
      ]
    });

    // SASU À L'IS
    const isSASU = benefice <= 42500 ? benefice * 0.15 : 42500 * 0.15 + (benefice - 42500) * 0.25;
    const beneficeNetIS_SASU = benefice - isSASU;
    const remunerationSASU = beneficeNetIS_SASU * (inputs.pctRemuneration / 100);
    const dividendesSASU = beneficeNetIS_SASU * ((100 - inputs.pctRemuneration) / 100);
    const cotisationsSASU = Math.round(remunerationSASU * 0.80);
    const netSalaireSASU = remunerationSASU - cotisationsSASU;
    const irSASU = calculateIR(netSalaireSASU + inputs.autresRevenus, inputs.nbParts);
    const flatTaxSASU = Math.round(dividendesSASU * 0.30);
    const dividendesNetsSASU = dividendesSASU - flatTaxSASU;
    const totalSASU = isSASU + cotisationsSASU + irSASU + flatTaxSASU;
    const netSASU = netSalaireSASU + dividendesNetsSASU - irSASU;

    let commentaireSASU = '';
    if (inputs.pctRemuneration > 80) commentaireSASU = '💡 Vous privilégiez le salaire. Cela maximise vos droits retraite mais augmente les cotisations.';
    else if (inputs.pctRemuneration < 40) commentaireSASU = '💡 Vous privilégiez les dividendes. Économie de cotisations mais moins de droits retraite.';
    else commentaireSASU = '✅ Équilibre optimal entre salaire et dividendes.';

    if (benefice < 30000) commentaireSASU += ' ⚠️ L\'IS peut être moins avantageux en dessous de 30 000€ de bénéfice.';

    newResults.push({
      nom: 'SASU à l\'IS',
      description: 'Société par Actions Simplifiée Unipersonnelle - Impôt sur les Sociétés',
      couleur: '#10B981',
      is: Math.round(isSASU),
      cotisations: cotisationsSASU,
      ir: irSASU + flatTaxSASU,
      totalPrelevements: totalSASU,
      netDisponible: netSASU,
      tauxGlobal: (totalSASU / inputs.ca) * 100,
      retraite: cotisationsSASU * 0.28,
      protectionSociale: 'Régime général - Protection complète',
      avantages: [
        'Taux IS réduit 15% jusqu\'à 42 500€',
        'Optimisation salaire/dividendes',
        'Protection sociale complète (assimilé salarié)',
        'Crédibilité accrue',
        'Patrimoine personnel protégé'
      ],
      inconvenients: [
        'Comptabilité obligatoire',
        'Cotisations élevées sur salaire (80%)',
        'Coûts de gestion',
        'Formalisme important'
      ],
      commentaire: commentaireSASU,
      detailCalcul: [
        { label: 'Bénéfice', montant: benefice, explication: 'CA - Charges' },
        { label: 'IS (15% puis 25%)', montant: -Math.round(isSASU), explication: '15% jusqu\'à 42 500€, puis 25%' },
        { label: 'Bénéfice après IS', montant: beneficeNetIS_SASU, explication: 'Disponible pour rémunération + dividendes' },
        { label: `Rémunération (${inputs.pctRemuneration}%)`, montant: remunerationSASU, explication: 'Salaire brut du dirigeant' },
        { label: 'Cotisations salariales + patronales', montant: -cotisationsSASU, explication: 'Environ 80% du brut (assimilé salarié)' },
        { label: 'Salaire net', montant: netSalaireSASU, explication: 'Après cotisations' },
        { label: 'IR sur salaire', montant: -irSASU, explication: 'Barème progressif' },
        { label: `Dividendes (${100 - inputs.pctRemuneration}%)`, montant: dividendesSASU, explication: 'Distribution du solde' },
        { label: 'Flat tax 30%', montant: -flatTaxSASU, explication: '12.8% IR + 17.2% PS' },
        { label: 'Net disponible total', montant: netSASU, explication: 'Salaire net + dividendes nets' }
      ]
    });

    // SASU À L'IR
    const cotisationsSASU_IR = Math.round(benefice * 0.45);
    const revenuImposableSASU_IR = benefice - cotisationsSASU_IR;
    const irSASU_IR = calculateIR(revenuImposableSASU_IR + inputs.autresRevenus, inputs.nbParts);
    const totalSASU_IR = cotisationsSASU_IR + irSASU_IR;
    const netSASU_IR = benefice - totalSASU_IR;

    let commentaireSASU_IR = '';
    if (inputs.nbParts >= 2) commentaireSASU_IR = '✅ L\'IR est avantageux avec plusieurs parts fiscales (quotient familial).';
    else if (revenuImposableSASU_IR > 80000) commentaireSASU_IR = '⚠️ Avec ce niveau de revenu, l\'IS pourrait être plus intéressant.';
    else commentaireSASU_IR = '✅ L\'IR évite la double imposition et peut être avantageux selon votre TMI.';

    newResults.push({
      nom: 'SASU à l\'IR',
      description: 'Option transparence fiscale (limitée à 5 ans maximum)',
      couleur: '#F59E0B',
      is: 0,
      cotisations: cotisationsSASU_IR,
      ir: irSASU_IR,
      totalPrelevements: totalSASU_IR,
      netDisponible: netSASU_IR,
      tauxGlobal: (totalSASU_IR / inputs.ca) * 100,
      retraite: cotisationsSASU_IR * 0.28,
      protectionSociale: 'Régime général - Protection complète',
      avantages: [
        'Pas de double imposition',
        'Bénéfice du quotient familial',
        'Déficits déductibles du revenu global',
        'Simplicité fiscale'
      ],
      inconvenients: [
        'Option limitée à 5 ans',
        'Cotisations TNS élevées (45%)',
        'IR sur la totalité du bénéfice',
        'Moins flexible que l\'IS'
      ],
      commentaire: commentaireSASU_IR,
      detailCalcul: [
        { label: 'Bénéfice', montant: benefice, explication: 'CA - Charges' },
        { label: 'Cotisations TNS 45%', montant: -cotisationsSASU_IR, explication: 'Statut TNS en SASU IR' },
        { label: 'Revenu imposable', montant: revenuImposableSASU_IR, explication: 'Bénéfice - Cotisations' },
        { label: 'Impôt sur le revenu', montant: -irSASU_IR, explication: 'Barème progressif avec quotient familial' },
        { label: 'Net disponible', montant: netSASU_IR, explication: 'Ce qu\'il vous reste' }
      ]
    });

    // EURL À L'IS
    const isEURL = benefice <= 42500 ? benefice * 0.15 : 42500 * 0.15 + (benefice - 42500) * 0.25;
    const beneficeNetIS_EURL = benefice - isEURL;
    const remunerationEURL = beneficeNetIS_EURL * 0.7;
    const dividendesEURL = beneficeNetIS_EURL * 0.3;
    const cotisationsEURL = Math.round(remunerationEURL * 0.45);
    const netRemunEURL = remunerationEURL - cotisationsEURL;
    const irEURL = calculateIR(netRemunEURL + inputs.autresRevenus, inputs.nbParts);
    const dividendesImposablesEURL = dividendesEURL * 0.9;
    const cotisSSI = Math.round(dividendesImposablesEURL * 0.172);
    const flatTaxEURL = Math.round(dividendesEURL * 0.30);
    const dividendesNetsEURL = dividendesEURL - cotisSSI - flatTaxEURL;
    const totalEURL = isEURL + cotisationsEURL + cotisSSI + irEURL + flatTaxEURL;
    const netEURL = netRemunEURL + dividendesNetsEURL - irEURL;

    let commentaireEURL = '';
    if (dividendesEURL > 10000) commentaireEURL = '⚠️ Les dividendes >10% du capital social sont soumis aux cotisations sociales (17.2%).';
    if (benefice > 60000) commentaireEURL += ' ✅ L\'EURL IS est intéressante pour optimiser charges sociales et IR.';
    else commentaireEURL = '✅ Bon compromis entre IS et cotisations TNS modérées.';

    newResults.push({
      nom: 'EURL à l\'IS',
      description: 'Entreprise Unipersonnelle à Responsabilité Limitée - Impôt sur les Sociétés',
      couleur: '#8B5CF6',
      is: Math.round(isEURL),
      cotisations: cotisationsEURL + cotisSSI,
      ir: irEURL + flatTaxEURL,
      totalPrelevements: totalEURL,
      netDisponible: netEURL,
      tauxGlobal: (totalEURL / inputs.ca) * 100,
      retraite: cotisationsEURL * 0.35,
      protectionSociale: 'SSI - Protection intermédiaire',
      avantages: [
        'Taux IS réduit 15% jusqu\'à 42 500€',
        'Cotisations TNS plus faibles que assimilé salarié',
        'Optimisation possible',
        'Meilleure retraite que SASU'
      ],
      inconvenients: [
        'Dividendes >10% capital soumis à cotisations',
        'Protection sociale moins complète',
        'Comptabilité obligatoire',
        'Formalisme'
      ],
      commentaire: commentaireEURL,
      detailCalcul: [
        { label: 'Bénéfice', montant: benefice, explication: 'CA - Charges' },
        { label: 'IS (15% puis 25%)', montant: -Math.round(isEURL), explication: '15% jusqu\'à 42 500€, puis 25%' },
        { label: 'Bénéfice après IS', montant: beneficeNetIS_EURL, explication: 'Disponible pour rémunération + dividendes' },
        { label: 'Rémunération TNS (70%)', montant: remunerationEURL, explication: 'Rémunération du gérant majoritaire' },
        { label: 'Cotisations TNS 45%', montant: -cotisationsEURL, explication: 'SSI (Sécurité Sociale Indépendants)' },
        { label: 'Net rémunération', montant: netRemunEURL, explication: 'Après cotisations' },
        { label: 'IR sur rémunération', montant: -irEURL, explication: 'Barème progressif' },
        { label: 'Dividendes (30%)', montant: dividendesEURL, explication: 'Distribution du solde' },
        { label: 'Cotisations SSI sur dividendes', montant: -cotisSSI, explication: '17.2% sur 90% des dividendes si >10% capital' },
        { label: 'Flat tax 30%', montant: -flatTaxEURL, explication: '12.8% IR + 17.2% PS' },
        { label: 'Net disponible total', montant: netEURL, explication: 'Rémunération nette + dividendes nets' }
      ]
    });

    setResults(newResults);
  }, [inputs, benefice]);

  async function exportToPDF() {
    setExportingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Page 1 - En-tête et synthèse
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPARAISON FISCALE 2026', pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Analyse comparative des régimes fiscaux', pageWidth / 2, 35, { align: 'center' });
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, 50, { align: 'center' });

      // Hypothèses
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 75);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 85;
      const hypotheses = [
        `Chiffre d'affaires : ${currency(inputs.ca)}`,
        `Charges déductibles : ${currency(inputs.charges)}`,
        `Bénéfice : ${currency(benefice)}`,
        `Situation familiale : ${inputs.situationFamiliale}`,
        `Nombre de parts fiscales : ${inputs.nbParts}`,
        `Autres revenus : ${currency(inputs.autresRevenus)}`,
        `Répartition SASU IS : ${inputs.pctRemuneration}% salaire / ${100 - inputs.pctRemuneration}% dividendes`,
      ];
      
      hypotheses.forEach(h => {
        pdf.text(h, 25, y);
        y += 7;
      });

      // Meilleur régime
      const bestRegime = results.reduce((best, current) => 
        current.netDisponible > best.netDisponible ? current : best
      , results[0]);

      y += 10;
      pdf.setFillColor(16, 185, 129);
      pdf.roundedRect(20, y - 5, pageWidth - 40, 30, 3, 3, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('✓ RÉGIME RECOMMANDÉ', 25, y + 5);
      pdf.setFontSize(20);
      pdf.text(bestRegime.nom.toUpperCase(), 25, y + 15);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Net disponible : ${currency(bestRegime.netDisponible)} (${bestRegime.tauxGlobal.toFixed(1)}% de prélèvements)`, 25, y + 23);

      // Tableau comparatif
      y += 45;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPARAISON DES RÉGIMES', 20, y);
      
      y += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Régime', 22, y);
      pdf.text('IS', 70, y, { align: 'right' });
      pdf.text('Cotisations', 105, y, { align: 'right' });
      pdf.text('IR', 135, y, { align: 'right' });
      pdf.text('Net disponible', 190, y, { align: 'right' });
      
      pdf.setLineWidth(0.5);
      pdf.line(20, y + 2, pageWidth - 20, y + 2);
      
      y += 8;
      pdf.setFont('helvetica', 'normal');
      
      results.forEach((r) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }
        
        if (r.nom === bestRegime.nom) {
          pdf.setFillColor(220, 252, 231);
          pdf.rect(20, y - 5, pageWidth - 40, 8, 'F');
        }
        
        pdf.text(r.nom, 22, y);
        pdf.text(currency(r.is), 70, y, { align: 'right' });
        pdf.text(currency(r.cotisations), 105, y, { align: 'right' });
        pdf.text(currency(r.ir), 135, y, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.text(currency(r.netDisponible), 190, y, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        
        y += 8;
      });

      // Page 2 - Détails de chaque régime
      pdf.addPage();
      y = 20;
      
      results.forEach((regime, index) => {
        if (index > 0 && y > pageHeight - 100) {
          pdf.addPage();
          y = 20;
        }
        
        // En-tête régime
        pdf.setFillColor(241, 245, 249);
        pdf.rect(20, y, pageWidth - 40, 12, 'F');
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(regime.nom.toUpperCase(), 25, y + 8);
        
        y += 18;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text(regime.description, 25, y);
        
        y += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Net disponible : ${currency(regime.netDisponible)} • Taux global : ${regime.tauxGlobal.toFixed(1)}%`, 25, y);
        
        y += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Commentaire :', 25, y);
        pdf.setFont('helvetica', 'normal');
        const commentLines = pdf.splitTextToSize(regime.commentaire, pageWidth - 50);
        y += 5;
        commentLines.forEach((line: string) => {
          pdf.text(line, 25, y);
          y += 5;
        });
        
        y += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Avantages :', 25, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        regime.avantages.forEach(a => {
          pdf.text(`  • ${a}`, 30, y);
          y += 5;
        });
        
        y += 3;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Inconvénients :', 25, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        regime.inconvenients.forEach(i => {
          pdf.text(`  • ${i}`, 30, y);
          y += 5;
        });
        
        y += 10;
      });

      // Footer sur toutes les pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Déclic Entrepreneurs • Comparaison fiscale 2026 • Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      pdf.save(`comparaison-fiscale-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Feuille 1: Synthèse
      const syntheseData = [
        ['COMPARAISON FISCALE 2026', ''],
        ['Date', new Date().toLocaleDateString('fr-FR')],
        ['', ''],
        ['VOS DONNÉES', ''],
        ['Chiffre d\'affaires', inputs.ca],
        ['Charges', inputs.charges],
        ['Bénéfice', benefice],
        ['Situation familiale', inputs.situationFamiliale],
        ['Nombre de parts', inputs.nbParts],
        ['Autres revenus', inputs.autresRevenus],
        ['', ''],
        ['COMPARAISON', ''],
        ['Régime', 'IS', 'Cotisations', 'IR', 'Total prélèvements', 'Net disponible', 'Taux global %'],
        ...results.map(r => [r.nom, r.is, r.cotisations, r.ir, r.totalPrelevements, r.netDisponible, r.tauxGlobal.toFixed(2)])
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(syntheseData);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Synthèse');

      // Feuille 2-5: Détail de chaque régime
      results.forEach(regime => {
        const detailData = [
          [regime.nom.toUpperCase(), ''],
          ['', ''],
          ['Description', regime.description],
          ['', ''],
          ['RÉSULTAT', ''],
          ['Net disponible', regime.netDisponible],
          ['Taux global', regime.tauxGlobal.toFixed(2) + '%'],
          ['', ''],
          ['DÉTAIL DES CALCULS', ''],
          ['Étape', 'Montant', 'Explication'],
          ...regime.detailCalcul.map(d => [d.label, d.montant, d.explication]),
          ['', ''],
          ['AVANTAGES', ''],
          ...regime.avantages.map(a => ['', a]),
          ['', ''],
          ['INCONVÉNIENTS', ''],
          ...regime.inconvenients.map(i => ['', i]),
          ['', ''],
          ['COMMENTAIRE', ''],
          ['', regime.commentaire]
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(workbook, ws, regime.nom.substring(0, 31));
      });

      XLSX.writeFile(workbook, `comparaison-fiscale-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Erreur export Excel:', error);
    } finally {
      setExportingExcel(false);
    }
  }

  const bestRegime = results.reduce((best, current) => 
    current.netDisponible > best.netDisponible ? current : best
  , results[0] || { nom: '', netDisponible: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slide { animation: slideIn 0.5s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={20} />
          <span>Retour aux simulateurs</span>
        </Link>

        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm mb-6">
            <Sparkles size={16} />
            <span className="font-bold">Loi de Finances 2026</span>
          </div>
          <h1 className="text-6xl font-black mb-4 animate-slide">Comparaison Fiscale</h1>
          <p className="text-xl text-slate-300 animate-slide delay-1">Micro-entreprise • SASU IS • SASU IR • EURL IS</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* SIDEBAR INPUTS */}
          <div className="lg:col-span-1 animate-slide delay-2">
            <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur sticky top-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="text-blue-400" size={24} />
                Vos données
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">CA annuel (€)</Label>
                  <Input 
                    type="number" 
                    value={inputs.ca as any} 
                    onChange={(e) => setInputs({...inputs, ca: Number(e.target.value) || 0})} 
                    className="bg-slate-700 border-slate-600 text-white h-12 text-lg font-bold" 
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Charges annuelles (€)</Label>
                  <Input 
                    type="number" 
                    value={inputs.charges as any} 
                    onChange={(e) => setInputs({...inputs, charges: Number(e.target.value) || 0})} 
                    className="bg-slate-700 border-slate-600 text-white h-12 text-lg" 
                  />
                </div>

                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-xs text-blue-300 mb-1">Bénéfice</p>
                  <p className="text-3xl font-black text-white">{currency(benefice)}</p>
                  <p className="text-xs text-blue-300 mt-1">CA - Charges</p>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Situation familiale</Label>
                  <Select value={inputs.situationFamiliale} onValueChange={(v: any) => setInputs({...inputs, situationFamiliale: v})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celibataire">Célibataire</SelectItem>
                      <SelectItem value="marie">Marié(e)</SelectItem>
                      <SelectItem value="pacs">Pacsé(e)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Parts fiscales</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    value={inputs.nbParts as any} 
                    onChange={(e) => setInputs({...inputs, nbParts: Number(e.target.value) || 1})} 
                    className="bg-slate-700 border-slate-600 text-white h-12" 
                  />
                  <p className="text-xs text-slate-400 mt-1">1 part = célibataire, 2 parts = couple, +0.5 par enfant</p>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Autres revenus (€)</Label>
                  <Input 
                    type="number" 
                    value={inputs.autresRevenus as any} 
                    onChange={(e) => setInputs({...inputs, autresRevenus: Number(e.target.value) || 0})} 
                    className="bg-slate-700 border-slate-600 text-white h-12" 
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">% Rémunération en SASU IS</Label>
                  <Input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5" 
                    value={inputs.pctRemuneration as any} 
                    onChange={(e) => setInputs({...inputs, pctRemuneration: Number(e.target.value)})} 
                    className="w-full" 
                  />
                  <p className="text-sm text-slate-400 mt-1">{inputs.pctRemuneration}% salaire / {100 - inputs.pctRemuneration}% dividendes</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button 
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12"
                >
                  {exportingPDF ? (
                    <>Génération PDF...</>
                  ) : (
                    <>
                      <FileText size={18} className="mr-2" />
                      Exporter PDF
                    </>
                  )}
                </Button>

                <Button 
                  onClick={exportToExcel}
                  disabled={exportingExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
                >
                  {exportingExcel ? (
                    <>Génération Excel...</>
                  ) : (
                    <>
                      <FileSpreadsheet size={18} className="mr-2" />
                      Exporter Excel
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* RESULTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meilleur régime */}
            {bestRegime.nom && (
              <Card className="p-6 bg-gradient-to-br from-emerald-500/30 to-green-500/30 border-emerald-400 backdrop-blur animate-slide delay-3">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="text-emerald-300" size={32} />
                  <div>
                    <h3 className="text-2xl font-black text-white">Régime recommandé</h3>
                    <p className="text-emerald-100">Meilleur net disponible</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-black text-white mb-2">{bestRegime.nom}</p>
                    <p className="text-emerald-100">{bestRegime.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-200">Net disponible</p>
                    <p className="text-5xl font-black text-white">{currency(bestRegime.netDisponible)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Cartes régimes */}
            {results.map((r, index) => (
              <Card 
                key={r.nom} 
                className={`p-6 backdrop-blur transition-all cursor-pointer hover:scale-[1.02] animate-slide ${
                  r.nom === bestRegime.nom 
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400 ring-2 ring-amber-400' 
                    : selectedRegime === r.nom
                    ? 'bg-slate-800/50 border-blue-500 ring-2 ring-blue-500'
                    : 'bg-slate-800/30 border-slate-700'
                }`}
                style={{ animationDelay: `${0.4 + index * 0.1}s`, opacity: 0 }}
                onClick={() => setSelectedRegime(selectedRegime === r.nom ? null : r.nom)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.couleur }} />
                      <h3 className="text-2xl font-bold">{r.nom}</h3>
                      {r.nom === bestRegime.nom && (
                        <span className="px-3 py-1 bg-amber-400 text-slate-900 text-xs font-black rounded-full uppercase">
                          ✨ Optimal
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{r.description}</p>
                    <p className="text-slate-400 text-sm">Taux global : {r.tauxGlobal.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 mb-1">Net disponible</p>
                    <p className="text-4xl font-black text-green-400">{currency(r.netDisponible)}</p>
                  </div>
                </div>

                {/* Commentaire */}
                <div className="mb-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <Info className="text-blue-400 flex-shrink-0 mt-1" size={18} />
                    <p className="text-sm text-blue-100">{r.commentaire}</p>
                  </div>
                </div>

                {/* Prélèvements */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {r.is > 0 && (
                    <div className="bg-slate-700/40 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">IS</p>
                      <p className="text-lg font-bold text-red-400">-{currency(r.is)}</p>
                    </div>
                  )}
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Cotisations</p>
                    <p className="text-lg font-bold text-orange-400">-{currency(r.cotisations)}</p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">IR</p>
                    <p className="text-lg font-bold text-yellow-400">-{currency(r.ir)}</p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Retraite/an</p>
                    <p className="text-lg font-bold text-blue-400">{currency(r.retraite)}</p>
                  </div>
                </div>

                {/* Détails au clic */}
                {selectedRegime === r.nom && (
                  <div className="mt-6 space-y-6 animate-slide">
                    {/* Détail calculs */}
                    <div>
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Calculator className="text-blue-400" size={20} />
                        Détail des calculs
                      </h4>
                      <div className="space-y-3">
                        {r.detailCalcul.map((d, i) => (
                          <div key={i} className="flex items-start justify-between p-3 bg-slate-700/40 rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{d.label}</p>
                              <p className="text-xs text-slate-400 mt-1">{d.explication}</p>
                            </div>
                            <p className={`text-lg font-bold ml-4 ${d.montant < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {currency(d.montant)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Avantages / Inconvénients */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-2 text-emerald-400">
                          <CheckCircle size={20} />
                          Avantages
                        </h4>
                        <ul className="space-y-2">
                          {r.avantages.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-emerald-400 mt-1">✓</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-400">
                          <AlertCircle size={20} />
                          Inconvénients
                        </h4>
                        <ul className="space-y-2">
                          {r.inconvenients.map((i, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-red-400 mt-1">✗</span>
                              <span>{i}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Protection sociale */}
                    <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
                      <h4 className="text-sm font-bold text-indigo-300 mb-2">Protection sociale</h4>
                      <p className="text-sm text-indigo-100">{r.protectionSociale}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {/* Méthodologie */}
            <Card className="p-6 bg-blue-500/10 border-blue-500/30 backdrop-blur animate-slide" style={{ animationDelay: '0.9s', opacity: 0 }}>
              <div className="flex items-start gap-3">
                <Info className="text-blue-400 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-100">
                  <p className="font-bold mb-3 text-blue-300">Méthodologie de calcul (Loi de Finances 2026)</p>
                  <ul className="space-y-2 text-blue-200/80 text-xs">
                    <li>• <strong>IS :</strong> 15% jusqu'à 42 500€ de bénéfice, puis 25% au-delà</li>
                    <li>• <strong>Cotisations assimilé salarié (SASU) :</strong> 80% du brut (charges patronales + salariales)</li>
                    <li>• <strong>Cotisations TNS (EURL, SASU IR) :</strong> 45% du bénéfice</li>
                    <li>• <strong>Flat tax dividendes :</strong> 30% (12.8% IR + 17.2% prélèvements sociaux)</li>
                    <li>• <strong>Cotisations dividendes EURL :</strong> 17.2% sur 90% des dividendes si {'>'} 10% du capital social</li>
                    <li>• <strong>Barème IR 2026 :</strong> 0% / 11% / 30% / 41% / 45% avec quotient familial</li>
                    <li>• <strong>Micro-entreprise BNC :</strong> Abattement forfaitaire 34% • Cotisations 22%</li>
                  </ul>
                  <p className="mt-4 text-xs text-blue-300 italic">
                    Cette simulation est fournie à titre indicatif. Nous vous recommandons de consulter un expert-comptable 
                    pour une analyse personnalisée de votre situation.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}