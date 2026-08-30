/**
 * Supabase-klienten. URL og nøkkel er offentlige med vilje — nøkkelen gir kun
 * leserettigheter. Skriving krever innlogging og at brukeren står i
 * admin_brukere, håndhevet av Row Level Security i databasen.
 */
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xanbyscizkhsldosrplq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EZ_QJDZWC4jaXNtW9KzU4A_qSyg3579';

export const db = createClient(SUPABASE_URL, SUPABASE_KEY);
