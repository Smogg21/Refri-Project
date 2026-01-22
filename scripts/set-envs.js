const fs = require('fs');

// 1. Obtener variables (Asegúrate de que en Vercel estén en MAYÚSCULAS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY; // <--- NUEVA VARIABLE

// 2. Validación
if (!supabaseUrl || !supabaseKey || !openRouterApiKey) {
    console.error('❌ ERROR: Faltan variables de entorno en Vercel.');
    console.log('SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_KEY:', !!supabaseKey);
    console.log('OPENROUTER_API_KEY:', !!openRouterApiKey);
    process.exit(1);
}

// 3. Crear el contenido del archivo
// IMPORTANTE: Aquí mapeamos las variables de Vercel a los nombres que usa tu Angular
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl.trim()}',
  supabaseKey: '${supabaseKey.trim()}',
  openRouterApiKey: '${openRouterApiKey.trim()}'
};
`;

// 4. Escribir archivos
const targetPath = './src/environments/environment.ts';
const targetPathProd = './src/environments/environment.prod.ts';
const dir = './src/environments';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFile(targetPath, envConfigFile, (err) => {
    if (err) throw err;
    console.log(`✅ Archivo generado: ${targetPath}`);
});

fs.writeFile(targetPathProd, envConfigFile, (err) => {
    if (err) throw err;
    console.log(`✅ Archivo generado: ${targetPathProd}`);
});
