interface WelcomeEmailParams {
    firstName: string;
    email: string;
    password: string;
    packType: string;
    loginUrl: string;
  }
  
  const PACK_NAMES: Record<string, string> = {
    plateforme: 'Pack Plateforme',
    createur: 'Formation Créateur',
    agent_immo: 'Formation Agent Immobilier',
    starter: 'Pack Starter',
    pro: 'Pack Pro',
    expert: 'Pack Expert',
  };
  
  export function generateWelcomeEmail(params: WelcomeEmailParams): string {
    const { firstName, email, password, packType, loginUrl } = params;
    const packName = PACK_NAMES[packType] || 'Pack';
  
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .content { background: white; padding: 40px; border: 1px solid #eee; border-top: none; }
      .credentials { background: #f8f9fa; border-left: 4px solid #e67e22; padding: 20px; margin: 20px 0; border-radius: 5px; }
      .button { display: inline-block; background: #e67e22; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Bienvenue chez DÉCLIC Entrepreneurs !</h1>
      </div>
      <div class="content">
        <p>Bonjour ${firstName},</p>
        
        <p>Félicitations ! Votre compte <strong>${packName}</strong> a été créé avec succès.</p>
        
        <p>Vous pouvez dès maintenant accéder à votre espace personnel et commencer votre accompagnement.</p>
        
        <div class="credentials">
          <h3 style="margin-top: 0; color: #e67e22;">🔐 Vos identifiants de connexion</h3>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Mot de passe temporaire :</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${password}</code></p>
        </div>
        
        <p style="color: #d35400; font-weight: bold;">⚠️ Important : Pensez à changer votre mot de passe lors de votre première connexion.</p>
        
        <center>
          <a href="${loginUrl}" class="button">🚀 Accéder à mon espace</a>
        </center>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <h3>📦 Votre pack inclut :</h3>
        <ul>
          ${getPackFeatures(packType)}
        </ul>
        
        <p>Si vous avez la moindre question, notre équipe est là pour vous accompagner.</p>
        
        <p>À très bientôt sur la plateforme ! 🚀</p>
        
        <p><strong>L'équipe DÉCLIC Entrepreneurs</strong></p>
      </div>
      <div class="footer">
        <p>DÉCLIC Entrepreneurs - Optimisation fiscale et juridique</p>
        <p>contact@declic-entrepreneurs.fr</p>
      </div>
    </div>
  </body>
  </html>
    `.trim();
  }
  
  function getPackFeatures(packType: string): string {
    const features: Record<string, string[]> = {
      plateforme: [
        'Accès aux tutoriels vidéo',
        'Coaching hebdomadaire',
        'Ateliers en direct',
        'Accès partenaires',
        'Simulateur fiscal',
      ],
      createur: [
        'Formation complète Créateur d\'entreprise',
        'Support expert dédié',
        'Templates et documents',
        'Accès communauté',
      ],
      agent_immo: [
        'Formation Agent Immobilier',
        'Accompagnement personnalisé',
        'Outils professionnels',
        'Réseau de partenaires',
      ],
      starter: [
        'Tout le Pack Plateforme',
        '3 RDV Expert personnalisés',
        'Suivi mensuel',
        'Priorité support',
      ],
      pro: [
        'Tout le Pack Starter',
        '4 RDV Expert personnalisés',
        'Accès formations complètes',
        'Accompagnement prioritaire',
      ],
      expert: [
        'Accompagnement VIP complet',
        '5 RDV Expert personnalisés',
        'Toutes les formations',
        'Support 7j/7',
        'Coaching ',
      ],
    };
  
    return (features[packType] || features.plateforme)
      .map(f => `<li>${f}</li>`)
      .join('');
  }