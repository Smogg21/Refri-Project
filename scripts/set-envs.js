const fs = require('fs');

// Ruta donde se creará el archivo
const targetPath = './src/environments/environment.ts';
const targetPathProd = './src/environments/environment.prod.ts';

// Contenido del archivo. Aquí leemos las variables de Vercel (process.env)
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
  openRouterApiKey: '${process.env.OPENROUTER_API_KEY}'
};
`;

// Crear directorio environments si no existe
const dir = './src/environments';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Escribir el archivo environment.ts
fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        console.log(err);
    }
    console.log(`Output generated at ${targetPath}`);
});

// (Opcional) Escribir también el de prod para asegurar
fs.writeFile(targetPathProd, envConfigFile, function (err) {
    if (err) {
        console.log(err);
    }
    console.log(`Output generated at ${targetPathProd}`);
});
