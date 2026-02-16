// DocumentGenerator.ts - UNIFIED - All company types
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak, BorderStyle, WidthType, Table, TableRow, TableCell } from "npm:docx@8.5.0";

interface CompanyData {
  type: 'SASU' | 'SAS' | 'SARL' | 'EURL' | 'SCI' | 'SELARL' | 'SELARLU' | 'SELAS' | 'SELASU';
  denomination: string;
  objet: string;
  siege: string;
  duree: string;
  capital: string;
  apports: string;
  president?: string;
  gerant?: string;
  actionnaires?: Array<{
    nom: string;
    apport: string;
    actions: number;
    parts?: number;
    pourcentage: number;
  }>;
  associes?: Array<{
    nom: string;
    apport: string;
    parts: number;
    pourcentage: number;
  }>;
  exercice_debut: string;
  exercice_fin: string;
  profession?: string;
  objet_professionnel?: string;
}

const COLORS = {
  primary: "#1F4E78",
  secondary: "#2E5C8A",
  border: "#CCCCCC"
};

// ============ HELPER FUNCTIONS ============

function createTitle(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 }
  });
}

function createHeading1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    run: {
      color: COLORS.primary,
      bold: true,
      size: 28
    }
  });
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    run: {
      color: COLORS.secondary,
      bold: true,
      size: 26
    }
  });
}

function createParagraph(text: string, options: any = {}): Paragraph {
  return new Paragraph({
    text,
    spacing: { before: 120, after: 120 },
    alignment: options.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    ...options
  });
}

function createBulletPoint(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { before: 80, after: 80 }
  });
}

function createSeparator(): Paragraph {
  return new Paragraph({
    text: "═══════════════════════════════════════════════════════════════════════",
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 },
    run: {
      color: COLORS.border
    }
  });
}

function createActionnairesTable(actionnaires: any[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "Actionnaire", bold: true })],
        width: { size: 3000, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({ text: "Apport (€)", bold: true })],
        width: { size: 2000, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({ text: "Actions", bold: true })],
        width: { size: 1513, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({ text: "%", bold: true })],
        width: { size: 1513, type: WidthType.DXA }
      })
    ]
  });

  const dataRows = actionnaires.map(a => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph(a.nom)] }),
      new TableCell({ children: [new Paragraph(a.apport)] }),
      new TableCell({ children: [new Paragraph(a.actions.toString())] }),
      new TableCell({ children: [new Paragraph(`${a.pourcentage}%`)] })
    ]
  }));

  return new Table({
    width: { size: 8026, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border }
    }
  });
}

function createAssociesTable(associes: any[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "Associé", bold: true })],
        width: { size: 3000, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({ text: "Apport (€)", bold: true })],
        width: { size: 2000, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({ text: "Parts", bold: true })],
        width: { size: 1513, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({ text: "%", bold: true })],
        width: { size: 1513, type: WidthType.DXA }
      })
    ]
  });

  const dataRows = associes.map(a => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph(a.nom)] }),
      new TableCell({ children: [new Paragraph(a.apport)] }),
      new TableCell({ children: [new Paragraph(a.parts.toString())] }),
      new TableCell({ children: [new Paragraph(`${a.pourcentage}%`)] })
    ]
  }));

  return new Table({
    width: { size: 8026, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border }
    }
  });
}

// ============ SASU GENERATOR ============

