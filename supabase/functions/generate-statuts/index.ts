// supabase/functions/generate-statuts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateStatuts } from "./DocumentGenerator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Récupérer l'utilisateur authentifié
    const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // CORRECTION: Récupérer l'ID de la table users avec auth_id
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    if (userDataError || !userData) {
      return new Response(JSON.stringify({ error: 'User not found in database' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const userId = userData.id; // Maintenant on a le bon user_id

    const { company_id } = await req.json();
    
    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch company data avec le bon user_id
    const { data: company, error: companyError } = await supabaseClient
      .from('company_creation_data')
      .select('*')
      .eq('id', company_id)
      .eq('user_id', userId) // Utilise le user_id de la table users
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Fetch shareholders avec le user_id de la table users
    const { data: shareholders } = await supabaseClient
      .from('company_shareholders')
      .select('*')
      .eq('user_id', userId);

    // Build president/gerant info
    const managerInfo = company.president_first_name && company.president_last_name
      ? `${company.president_first_name} ${company.president_last_name}, né(e) le ${company.president_birth_date || '[DATE]'} à ${company.president_birth_place || '[LIEU]'}, de nationalité ${company.president_nationality || 'française'}, demeurant ${company.president_address || company.address_line1}`
      : 'À COMPLETER';

    // Build full address
    const fullAddress = [
      company.address_line1,
      company.address_line2,
      company.postal_code,
      company.city,
      company.country
    ].filter(Boolean).join(', ');

    // Prepare data for document generation
    const companyData: any = {
      type: company.company_type,
      denomination: company.company_name,
      objet: company.activity_description,
      siege: fullAddress,
      duree: company.duree || "99",
      capital: company.capital_amount?.toString() || "0",
      apports: company.apports || `Apports en numéraire d'un montant de ${company.capital_amount} euros.`,
      exercice_debut: company.exercice_debut || "1er janvier",
      exercice_fin: company.exercice_fin || "31 décembre",
    };

    // Add shareholders if they exist
    if (shareholders && shareholders.length > 0) {
      const mappedShareholders = shareholders.map((s: any) => ({
        nom: `${s.first_name} ${s.last_name}`,
        apport: s.apport_numeraire?.toString() || "0",
        actions: s.shares_count || 0,
        parts: s.shares_count || 0,
        pourcentage: s.shares_percentage || 0
      }));

      // For SAS/SASU/SELAS/SELASU use actionnaires
      if (['SASU', 'SAS', 'SELAS', 'SELASU'].includes(company.company_type)) {
        companyData.actionnaires = mappedShareholders;
      } else {
        // For SARL/EURL/SCI/SELARL/SELARLU use associes
        companyData.associes = mappedShareholders;
      }
    }

    // Add president or gérant based on company type
    if (['SASU', 'SAS', 'SELAS', 'SELASU'].includes(company.company_type)) {
      companyData.president = managerInfo;
    } else {
      companyData.gerant = company.gerant || managerInfo;
    }

    // Add profession for SEL (professions libérales)
    if (company.company_type?.startsWith('SEL')) {
      companyData.profession = company.profession || 'Profession libérale';
      companyData.objet_professionnel = company.activity_description;
    }

    // Generate document
    const buffer = await generateStatuts(companyData);

    // Store document in Supabase Storage avec authUser.id pour le path
    const fileName = `statuts-${company.company_name.replace(/\s+/g, '-')}-${Date.now()}.docx`;
    const { error: uploadError } = await supabaseClient
      .storage
      .from('documents')
      .upload(`${authUser.id}/${company_id}/${fileName}`, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('documents')
      .getPublicUrl(`${authUser.id}/${company_id}/${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        fileName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating statuts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});