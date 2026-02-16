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

    // Lire le body
    const { company_id } = await req.json();
    
    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Authentification
    let userId: string;

    // Vérifier s'il y a un JWT utilisateur valide
    const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (authUser) {
      // Auth utilisateur normale - récupérer le user_id de la table users
      console.log('User auth detected:', authUser.id);
      
      const { data: userData, error: userDataError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (userDataError || !userData) {
        console.error('User lookup failed:', userDataError);
        return new Response(JSON.stringify({ 
          error: 'User not found in database',
          details: userDataError?.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      
      userId = userData.id;
      console.log('Using userId from auth:', userId);
      
    } else {
      // Pas d'auth utilisateur - vérifier via company_id
      console.log('No user auth, fetching from company');
      
      const { data: companyLookup, error: lookupError } = await supabaseClient
        .from('company_creation_data')
        .select('user_id')
        .eq('id', company_id)
        .single();
      
      if (lookupError || !companyLookup) {
        console.error('Company lookup failed:', lookupError);
        return new Response(JSON.stringify({ 
          error: 'Company not found or unauthorized',
          details: lookupError?.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      
      userId = companyLookup.user_id;
      console.log('Using userId from company:', userId);
    }

    // Fetch company data
    const { data: company, error: companyError } = await supabaseClient
      .from('company_creation_data')
      .select('*')
      .eq('id', company_id)
      .eq('user_id', userId)
      .single();

    if (companyError || !company) {
      console.error('Company fetch failed:', companyError);
      return new Response(JSON.stringify({ 
        error: 'Company not found',
        details: companyError?.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Company found:', company.company_name);

    // Fetch shareholders
    const { data: shareholders } = await supabaseClient
      .from('company_shareholders')
      .select('*')
      .eq('user_id', userId);

    console.log('Shareholders found:', shareholders?.length || 0);

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

      if (['SASU', 'SAS', 'SELAS', 'SELASU'].includes(company.company_type)) {
        companyData.actionnaires = mappedShareholders;
      } else {
        companyData.associes = mappedShareholders;
      }
    }

    // Add president or gérant
    if (['SASU', 'SAS', 'SELAS', 'SELASU'].includes(company.company_type)) {
      companyData.president = managerInfo;
    } else {
      companyData.gerant = company.gerant || managerInfo;
    }

    // Add profession for SEL
    if (company.company_type?.startsWith('SEL')) {
      companyData.profession = company.profession || 'Profession libérale';
      companyData.objet_professionnel = company.activity_description;
    }

    console.log('Generating document for:', company.company_name);

    // Generate document
    const buffer = await generateStatuts(companyData);

    console.log('Document generated, size:', buffer.byteLength);

    // Store document
    const fileName = `statuts-${company.company_name.replace(/\s+/g, '-')}-${Date.now()}.docx`;
    
    console.log('Uploading to:', `${userId}/${fileName}`);

    const { error: uploadError } = await supabaseClient
      .storage
      .from('company-documents')
      .upload(`${userId}/${fileName}`, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful');

    // Créer une URL signée (valide 1 heure)
    const { data: urlData, error: signedError } = await supabaseClient
      .storage
      .from('company-documents')
      .createSignedUrl(`${userId}/${fileName}`, 3600);

    if (signedError) {
      console.error('Signed URL creation failed:', signedError);
      throw signedError;
    }

    console.log('Document signed URL created');

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.signedUrl,
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