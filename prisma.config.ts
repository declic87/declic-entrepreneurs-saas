import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'

// Charge le fichier .env explicitement
dotenv.config()

export default defineConfig({
  datasource: {
    // On utilise DIRECT_URL pour les changements de structure (db push)
    // car Supabase préfère le port 5432 pour ça
    url: process.env.DIRECT_URL,
  },
})