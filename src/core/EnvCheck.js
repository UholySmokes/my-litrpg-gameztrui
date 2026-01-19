export function verifyEnv() {
  const vars = {
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };
  const missing = Object.entries(vars).filter(([, v]) => !v || String(v).includes('your_'));
  if (missing.length === 0) {
    console.info('Env loaded');
    return true;
  }
  console.warn('Env missing', missing.map(([k]) => k));
  return false;
}
