import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: /api/client/documents
 * Récupère les documents téléchargeables (tous accessibles aux 3 packs)
 */

interface Document {
  id: string;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  file_path: string;
  category: string;
}

interface DocumentsByCategory {
  [category: string]: Array<{
    id: string;
    title: string;
    description: string;
    file_type: string;
    file_url: string;
    file_path: string;
  }>;
}

export async function GET(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Récupérer le pack de l'utilisateur depuis la table users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('pack')
      .eq('auth_id', user.id)
      .single();

    if (userError) {
      console.error('Erreur récupération user:', userError);
      return NextResponse.json(
        { error: 'Erreur récupération utilisateur' },
        { status: 500 }
      );
    }

    const userPack = userData?.pack?.toLowerCase() || 'starter';

    // 3. Récupérer TOUS les documents actifs (plus de filtrage par pack)
    const { data: allDocuments, error: docsError } = await supabaseAdmin
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('display_order');

    if (docsError) {
      console.error('Erreur documents:', docsError);
      return NextResponse.json(
        { error: 'Erreur récupération documents' },
        { status: 500 }
      );
    }

    // 4. Grouper par catégorie pour faciliter l'affichage
    const documentsByCategory: DocumentsByCategory = (allDocuments || []).reduce(
      (acc: DocumentsByCategory, doc: Document) => {
        if (!acc[doc.category]) {
          acc[doc.category] = [];
        }
        acc[doc.category].push({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          file_type: doc.file_type,
          file_url: doc.file_url,
          file_path: doc.file_path,
        });
        return acc;
      },
      {}
    );

    return NextResponse.json({
      documents: documentsByCategory,
      userPack,
      totalDocuments: allDocuments?.length || 0,
    });

  } catch (error) {
    console.error('Erreur API documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}