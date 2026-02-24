// lib/email-service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'contact@declic-entrepreneurs.fr';
const ADMIN_EMAIL = 'contact@declic-entrepreneurs.fr';

// ============================================
// 1. EMAIL CONFIRMATION RDV EXPERT
// ============================================
export async function sendExpertRDVConfirmation({
  clientName,
  clientEmail,
  expertName,
  rdvDate,
  rdvTime,
  meetLink
}: {
  clientName: string;
  clientEmail: string;
  expertName: string;
  rdvDate: string;
  rdvTime: string;
  meetLink?: string;
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #123055 0%, #0f2742 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .rdv-box { background: #f8fafc; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">✅ RDV Expert Confirmé</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          
          <p>Votre rendez-vous avec notre expert <strong>${expertName}</strong> est confirmé !</p>
          
          <div class="rdv-box">
            <p style="margin: 0 0 10px 0;"><strong>📅 Date :</strong> ${new Date(rdvDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0 0 10px 0;"><strong>🕐 Heure :</strong> ${rdvTime}</p>
            <p style="margin: 0;"><strong>⏱️ Durée :</strong> 45 minutes</p>
          </div>
          
          ${meetLink ? `
            <p>Le lien de visioconférence sera disponible prochainement. Vous recevrez un email avec le lien 24h avant le RDV.</p>
          ` : ''}
          
          <p><strong>Pour préparer au mieux notre échange, merci de :</strong></p>
          <ul>
            <li>Avoir vos derniers bilans comptables sous la main</li>
            <li>Noter vos questions prioritaires</li>
            <li>Prévoir un endroit calme pour l'appel</li>
          </ul>
          
          <p>À très bientôt !</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>L'équipe Déclic Entrepreneurs</strong><br>
            📧 ${FROM_EMAIL}<br>
            🌐 <a href="https://declic-entrepreneurs.fr">declic-entrepreneurs.fr</a>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Déclic Entrepreneurs - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `✅ Confirmation RDV Expert - ${new Date(rdvDate).toLocaleDateString('fr-FR')}`,
      html: htmlContent,
    });
    
    console.log('✅ Email confirmation RDV envoyé à', clientEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error };
  }
}

// ============================================
// 2. EMAIL RAPPEL 24H AVANT RDV
// ============================================
export async function sendExpertRDVReminder({
  clientName,
  clientEmail,
  expertName,
  rdvDate,
  rdvTime,
  meetLink
}: {
  clientName: string;
  clientEmail: string;
  expertName: string;
  rdvDate: string;
  rdvTime: string;
  meetLink: string;
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .rdv-box { background: #fef3c7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">⏰ RDV Expert Demain</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          
          <p>Petit rappel : votre RDV avec <strong>${expertName}</strong> a lieu <strong>demain</strong> !</p>
          
          <div class="rdv-box">
            <p style="margin: 0 0 10px 0;"><strong>📅 Date :</strong> ${new Date(rdvDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 0 0 10px 0;"><strong>🕐 Heure :</strong> ${rdvTime}</p>
            <p style="margin: 0;"><strong>⏱️ Durée :</strong> 45 minutes</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${meetLink}" class="button">🎥 Rejoindre la visio</a>
          </div>
          
          <p><strong>N'oubliez pas d'avoir sous la main :</strong></p>
          <ul>
            <li>Vos derniers bilans comptables</li>
            <li>Vos questions prioritaires</li>
            <li>Un environnement calme</li>
          </ul>
          
          <p style="margin-top: 30px;">À demain !</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>L'équipe Déclic Entrepreneurs</strong><br>
            📧 ${FROM_EMAIL}
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Déclic Entrepreneurs</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `⏰ Rappel : RDV Expert demain à ${rdvTime}`,
      html: htmlContent,
    });
    
    console.log('✅ Email rappel RDV envoyé à', clientEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error };
  }
}

// ============================================
// 3. EMAIL BIENVENUE NOUVEAU CLIENT
// ============================================
export async function sendWelcomeEmail({
  clientName,
  clientEmail,
  pack,
  loginUrl = 'https://declic-entrepreneurs.fr/login'
}: {
  clientName: string;
  clientEmail: string;
  pack: string;
  loginUrl?: string;
}) {
  const packNames: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    expert: 'Expert',
    formation_createur: 'Formation Créateur',
    formation_agent_immo: 'Formation Agent Immobilier',
    plateforme: 'Plateforme'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .welcome-box { background: #f0fdf4; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .button { display: inline-block; background: #123055; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0 0 10px 0; font-size: 32px;">🎉 Bienvenue chez Déclic Entrepreneurs !</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Votre aventure d'optimisation commence maintenant</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          
          <p>Félicitations pour avoir rejoint <strong>Déclic Entrepreneurs</strong> ! 🚀</p>
          
          <div class="welcome-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #059669;">Votre pack :</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10B981;">${packNames[pack] || pack}</p>
          </div>
          
          <p><strong>Prochaines étapes :</strong></p>
          <ol>
            <li><strong>Connectez-vous à votre espace client</strong> avec vos identifiants</li>
            <li><strong>Explorez vos ressources</strong> : formations, simulateurs, documents</li>
            <li><strong>Réservez votre premier RDV expert</strong> si inclus dans votre pack</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">🔐 Accéder à mon espace</a>
          </div>
          
          <p style="margin-top: 30px;"><strong>Besoin d'aide ?</strong></p>
          <p>Notre équipe est à votre disposition :</p>
          <ul>
            <li>📧 Email : ${FROM_EMAIL}</li>
            <li>💬 Chat en ligne sur votre espace client</li>
          </ul>
          
          <p style="margin-top: 30px;">Bienvenue dans la communauté ! 🎯</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>L'équipe Déclic Entrepreneurs</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Déclic Entrepreneurs - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: '🎉 Bienvenue chez Déclic Entrepreneurs !',
      html: htmlContent,
    });
    
    console.log('✅ Email bienvenue envoyé à', clientEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error };
  }
}

// ============================================
// 4. EMAIL NOTIFICATION ADMIN NOUVEAU CLIENT
// ============================================
export async function sendAdminNewClientNotification({
  clientName,
  clientEmail,
  pack,
  amount
}: {
  clientName: string;
  clientEmail: string;
  pack: string;
  amount: number;
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
        .header { background: #123055; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: #f0fdf4; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">🔔 Nouveau Client</h2>
        </div>
        
        <div class="content">
          <div class="info-box">
            <p><strong>Nom :</strong> ${clientName}</p>
            <p><strong>Email :</strong> ${clientEmail}</p>
            <p><strong>Pack :</strong> ${pack}</p>
            <p><strong>Montant :</strong> ${amount}€</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <p>Action requise : Assigner un expert et planifier le premier contact.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🔔 Nouveau client : ${clientName} - ${pack}`,
      html: htmlContent,
    });
    
    console.log('✅ Email admin envoyé');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email admin:', error);
    return { success: false, error };
  }
}