async function generateSASU(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Société par Actions Simplifiée Unipersonnelle", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(""),
    createSeparator()
  );

  if (data.president) {
    sections.push(
      createParagraph("Le soussigné :", { bold: true }),
      createParagraph(""),
      createParagraph(data.president),
      createParagraph(""),
      createParagraph("A établi ainsi qu'il suit les statuts d'une société par actions simplifiée unipersonnelle."),
      createParagraph(""),
      createSeparator()
    );
  }

  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une société par actions simplifiée unipersonnelle régie par :"),
    createBulletPoint("Les articles L.227-1 et suivants du Code de commerce"),
    createBulletPoint("Les articles L.224-1 et suivants du Code de commerce"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createParagraph("Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale doit être précédée ou suivie immédiatement des mots « Société par Actions Simplifiée Unipersonnelle » ou des initiales « SASU » et de l'énonciation du capital social."),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph("La société a pour objet, en France et à l'étranger :"),
    createParagraph(""),
    createParagraph(data.objet),
    createParagraph(""),
    createParagraph("Et généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire ou connexe."),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à :`),
    createParagraph(""),
    createParagraph(data.siege),
    createParagraph(""),
    createParagraph("Il peut être transféré en tout autre endroit du même département ou d'un département limitrophe par simple décision du Président, et partout ailleurs en vertu d'une décision de l'associé unique."),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf dissolution anticipée ou prorogation.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL - ACTIONS"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à la somme de ${data.capital} euros.`),
    createParagraph(""),
    createParagraph("Il est divisé en actions de même catégorie, entièrement libérées."),
    createParagraph("")
  );

  if (data.actionnaires && data.actionnaires.length > 0) {
    sections.push(
      createParagraph("Répartition du capital :", { bold: true }),
      createParagraph(""),
      createActionnairesTable(data.actionnaires),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 7 - FORME DES ACTIONS"),
    createParagraph("Les actions sont nominatives. Elles donnent lieu à une inscription en compte au nom de leur propriétaire dans les conditions et selon les modalités prévues par la loi et les règlements."),
    createParagraph(""),
    createHeading2("ARTICLE 8 - TRANSMISSION DES ACTIONS"),
    createParagraph("Les actions sont librement transmissibles entre actionnaires."),
    createParagraph(""),
    createParagraph("Les actions ne peuvent être cédées à des tiers étrangers à la société qu'avec l'agrément préalable du Président de la société."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE III - DIRECTION DE LA SOCIÉTÉ"),
    createParagraph(""),
    createHeading2("ARTICLE 9 - PRÉSIDENT"),
    createParagraph("La société est représentée, dirigée et administrée par un Président, personne physique ou morale, nommé par l'associé unique."),
    createParagraph("")
  );

  if (data.president) {
    sections.push(
      createParagraph("Le premier Président de la société est :"),
      createParagraph(""),
      createParagraph(data.president),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 10 - DURÉE DES FONCTIONS"),
    createParagraph("Le Président est nommé pour une durée illimitée. Il peut être révoqué à tout moment par l'associé unique."),
    createParagraph(""),
    createHeading2("ARTICLE 11 - POUVOIRS DU PRÉSIDENT"),
    createParagraph("Le Président est investi des pouvoirs les plus étendus pour agir en toutes circonstances au nom de la société, dans la limite de l'objet social et des pouvoirs expressément attribués par la loi à l'associé unique."),
    createParagraph(""),
    createParagraph("Il représente la société dans ses rapports avec les tiers."),
    createParagraph(""),
    createHeading2("ARTICLE 12 - RÉMUNÉRATION"),
    createParagraph("L'associé unique fixe la rémunération du Président."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE IV - DÉCISIONS DE L'ASSOCIÉ UNIQUE"),
    createParagraph(""),
    createHeading2("ARTICLE 13 - DÉCISIONS DE L'ASSOCIÉ UNIQUE"),
    createParagraph("L'associé unique exerce les pouvoirs dévolus à l'assemblée des actionnaires dans les sociétés par actions simplifiées pluripersonnelles."),
    createParagraph(""),
    createParagraph("Ses décisions sont prises par écrit et consignées dans un registre."),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE V - COMPTES SOCIAUX"),
    createParagraph(""),
    createHeading2("ARTICLE 14 - EXERCICE SOCIAL"),
    createParagraph(`L'exercice social commence le ${data.exercice_debut} et se termine le ${data.exercice_fin} de chaque année.`),
    createParagraph(""),
    createParagraph(`Par exception, le premier exercice comprendra la période écoulée depuis l'immatriculation de la société jusqu'au ${data.exercice_fin} ${new Date().getFullYear()}.`),
    createParagraph(""),
    createHeading2("ARTICLE 15 - COMPTES ANNUELS"),
    createParagraph("Le Président établit, à la clôture de chaque exercice, les comptes annuels conformément aux dispositions légales et réglementaires en vigueur."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE VI - DISSOLUTION - LIQUIDATION"),
    createParagraph(""),
    createHeading2("ARTICLE 16 - DISSOLUTION"),
    createParagraph("La dissolution de la société résulte des causes prévues par la loi ou d'une décision de l'associé unique."),
    createParagraph(""),
    createHeading2("ARTICLE 17 - LIQUIDATION"),
    createParagraph("En cas de dissolution, la liquidation est effectuée par un liquidateur nommé par l'associé unique."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph(""),
    createParagraph("En autant d'exemplaires que de parties"),
    createParagraph(""),
    createParagraph(""),
    createParagraph("L'Associé Unique et Premier Président,"),
    createParagraph(data.president || ""),
    createParagraph(""),
    createParagraph("Signature :"),
    createParagraph("")
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

// ============ MAIN EXPORT FUNCTION ============

// ============ PARTIE 2 - À AJOUTER APRÈS generateSASU ============

// ============ SAS GENERATOR ============

async function generateSAS(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Société par Actions Simplifiée", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(""),
    createSeparator()
  );

  if (data.actionnaires && data.actionnaires.length > 0) {
    sections.push(
      createParagraph("Les soussignés :", { bold: true }),
      createParagraph("")
    );
    data.actionnaires.forEach(act => {
      sections.push(createParagraph(`- ${act.nom}`));
    });
    sections.push(
      createParagraph(""),
      createParagraph("Ont établi ainsi qu'il suit les statuts d'une société par actions simplifiée."),
      createParagraph(""),
      createSeparator()
    );
  }

  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une société par actions simplifiée régie par :"),
    createBulletPoint("Les articles L.227-1 et suivants du Code de commerce"),
    createBulletPoint("Les articles L.224-1 et suivants du Code de commerce"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createParagraph("Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale doit être précédée ou suivie immédiatement des mots « Société par Actions Simplifiée » ou des initiales « SAS » et de l'énonciation du capital social."),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph("La société a pour objet, en France et à l'étranger :"),
    createParagraph(""),
    createParagraph(data.objet),
    createParagraph(""),
    createParagraph("Et généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire ou connexe."),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à :`),
    createParagraph(""),
    createParagraph(data.siege),
    createParagraph(""),
    createParagraph("Il peut être transféré en tout autre endroit du même département ou d'un département limitrophe par simple décision du Président, et partout ailleurs en vertu d'une décision collective des actionnaires."),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf dissolution anticipée ou prorogation.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL - ACTIONS"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à la somme de ${data.capital} euros.`),
    createParagraph(""),
    createParagraph("Il est divisé en actions de même catégorie, entièrement libérées."),
    createParagraph("")
  );

  if (data.actionnaires && data.actionnaires.length > 0) {
    sections.push(
      createParagraph("Répartition du capital :", { bold: true }),
      createParagraph(""),
      createActionnairesTable(data.actionnaires),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 7 - FORME DES ACTIONS"),
    createParagraph("Les actions sont nominatives. Elles donnent lieu à une inscription en compte au nom de leur propriétaire dans les conditions et selon les modalités prévues par la loi et les règlements."),
    createParagraph(""),
    createHeading2("ARTICLE 8 - TRANSMISSION DES ACTIONS"),
    createParagraph("Les actions sont librement transmissibles entre actionnaires."),
    createParagraph(""),
    createParagraph("Les actions ne peuvent être cédées à des tiers étrangers à la société qu'avec l'agrément préalable du Président après consultation des autres actionnaires."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE III - DIRECTION DE LA SOCIÉTÉ"),
    createParagraph(""),
    createHeading2("ARTICLE 9 - PRÉSIDENT"),
    createParagraph("La société est représentée, dirigée et administrée par un Président, personne physique ou morale, nommé par décision collective des actionnaires."),
    createParagraph("")
  );

  if (data.president) {
    sections.push(
      createParagraph("Le premier Président de la société est :"),
      createParagraph(""),
      createParagraph(data.president),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 10 - DURÉE DES FONCTIONS"),
    createParagraph("Le Président est nommé pour une durée déterminée ou indéterminée fixée lors de sa nomination. Il peut être révoqué à tout moment par décision collective des actionnaires."),
    createParagraph(""),
    createHeading2("ARTICLE 11 - POUVOIRS DU PRÉSIDENT"),
    createParagraph("Le Président est investi des pouvoirs les plus étendus pour agir en toutes circonstances au nom de la société, dans la limite de l'objet social et des pouvoirs expressément attribués par la loi aux décisions collectives."),
    createParagraph(""),
    createParagraph("Il représente la société dans ses rapports avec les tiers."),
    createParagraph(""),
    createHeading2("ARTICLE 12 - RÉMUNÉRATION"),
    createParagraph("Les actionnaires fixent la rémunération du Président par décision collective."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE IV - DÉCISIONS COLLECTIVES"),
    createParagraph(""),
    createHeading2("ARTICLE 13 - DÉCISIONS COLLECTIVES"),
    createParagraph("Les décisions collectives sont prises en assemblée générale ou par consultation écrite."),
    createParagraph(""),
    createHeading2("ARTICLE 14 - CONVOCATION"),
    createParagraph("Les actionnaires sont convoqués aux assemblées générales par le Président, par lettre recommandée avec avis de réception ou par lettre remise en main propre contre décharge, 15 jours au moins avant la date de l'assemblée."),
    createParagraph(""),
    createHeading2("ARTICLE 15 - QUORUM ET MAJORITÉ"),
    createParagraph("Les décisions collectives sont adoptées à la majorité simple des voix des actionnaires présents ou représentés."),
    createParagraph(""),
    createParagraph("Aucun quorum n'est requis pour la tenue des assemblées générales."),
    createParagraph(""),
    createHeading2("ARTICLE 16 - PROCÈS-VERBAUX"),
    createParagraph("Les délibérations des assemblées sont constatées par des procès-verbaux établis sur un registre spécial ou sur des feuilles mobiles, signés par le Président de séance."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE V - COMPTES SOCIAUX"),
    createParagraph(""),
    createHeading2("ARTICLE 17 - EXERCICE SOCIAL"),
    createParagraph(`L'exercice social commence le ${data.exercice_debut} et se termine le ${data.exercice_fin} de chaque année.`),
    createParagraph(""),
    createParagraph(`Par exception, le premier exercice comprendra la période écoulée depuis l'immatriculation de la société jusqu'au ${data.exercice_fin} ${new Date().getFullYear()}.`),
    createParagraph(""),
    createHeading2("ARTICLE 18 - COMPTES ANNUELS"),
    createParagraph("Le Président établit, à la clôture de chaque exercice, les comptes annuels conformément aux dispositions légales et réglementaires en vigueur."),
    createParagraph(""),
    createHeading2("ARTICLE 19 - AFFECTATION DES RÉSULTATS"),
    createParagraph("Le bénéfice distribuable est constitué par le bénéfice de l'exercice, diminué des pertes antérieures et des sommes à porter en réserve en application de la loi, et augmenté du report bénéficiaire."),
    createParagraph(""),
    createParagraph("Sur ce bénéfice, il est prélevé 5% au moins pour constituer le fonds de réserve légale. Ce prélèvement cesse d'être obligatoire lorsque la réserve atteint le dixième du capital social."),
    createParagraph(""),
    createParagraph("Le solde, augmenté le cas échéant du report bénéficiaire, constitue le bénéfice distribuable dont les actionnaires décident l'affectation."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE VI - DISSOLUTION - LIQUIDATION"),
    createParagraph(""),
    createHeading2("ARTICLE 20 - DISSOLUTION"),
    createParagraph("La dissolution de la société résulte des causes prévues par la loi ou d'une décision collective des actionnaires."),
    createParagraph(""),
    createHeading2("ARTICLE 21 - LIQUIDATION"),
    createParagraph("En cas de dissolution, la liquidation est effectuée par un ou plusieurs liquidateurs nommés par décision collective des actionnaires."),
    createParagraph(""),
    createParagraph("Le liquidateur a les pouvoirs les plus étendus pour réaliser l'actif et apurer le passif."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph(""),
    createParagraph("En autant d'exemplaires que de parties"),
    createParagraph(""),
    createParagraph("Les Actionnaires fondateurs :"),
    createParagraph("")
  );

  if (data.actionnaires) {
    data.actionnaires.forEach(act => {
      sections.push(
        createParagraph(""),
        createParagraph(act.nom),
        createParagraph("Signature :"),
        createParagraph("")
      );
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

// ============ SARL GENERATOR ============

async function generateSARL(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Société à Responsabilité Limitée", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(""),
    createSeparator()
  );

  if (data.associes && data.associes.length > 0) {
    sections.push(
      createParagraph("Les soussignés :", { bold: true }),
      createParagraph("")
    );
    data.associes.forEach(assoc => {
      sections.push(createParagraph(`- ${assoc.nom}`));
    });
    sections.push(
      createParagraph(""),
      createParagraph("Ont établi ainsi qu'il suit les statuts d'une société à responsabilité limitée."),
      createParagraph(""),
      createSeparator()
    );
  }

  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une société à responsabilité limitée régie par :"),
    createBulletPoint("Les articles L.223-1 et suivants du Code de commerce"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createParagraph("Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale doit être précédée ou suivie immédiatement des mots « Société à Responsabilité Limitée » ou des initiales « SARL » et de l'énonciation du capital social."),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph("La société a pour objet, en France et à l'étranger :"),
    createParagraph(""),
    createParagraph(data.objet),
    createParagraph(""),
    createParagraph("Et généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire ou connexe."),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à :`),
    createParagraph(""),
    createParagraph(data.siege),
    createParagraph(""),
    createParagraph("Il peut être transféré en tout autre endroit du même département ou d'un département limitrophe par simple décision du gérant, et partout ailleurs en vertu d'une décision des associés."),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf dissolution anticipée ou prorogation.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL - PARTS SOCIALES"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à la somme de ${data.capital} euros.`),
    createParagraph(""),
    createParagraph("Il est divisé en parts sociales de même valeur nominale, entièrement libérées."),
    createParagraph("")
  );

  if (data.associes && data.associes.length > 0) {
    sections.push(
      createParagraph("Répartition du capital :", { bold: true }),
      createParagraph(""),
      createAssociesTable(data.associes),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 7 - CESSION DE PARTS SOCIALES"),
    createParagraph("Les parts sociales sont librement cessibles entre associés."),
    createParagraph(""),
    createParagraph("Elles ne peuvent être cédées à des tiers qu'avec l'agrément de la majorité des associés représentant au moins la moitié des parts sociales."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE III - GÉRANCE"),
    createParagraph(""),
    createHeading2("ARTICLE 8 - NOMINATION DU GÉRANT"),
    createParagraph("La société est gérée par un ou plusieurs gérants, personnes physiques, nommés par les associés."),
    createParagraph("")
  );

  if (data.gerant) {
    sections.push(
      createParagraph("Le premier gérant de la société est :"),
      createParagraph(""),
      createParagraph(data.gerant),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 9 - POUVOIRS DU GÉRANT"),
    createParagraph("Le gérant est investi des pouvoirs les plus étendus pour agir en toutes circonstances au nom de la société, dans la limite de l'objet social et des pouvoirs expressément attribués par la loi aux associés."),
    createParagraph(""),
    createParagraph("Il représente la société dans ses rapports avec les tiers."),
    createParagraph(""),
    createHeading2("ARTICLE 10 - RÉMUNÉRATION"),
    createParagraph("Les associés fixent la rémunération du gérant."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE IV - DÉCISIONS DES ASSOCIÉS"),
    createParagraph(""),
    createHeading2("ARTICLE 11 - ASSEMBLÉES GÉNÉRALES"),
    createParagraph("Les associés sont réunis en assemblée générale au moins une fois par an pour l'approbation des comptes annuels."),
    createParagraph(""),
    createHeading2("ARTICLE 12 - CONSULTATION ÉCRITE"),
    createParagraph("Les décisions collectives peuvent également être prises par consultation écrite des associés."),
    createParagraph(""),
    createHeading2("ARTICLE 13 - MAJORITÉ"),
    createParagraph("Les décisions collectives ordinaires sont adoptées par les associés représentant plus de la moitié des parts sociales."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE V - COMPTES SOCIAUX"),
    createParagraph(""),
    createHeading2("ARTICLE 14 - EXERCICE SOCIAL"),
    createParagraph(`L'exercice social commence le ${data.exercice_debut} et se termine le ${data.exercice_fin} de chaque année.`),
    createParagraph(""),
    createHeading2("ARTICLE 15 - COMPTES ANNUELS"),
    createParagraph("Le gérant établit, à la clôture de chaque exercice, les comptes annuels conformément aux dispositions légales et réglementaires en vigueur."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE VI - DISSOLUTION - LIQUIDATION"),
    createParagraph(""),
    createHeading2("ARTICLE 16 - DISSOLUTION"),
    createParagraph("La dissolution de la société résulte des causes prévues par la loi ou d'une décision des associés."),
    createParagraph(""),
    createHeading2("ARTICLE 17 - LIQUIDATION"),
    createParagraph("En cas de dissolution, la liquidation est effectuée par un ou plusieurs liquidateurs nommés par les associés."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph(""),
    createParagraph("En autant d'exemplaires que de parties"),
    createParagraph(""),
    createParagraph("Les Associés fondateurs :"),
    createParagraph("")
  );

  if (data.associes) {
    data.associes.forEach(assoc => {
      sections.push(
        createParagraph(""),
        createParagraph(assoc.nom),
        createParagraph("Signature :"),
        createParagraph("")
      );
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

// ============ METTRE À JOUR LA FONCTION EXPORT ============
// Remplacer la fonction export existante par celle-ci :

// ============ PARTIE 3 FINALE - À AJOUTER APRÈS generateSARL ============

// ============ EURL GENERATOR ============

async function generateEURL(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Entreprise Unipersonnelle à Responsabilité Limitée", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(""),
    createSeparator()
  );

  if (data.gerant) {
    sections.push(
      createParagraph("Le soussigné :", { bold: true }),
      createParagraph(""),
      createParagraph(data.gerant),
      createParagraph(""),
      createParagraph("A établi ainsi qu'il suit les statuts d'une entreprise unipersonnelle à responsabilité limitée."),
      createParagraph(""),
      createSeparator()
    );
  }

  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une entreprise unipersonnelle à responsabilité limitée régie par :"),
    createBulletPoint("Les articles L.223-1 et suivants du Code de commerce"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createParagraph("Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale doit être précédée ou suivie immédiatement des mots « Entreprise Unipersonnelle à Responsabilité Limitée » ou des initiales « EURL » et de l'énonciation du capital social."),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph("La société a pour objet, en France et à l'étranger :"),
    createParagraph(""),
    createParagraph(data.objet),
    createParagraph(""),
    createParagraph("Et généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières pouvant se rattacher directement ou indirectement à l'objet social ou à tout objet similaire ou connexe."),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à :`),
    createParagraph(""),
    createParagraph(data.siege),
    createParagraph(""),
    createParagraph("Il peut être transféré en tout autre endroit par décision de l'associé unique."),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf dissolution anticipée ou prorogation.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL - PARTS SOCIALES"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à la somme de ${data.capital} euros.`),
    createParagraph(""),
    createParagraph("Il est divisé en parts sociales de même valeur nominale, entièrement libérées, toutes attribuées à l'associé unique."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE III - GÉRANCE"),
    createParagraph(""),
    createHeading2("ARTICLE 7 - NOMINATION DU GÉRANT"),
    createParagraph("La société est gérée par un gérant, personne physique, nommé par l'associé unique."),
    createParagraph("")
  );

  if (data.gerant) {
    sections.push(
      createParagraph("Le premier gérant de la société est :"),
      createParagraph(""),
      createParagraph(data.gerant),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 8 - POUVOIRS DU GÉRANT"),
    createParagraph("Le gérant est investi des pouvoirs les plus étendus pour agir en toutes circonstances au nom de la société, dans la limite de l'objet social."),
    createParagraph(""),
    createParagraph("Il représente la société dans ses rapports avec les tiers."),
    createParagraph(""),
    createHeading2("ARTICLE 9 - RÉMUNÉRATION"),
    createParagraph("L'associé unique fixe la rémunération du gérant."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE IV - DÉCISIONS DE L'ASSOCIÉ UNIQUE"),
    createParagraph(""),
    createHeading2("ARTICLE 10 - DÉCISIONS DE L'ASSOCIÉ UNIQUE"),
    createParagraph("L'associé unique exerce les pouvoirs dévolus à l'assemblée des associés dans les SARL pluripersonnelles."),
    createParagraph(""),
    createParagraph("Ses décisions sont prises par écrit et consignées dans un registre."),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE V - COMPTES SOCIAUX"),
    createParagraph(""),
    createHeading2("ARTICLE 11 - EXERCICE SOCIAL"),
    createParagraph(`L'exercice social commence le ${data.exercice_debut} et se termine le ${data.exercice_fin} de chaque année.`),
    createParagraph(""),
    createHeading2("ARTICLE 12 - COMPTES ANNUELS"),
    createParagraph("Le gérant établit, à la clôture de chaque exercice, les comptes annuels conformément aux dispositions légales et réglementaires en vigueur."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE VI - DISSOLUTION - LIQUIDATION"),
    createParagraph(""),
    createHeading2("ARTICLE 13 - DISSOLUTION"),
    createParagraph("La dissolution de la société résulte des causes prévues par la loi ou d'une décision de l'associé unique."),
    createParagraph(""),
    createHeading2("ARTICLE 14 - LIQUIDATION"),
    createParagraph("En cas de dissolution, la liquidation est effectuée par un liquidateur nommé par l'associé unique."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph(""),
    createParagraph("En autant d'exemplaires que de parties"),
    createParagraph(""),
    createParagraph("L'Associé Unique et Gérant,"),
    createParagraph(data.gerant || ""),
    createParagraph(""),
    createParagraph("Signature :"),
    createParagraph("")
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

// ============ SCI GENERATOR ============

async function generateSCI(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Société Civile Immobilière", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(""),
    createSeparator()
  );

  if (data.associes && data.associes.length > 0) {
    sections.push(
      createParagraph("Les soussignés :", { bold: true }),
      createParagraph("")
    );
    data.associes.forEach(assoc => {
      sections.push(createParagraph(`- ${assoc.nom}`));
    });
    sections.push(
      createParagraph(""),
      createParagraph("Ont établi ainsi qu'il suit les statuts d'une société civile immobilière."),
      createParagraph(""),
      createSeparator()
    );
  }

  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une société civile immobilière régie par :"),
    createBulletPoint("Les articles 1832 et suivants du Code civil"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph("La société a pour objet :"),
    createParagraph(""),
    createParagraph(data.objet),
    createParagraph(""),
    createParagraph("Et plus généralement, toutes opérations civiles pouvant se rattacher directement ou indirectement à l'objet social."),
    createParagraph(""),
    createParagraph("La société ne pourra en aucun cas exercer une activité commerciale."),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à :`),
    createParagraph(""),
    createParagraph(data.siege),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années à compter de son immatriculation au Registre du Commerce et des Sociétés.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL - PARTS SOCIALES"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à la somme de ${data.capital} euros.`),
    createParagraph(""),
    createParagraph("Il est divisé en parts sociales de même valeur nominale."),
    createParagraph("")
  );

  if (data.associes && data.associes.length > 0) {
    sections.push(
      createParagraph("Répartition du capital :", { bold: true }),
      createParagraph(""),
      createAssociesTable(data.associes),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 7 - CESSION DE PARTS SOCIALES"),
    createParagraph("Les parts sociales sont librement cessibles entre associés."),
    createParagraph(""),
    createParagraph("Elles ne peuvent être cédées à des tiers qu'avec l'agrément unanime des associés."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE III - GÉRANCE"),
    createParagraph(""),
    createHeading2("ARTICLE 8 - NOMINATION DU GÉRANT"),
    createParagraph("La société est gérée par un ou plusieurs gérants nommés par les associés."),
    createParagraph("")
  );

  if (data.gerant) {
    sections.push(
      createParagraph("Le premier gérant de la société est :"),
      createParagraph(""),
      createParagraph(data.gerant),
      createParagraph("")
    );
  }

  sections.push(
    createHeading2("ARTICLE 9 - POUVOIRS DU GÉRANT"),
    createParagraph("Le gérant est investi des pouvoirs les plus étendus pour agir au nom de la société, dans la limite de l'objet social."),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE IV - DÉCISIONS DES ASSOCIÉS"),
    createParagraph(""),
    createHeading2("ARTICLE 10 - ASSEMBLÉES GÉNÉRALES"),
    createParagraph("Les associés se réunissent en assemblée générale au moins une fois par an."),
    createParagraph(""),
    createHeading2("ARTICLE 11 - MAJORITÉ"),
    createParagraph("Les décisions sont prises à la majorité des parts sociales, sauf dispositions légales contraires."),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE V - COMPTES SOCIAUX"),
    createParagraph(""),
    createHeading2("ARTICLE 12 - EXERCICE SOCIAL"),
    createParagraph(`L'exercice social commence le ${data.exercice_debut} et se termine le ${data.exercice_fin} de chaque année.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE VI - DISSOLUTION - LIQUIDATION"),
    createParagraph(""),
    createHeading2("ARTICLE 13 - DISSOLUTION"),
    createParagraph("La dissolution de la société résulte des causes prévues par la loi ou d'une décision des associés."),
    createParagraph(""),
    createHeading2("ARTICLE 14 - LIQUIDATION"),
    createParagraph("En cas de dissolution, la liquidation est effectuée par un liquidateur nommé par les associés."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph(""),
    createParagraph("Les Associés :"),
    createParagraph("")
  );

  if (data.associes) {
    data.associes.forEach(assoc => {
      sections.push(
        createParagraph(""),
        createParagraph(assoc.nom),
        createParagraph("Signature :"),
        createParagraph("")
      );
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

// ============ SEL GENERATORS (SELARL, SELARLU, SELAS, SELASU) ============

async function generateSELARL(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Société d'Exercice Libéral à Responsabilité Limitée", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(`Profession exercée : ${data.profession || "Profession libérale"}`, { center: true }),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une société d'exercice libéral à responsabilité limitée régie par :"),
    createBulletPoint("La loi n°90-1258 du 31 décembre 1990 relative à l'exercice sous forme de sociétés des professions libérales"),
    createBulletPoint("Les articles L.223-1 et suivants du Code de commerce"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph(`La société a pour objet l'exercice de la profession de ${data.profession || "profession libérale"}.`),
    createParagraph(""),
    createParagraph(data.objet_professionnel || data.objet),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à : ${data.siege}`),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à ${data.capital} euros, divisé en parts sociales.`),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE III - GÉRANCE"),
    createParagraph(""),
    createHeading2("ARTICLE 7 - GÉRANT"),
    createParagraph("La société est gérée par un ou plusieurs gérants, obligatoirement professionnels en exercice."),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE IV - EXERCICE PROFESSIONNEL"),
    createParagraph(""),
    createHeading2("ARTICLE 8 - EXERCICE DE LA PROFESSION"),
    createParagraph("Les associés exercent leur profession au sein de la société dans le respect des règles déontologiques qui leur sont applicables."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph("")
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

async function generateSELARLU(data: CompanyData): Promise<Uint8Array> {
  // SELARLU = SELARL unipersonnelle
  const modifiedData = { ...data, denomination: data.denomination };
  const buffer = await generateSELARL(modifiedData);
  // Pour simplifier, on réutilise SELARL avec mention "unipersonnelle"
  return buffer;
}

async function generateSELAS(data: CompanyData): Promise<Uint8Array> {
  const sections: any[] = [];
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  sections.push(
    createTitle("STATUTS"),
    createParagraph(""),
    createHeading1(data.denomination),
    createParagraph(""),
    createParagraph("Société d'Exercice Libéral par Actions Simplifiée", { center: true, bold: true }),
    createParagraph(`Capital social : ${data.capital} euros`, { center: true }),
    createParagraph(`Profession exercée : ${data.profession || "Profession libérale"}`, { center: true }),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE I - FORME - DÉNOMINATION - OBJET - SIÈGE - DURÉE"),
    createParagraph(""),
    createHeading2("ARTICLE 1 - FORME"),
    createParagraph("Il est formé une société d'exercice libéral par actions simplifiée régie par :"),
    createBulletPoint("La loi n°90-1258 du 31 décembre 1990"),
    createBulletPoint("Les articles L.227-1 et suivants du Code de commerce"),
    createBulletPoint("Les présents statuts"),
    createParagraph(""),
    createHeading2("ARTICLE 2 - DÉNOMINATION SOCIALE"),
    createParagraph(`La dénomination sociale de la société est : ${data.denomination}`),
    createParagraph(""),
    createHeading2("ARTICLE 3 - OBJET SOCIAL"),
    createParagraph(`La société a pour objet l'exercice de la profession de ${data.profession || "profession libérale"}.`),
    createParagraph(""),
    createParagraph(data.objet_professionnel || data.objet),
    createParagraph(""),
    createHeading2("ARTICLE 4 - SIÈGE SOCIAL"),
    createParagraph(`Le siège social est fixé à : ${data.siege}`),
    createParagraph(""),
    createHeading2("ARTICLE 5 - DURÉE"),
    createParagraph(`La durée de la société est fixée à ${data.duree} années.`),
    createParagraph(""),
    createSeparator(),
    new Paragraph({ children: [new PageBreak()] }),
    createHeading1("TITRE II - CAPITAL SOCIAL"),
    createParagraph(""),
    createHeading2("ARTICLE 6 - CAPITAL SOCIAL"),
    createParagraph(`Le capital social est fixé à ${data.capital} euros, divisé en actions.`),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE III - DIRECTION"),
    createParagraph(""),
    createHeading2("ARTICLE 7 - PRÉSIDENT"),
    createParagraph("La société est dirigée par un Président, obligatoirement professionnel en exercice."),
    createParagraph(""),
    createSeparator(),
    createHeading1("TITRE IV - EXERCICE PROFESSIONNEL"),
    createParagraph(""),
    createHeading2("ARTICLE 8 - EXERCICE DE LA PROFESSION"),
    createParagraph("Les actionnaires exercent leur profession au sein de la société dans le respect des règles déontologiques."),
    createParagraph(""),
    createSeparator(),
    createParagraph(""),
    createParagraph(`Fait à ${data.siege.split(',')[0]}, le ${today}`),
    createParagraph("")
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

async function generateSELASU(data: CompanyData): Promise<Uint8Array> {
  // SELASU = SELAS unipersonnelle
  return generateSELAS(data);
}

// ============ FONCTION EXPORT FINALE ============
// Remplacer complètement la fonction export par celle-ci :

export async function generateStatuts(data: CompanyData): Promise<Uint8Array> {
  switch (data.type) {
    case 'SASU':
      return generateSASU(data);
    case 'SAS':
      return generateSAS(data);
    case 'SARL':
      return generateSARL(data);
    case 'EURL':
      return generateEURL(data);
    case 'SCI':
      return generateSCI(data);
    case 'SELARL':
      return generateSELARL(data);
    case 'SELARLU':
      return generateSELARLU(data);
    case 'SELAS':
      return generateSELAS(data);
    case 'SELASU':
      return generateSELASU(data);
    default:
      throw new Error(`Type de société non supporté : ${data.type}`);
  }
}