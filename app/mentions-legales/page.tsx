export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-[#123055] mb-8">Mentions Légales</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-sm text-slate-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">1. Éditeur du site</h2>
            <p>Le site <strong>declic-entrepreneurs.fr</strong> est édité par :</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Raison sociale :</strong> EVERYBOD'IR</li>
              <li><strong>Forme juridique :</strong> SARL (Société à Responsabilité Limitée)</li>
              <li><strong>Capital social :</strong> 1 500,00 €</li>
              <li><strong>SIREN :</strong> 802 077 925</li>
              <li><strong>SIRET :</strong> 802 077 925 00021</li>
              <li><strong>RCS :</strong> Nîmes 802 077 925</li>
              <li><strong>Numéro de TVA :</strong> FR86802077925</li>
              <li><strong>Activité :</strong> Services administratifs combinés de bureau</li>
              <li><strong>Siège social :</strong> 110 CHE DU MAS DE COULONDRE, 30670 AIGUES-VIVES</li>
              <li><strong>Directeur de la publication :</strong> Stéphane Neurin (Gérant)</li>
              <li><strong>Email :</strong> contact@declic-entrepreneurs.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">2. Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Hébergeur web :</strong> Vercel Inc.</li>
              <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
              <li><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#F59E0B] hover:underline">vercel.com</a></li>
            </ul>
            <p className="mt-4">Base de données hébergée par :</p>
            <ul className="list-none space-y-2 mt-2">
              <li><strong>Hébergeur BDD :</strong> Supabase Inc.</li>
              <li><strong>Localisation des serveurs :</strong> Union Européenne (conformité RGPD)</li>
              <li><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#F59E0B] hover:underline">supabase.com</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, marques, charte graphique, 
              simulateurs, outils) est la propriété exclusive de <strong>EVERYBOD'IR</strong> ou de ses partenaires.
            </p>
            <p className="mt-4">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
              des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf 
              autorisation écrite préalable de <strong>EVERYBOD'IR</strong>.
            </p>
            <p className="mt-4">
              Toute exploitation non autorisée du site ou de l'un des éléments qu'il contient sera 
              considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions 
              des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">4. Données personnelles</h2>
            <p>
              Le traitement de vos données personnelles est régi par notre 
              <a href="/confidentialite" className="text-[#F59E0B] hover:underline ml-1">
                Politique de Confidentialité
              </a>.
            </p>
            <p className="mt-4">
              Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au 
              Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, 
              de rectification, de suppression et de portabilité de vos données.
            </p>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : <strong>contact@declic-entrepreneurs.fr</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">5. Cookies</h2>
            <p>
              Le site utilise des cookies pour améliorer l'expérience utilisateur et mesurer l'audience. 
              Ces cookies ne sont déposés qu'avec votre consentement, à l'exception des cookies strictement 
              nécessaires au fonctionnement du site.
            </p>
            <p className="mt-4">
              Pour en savoir plus, consultez notre 
              <a href="/confidentialite" className="text-[#F59E0B] hover:underline ml-1">
                Politique de Confidentialité
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">6. Responsabilité</h2>
            <p>
              <strong>EVERYBOD'IR</strong> s'efforce d'assurer l'exactitude et la mise à jour des informations 
              diffusées sur ce site, dont elle se réserve le droit de corriger le contenu à tout moment 
              et sans préavis.
            </p>
            <p className="mt-4">
              Toutefois, <strong>EVERYBOD'IR</strong> ne peut garantir l'exactitude, la précision ou 
              l'exhaustivité des informations mises à disposition sur ce site.
            </p>
            <p className="mt-4">
              En conséquence, <strong>EVERYBOD'IR</strong> décline toute responsabilité pour toute 
              imprécision, inexactitude ou omission portant sur des informations disponibles sur le site.
            </p>
            <p className="mt-4">
              Les informations fournies sur ce site le sont à titre indicatif et ne se substituent pas à un 
              conseil juridique, fiscal ou comptable personnalisé. Nous vous recommandons de consulter un 
              professionnel qualifié pour toute décision importante.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">7. Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens hypertextes vers d'autres sites. <strong>EVERYBOD'IR</strong> 
              n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
            </p>
            <p className="mt-4">
              La création de liens hypertextes vers le site <strong>declic-entrepreneurs.fr</strong> est 
              soumise à l'accord préalable écrit de <strong>EVERYBOD'IR</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">8. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, et après 
              échec de toute tentative de recherche d'une solution amiable, les tribunaux français seront 
              seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">9. Contact</h2>
            <p>Pour toute question concernant les mentions légales :</p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Email :</strong> contact@declic-entrepreneurs.fr</li>
              <li><strong>Adresse :</strong> 110 CHE DU MAS DE COULONDRE, 30670 AIGUES-VIVES</li>
              <li><strong>Téléphone :</strong> (à compléter si souhaité)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#123055] mt-8 mb-4">10. Crédits</h2>
            <ul className="list-none space-y-2">
              <li><strong>Conception et développement :</strong> EVERYBOD'IR</li>
              <li><strong>Design :</strong> EVERYBOD'IR</li>
              <li><strong>Hébergement web :</strong> Vercel</li>
              <li><strong>Hébergement BDD :</strong> Supabase</li>
              <li><strong>Paiements :</strong> Stripe</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}