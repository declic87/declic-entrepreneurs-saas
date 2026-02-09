// Bouton dans la page expert
<Button onClick={async () => {
  await supabase
    .from('company_creation_data')
    .update({
      company_type: 'SASU', // ou EURL
      step: 'info_collection'
    })
    .eq('user_id', clientId);
}}>
  ✅ Valider le statut SASU
</Button>