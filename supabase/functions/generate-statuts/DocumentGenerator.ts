// DocumentGenerator.ts - Unified document generation for all company types
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak, BorderStyle, WidthType, Table, TableRow, TableCell } from "npm:docx@8.5.0";

interface CompanyData {
  type: 'SASU' | 'SAS' | 'SARL' | 'EURL' | 'SCI' | 'SELARL' | 'SELARLU' | 'SELAS' | 'SELASU';
  denomination: string;
  objet?: string;
  objet_professionnel?: string;
  profession?: string;
  siege: string;
  duree: string;
  capital: string;
  apports: string;
  president?: string; // For SAS-types
  gerant?: string; // For SARL-types
  actionnaires?: Array<{nom: string; apport: string; actions: number; pourcentage: number}>;
  associes?: Array<{nom: string; apport: string; parts: number; pourcentage: number}>;
  exercice_debut: string;
  exercice_fin: string;
  commissaire_comptes?: string;
}

// Shared styling
const getStyles = () => ({
  default: { document: { run: { font: "Arial", size: 24 } } },
  paragraphStyles: [
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 32, bold: true, font: "Arial", color: "1F4E78" },
      paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0, alignment: AlignmentType.CENTER }
    },
    {
      id: "ArticleTitle",
      name: "Article Title",
      basedOn: "Normal",
      next: "Normal",
      run: { size: 24, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 240, after: 120 } }
    }
  ]
});

// Border for tables
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

// Generate table for shareholders/associates
function generateShareholderTable(data: CompanyData, labelType: 'Actions' | 'Parts') {
  const shares = data.actionnaires || data.associes || [];
  const rows = shares.map(sh => 
    new TableRow({
      children: [
        new TableCell({ borders, width: { size: 3000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun(sh.nom)] })] }),
        new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun(sh.apport)] })] }),
        new TableCell({ borders, width: { size: 1513, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(((sh as any).actions || (sh as any).parts).toString())] })] }),
        new TableCell({ borders, width: { size: 1513, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(sh.pourcentage + '%')] })] })
      ]
    })
  );

  return new Table({
    width: { size: 8026, type: WidthType.DXA },
    columnWidths: [3000, 2000, 1513, 1513],
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders, width: { size: 3000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: "Associé/Actionnaire", bold: true })] })] }),
          new TableCell({ borders, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: "Apport (€)", bold: true })] })] }),
          new TableCell({ borders, width: { size: 1513, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: labelType, bold: true })] })] }),
          new TableCell({ borders, width: { size: 1513, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "%", bold: true })] })] })
        ]
      }),
      ...rows
    ]
  });
}

export async function generateStatuts(data: CompanyData): Promise<Buffer> {
  let titleText = "";
  let managerLabel = "";
  let managerName = "";
  
  // Determine document title and manager type
  switch(data.type) {
    case 'SASU':
      titleText = "SOCIÉTÉ PAR ACTIONS SIMPLIFIÉE UNIPERSONNELLE";
      managerLabel = "Président";
      managerName = data.president || "";
      break;
    case 'SAS':
      titleText = "SOCIÉTÉ PAR ACTIONS SIMPLIFIÉE";
      managerLabel = "Président";
      managerName = data.president || "";
      break;
    case 'SARL':
      titleText = "SOCIÉTÉ À RESPONSABILITÉ LIMITÉE";
      managerLabel = "Gérant";
      managerName = data.gerant || "";
      break;
    case 'EURL':
      titleText = "ENTREPRISE UNIPERSONNELLE À RESPONSABILITÉ LIMITÉE";
      managerLabel = "Gérant";
      managerName = data.gerant || "";
      break;
    case 'SCI':
      titleText = "SOCIÉTÉ CIVILE IMMOBILIÈRE";
      managerLabel = "Gérant";
      managerName = data.gerant || "";
      break;
    case 'SELARL':
      titleText = `SOCIÉTÉ D'EXERCICE LIBÉRAL À RESPONSABILITÉ LIMITÉE - ${data.profession}`;
      managerLabel = "Gérant";
      managerName = data.gerant || "";
      break;
    case 'SELARLU':
      titleText = `SELARL UNIPERSONNELLE - ${data.profession}`;
      managerLabel = "Gérant";
      managerName = data.gerant || "";
      break;
    case 'SELAS':
      titleText = `SOCIÉTÉ D'EXERCICE LIBÉRAL PAR ACTIONS SIMPLIFIÉE - ${data.profession}`;
      managerLabel = "Président";
      managerName = data.president || "";
      break;
    case 'SELASU':
      titleText = `SELAS UNIPERSONNELLE - ${data.profession}`;
      managerLabel = "Président";
      managerName = data.president || "";
      break;
  }

  const doc = new Document({
    styles: getStyles(),
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // Title page
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("STATUTS")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 },
          children: [new TextRun({ text: titleText, size: 28, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 480 },
          children: [new TextRun({ text: data.denomination, size: 32, bold: true, color: "1F4E78" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240 },
          children: [new TextRun({ text: `Capital social : ${data.capital} €`, size: 26 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Siège social : ${data.siege}`, size: 24 })] }),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        // Articles
        new Paragraph({ style: "ArticleTitle", children: [new TextRun("ARTICLE 1 - FORME")] }),
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun(`La Société est régie par les dispositions légales applicables.`)] }),
        
        new Paragraph({ style: "ArticleTitle", children: [new TextRun("ARTICLE 2 - OBJET")] }),
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun(data.objet || data.objet_professionnel || "")] }),
        
        new Paragraph({ style: "ArticleTitle", children: [new TextRun("ARTICLE 3 - CAPITAL")] }),
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun(`Le capital social est fixé à ${data.capital} euros.`)] }),
        
        // Add shareholder table if multi-shareholder
        ...((data.actionnaires && data.actionnaires.length > 0) || (data.associes && data.associes.length > 0) ? [
          generateShareholderTable(data, data.actionnaires ? 'Actions' : 'Parts')
        ] : []),
        
        new Paragraph({ children: [new PageBreak()] }),
        
        new Paragraph({ style: "ArticleTitle", children: [new TextRun(`ARTICLE 4 - ${managerLabel.toUpperCase()}`)] }),
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun(`${managerLabel} : ${managerName}`)] }),
        
        new Paragraph({ style: "ArticleTitle", children: [new TextRun("ARTICLE 5 - EXERCICE SOCIAL")] }),
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun(`Du ${data.exercice_debut} au ${data.exercice_fin}.`)] }),
        
        // Signatures
        new Paragraph({ spacing: { before: 480, after: 240 },
          children: [new TextRun({ text: "Fait en autant d'exemplaires que de parties.", italic: true })] }),
        new Paragraph({ spacing: { before: 240 },
          children: [new TextRun({ text: `À ${data.siege}, le _____________`, italic: true })] }),
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}
