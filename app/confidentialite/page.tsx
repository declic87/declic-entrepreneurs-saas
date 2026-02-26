export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-[#123055] mb-8">Politique de Confidentialité</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-sm text-slate-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">1. Collecte des données</h2>
            <p>
              Nous collectons les données personnelles suivantes lorsque vous utilisez notre plateforme :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informations d'identification (nom, prénom, email, téléphone)</li>
              <li>Données professionnelles (statut juridique, activité, chiffre d'affaires)</li>
              <li>Données de connexion (adresse IP, cookies, logs)</li>
              <li>Données de paiement (gérées par Stripe, nous ne stockons pas les cartes bancaires)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir nos services d'accompagnement fiscal</li>
              <li>Gérer votre compte et vos rendez-vous</li>
              <li>Vous envoyer des communications relatives à nos services</li>
              <li>Améliorer notre plateforme et nos services</li>
              <li>Respecter nos obligations légales et réglementaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">3. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>L'exécution du contrat</strong> : pour fournir nos services</li>
              <li><strong>Votre consentement</strong> : pour les communications marketing</li>
              <li><strong>Nos intérêts légitimes</strong> : pour améliorer nos services</li>
              <li><strong>Obligations légales</strong> : conservation des factures, comptabilité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">4. Partage des données</h2>
            <p>Nous ne vendons jamais vos données. Nous les partageons uniquement avec :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe</strong> : pour le traitement des paiements</li>
              <li><strong>Calendly</strong> : pour la gestion des rendez-vous</li>
              <li><strong>Supabase</strong> : hébergement sécurisé de la base de données (serveurs EU)</li>
              <li><strong>Nos experts fiscaux</strong> : dans le cadre de l'accompagnement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">5. Conservation des données</h2>
            <p>Nous conservons vos données :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de compte</strong> : tant que votre compte est actif + 3 ans après fermeture</li>
              <li><strong>Données de facturation</strong> : 10 ans (obligation légale)</li>
              <li><strong>Cookies</strong> : 13 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">6. Vos droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : supprimer vos données (sous conditions)</li>
              <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format lisible</li>
              <li><strong>Droit d'opposition</strong> : refuser certains traitements</li>
              <li><strong>Droit de limitation</strong> : limiter l'utilisation de vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer vos droits, contactez-nous à : <strong>contact@declic-entrepreneurs.fr</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">7. Cookies</h2>
            <p>Nous utilisons les cookies suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement (authentification, panier)</li>
              <li><strong>Cookies analytiques</strong> : mesure d'audience (anonymisés)</li>
              <li><strong>Cookies marketing</strong> : avec votre consentement uniquement</li>
            </ul>
            <p className="mt-4">
              Vous pouvez gérer vos préférences cookies à tout moment via les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">8. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Hébergement sécurisé dans l'Union Européenne (Supabase)</li>
              <li>Accès restreint aux données personnelles (besoin d'en connaître)</li>
              <li>Sauvegarde quotidienne des données</li>
              <li>Audits de sécurité réguliers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">9. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications 
              importantes vous seront notifiées par email. La date de dernière mise à jour est indiquée 
              en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">10. Contact</h2>
            <p>
              Pour toute question concernant vos données personnelles ou cette politique :
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email :</strong> contact@declic-entrepreneurs.fr</li>
              <li><strong>Responsable du traitement :</strong> EVERYBOD'IR - Stéphane Neurin</li>
              <li><strong>Adresse :</strong> 110 CHE DU MAS DE COULONDRE, 30670 AIGUES-VIVES</li>
            </ul>
            <p className="mt-4">
              Vous pouvez également introduire une réclamation auprès de la CNIL : 
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#F59E0B] hover:underline ml-1">
                www.cnil.fr
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}