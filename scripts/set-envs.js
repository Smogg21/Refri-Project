const fs = require('fs');

// 1. Obtener variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 2. LOGS DE DEPURACIÓN (Aparecerán en el Build Log de Vercel)
console.log('--- GENERANDO ENVIRONMENTS ---');
console.log('Supabase URL existe:', !!supabaseUrl); // Debe decir true
console.log('Supabase URL empieza con:', supabaseUrl ? supabaseUrl.substring(0, 5) : 'NADA');
console.log('Supabase Key existe:', !!supabaseKey); // Debe decir true

// 3. Validación estricta: Si no hay variables, detiene el build
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Faltan las variables de entorno en Vercel.');
    process.exit(1); // Esto hará que el build falle intencionalmente
}

const targetPath = './src/environments/environment.ts';
const targetPathProd = './src/environments/environment.prod.ts';

const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl.trim()}',
  supabaseKey: '${supabaseKey.trim()}'
};
`;

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
