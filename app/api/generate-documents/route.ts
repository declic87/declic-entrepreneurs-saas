import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  DOCUMENTS_BY_STATUT,
  getDocumentsForStatut,
  getProfessionLabel,
  getProfessionOrdre,
  getProfessionCode,
  ProfessionReglementee
} from '@/config/documents-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 });
    }

    console.log('🚀 Génération des documents pour user:', userId);

    // 1️⃣ Récupérer les données de création
    const { data: companyData, error: dataError } = await supabase
      .from('company_creation_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (dataError || !companyData) {
      return NextResponse.json({ error: 'Données introuvables' }, { status: 404 });
    }

    const companyType = companyData.company_type;
    const profession = companyData.profession; // Pour les SEL

    if (!companyType) {
      return NextResponse.json({ error: 'Type de société non défini' }, { status: 400 });
    }

    console.log(`📋 Statut: ${companyType}${profession ? ` - Profession: ${profession}` : ''}`);

    // 2️⃣ Récupérer la liste des documents à générer
    const documentsToGenerate = getDocumentsForStatut(companyType, profession as ProfessionReglementee);

    if (documentsToGenerate.length === 0) {
      return NextResponse.json({ error: `Aucun document défini pour ${companyType}` }, { status: 400 });
    }

    // 3️⃣ Préparer les données pour les templates
    const templateData = prepareTemplateData(companyData, profession as ProfessionReglementee);

    // 4️⃣ Générer tous les documents
    const generatedDocs = [];

    for (const docConfig of documentsToGenerate) {
      try {
        console.log(`📄 Génération de ${docConfig.label}...`);

        const docBuffer = await generateDocumentFromTemplate(
          docConfig.template,
          templateData
        );

        const fileName = `${docConfig.type}_${Date.now()}.docx`;
        const filePath = `${userId}/generated/${fileName}`;

        // Upload dans Storage
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(filePath, docBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: false,
          });

        if (uploadError) {
          console.error(`❌ Erreur upload ${docConfig.type}:`, uploadError);
          continue;
        }

        // Insérer dans la DB
        const { data: dbDoc, error: dbError } = await supabase
          .from('company_documents')
          .insert({
            user_id: userId,
            document_type: docConfig.type,
            file_name: `${docConfig.label}.docx`,
            file_path: filePath,
            source: 'generated',
            status: 'pending',
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!dbError && dbDoc) {
          generatedDocs.push(dbDoc);
          console.log(`✅ ${docConfig.label} généré`);
        }
      } catch (error) {
        console.error(`❌ Erreur génération ${docConfig.label}:`, error);
      }
    }

    // 5️⃣ Mettre à jour le workflow
    await supabase
      .from('company_creation_data')
      .update({
        step: 'signature',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    console.log(`✅ Génération terminée: ${generatedDocs.length}/${documentsToGenerate.length} documents`);

    return NextResponse.json({
      success: true,
      documents: generatedDocs,
      message: `${generatedDocs.length} document(s) généré(s) avec succès`,
    });

  } catch (error: any) {
    console.error('❌ Erreur génération:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur de génération' },
      { status: 500 }
    );
  }
}

// 🔧 Préparer les données pour les templates
function prepareTemplateData(companyData: any, profession?: ProfessionReglementee) {
  const baseData = {
    // Société
    company_name: companyData.company_name || 'NOM DE LA SOCIÉTÉ',
    company_type: companyData.company_type || 'SOCIÉTÉ',
    capital_amount: companyData.capital_amount || '0',
    capital_amount_words: numberToWords(companyData.capital_amount || 0),
    activity_description: companyData.activity_description || 'Activité non définie',
    
    // Adresse
    address_line1: companyData.address_line1 || '',
    address_line2: companyData.address_line2 || '',
    postal_code: companyData.postal_code || '',
    city: companyData.city || '',
    country: companyData.country || 'France',
    
    // Dirigeant
    president_first_name: companyData.president_first_name || '',
    president_last_name: companyData.president_last_name || '',
    president_full_name: `${companyData.president_first_name || ''} ${companyData.president_last_name || ''}`.trim(),
    president_birth_date: formatDate(companyData.president_birth_date),
    president_birth_place: companyData.president_birth_place || '',
    president_nationality: companyData.president_nationality || 'Française',
    president_address: companyData.president_address || '',
    
    // Banque
    bank_name: companyData.bank_name || '',
    iban: companyData.iban || '',
    
    // Dates
    today_date: formatDate(new Date()),
    today_date_long: formatDateLong(new Date()),
    year: new Date().getFullYear().toString(),
    month: formatMonth(new Date()),
    day: new Date().getDate().toString(),
    
    // Durée
    duree: companyData.duree || '99',
  };

  // Ajouter les données spécifiques aux SEL
  if (profession) {
    return {
      ...baseData,
      profession: profession,
      profession_label: getProfessionLabel(profession),
      profession_ordre: getProfessionOrdre(profession),
      profession_code_legal: getProfessionCode(profession),
      is_profession_sante: ['medecin', 'kine', 'infirmier', 'dentiste', 'veterinaire'].includes(profession),
      is_profession_juridique: ['avocat'].includes(profession),
      is_profession_comptable: ['expert_comptable'].includes(profession),
      is_profession_architecture: ['architecte'].includes(profession),
    };
  }

  return baseData;
}

// 📄 Générer un document à partir d'un template
async function generateDocumentFromTemplate(templatePath: string, data: any): Promise<Buffer> {
  try {
    // Chemin absolu vers le template
    const fullPath = join(process.cwd(), 'public', 'templates', templatePath);
    
    // Lire le template
    const content = readFileSync(fullPath, 'binary');
    
    // Créer le zip
    const zip = new PizZip(content);
    
    // Créer l'instance docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Remplir les données
    doc.render(data);

    // Générer le buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buffer;
  } catch (error) {
    console.error(`Erreur template ${templatePath}:`, error);
    throw error;
  }
}

// 🔧 Helpers de formatage
function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
}

function formatDateLong(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatMonth(date: Date): string {
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return months[date.getMonth()];
}

function numberToWords(num: number): string {
  // Implémentation basique - à améliorer
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
  
  // Pour les nombres plus grands, retourner le chiffre
  return num.toString();
}