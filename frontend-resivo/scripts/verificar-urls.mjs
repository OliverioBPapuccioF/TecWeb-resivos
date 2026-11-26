// Checks that the address of the API is written ONLY in src/environments/:
// looks for localhost / 127.0.0.1 with a port in every file of src/ outside environments/.
// Run it with: npm run verificar-urls   (exit code 1 if it finds something)
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const raiz = 'src';
const permitido = join(raiz, 'environments') + sep;
const patron = /(localhost|127\.0\.0\.1):\d+/;

function archivos(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(join(carpeta, e.name)) : [join(carpeta, e.name)],
  );
}

const encontrados = [];
for (const archivo of archivos(raiz)) {
  if (archivo.startsWith(permitido)) continue;
  readFileSync(archivo, 'utf8')
    .split('\n')
    .forEach((linea, i) => {
      if (patron.test(linea)) encontrados.push(`${relative('.', archivo)}:${i + 1}: ${linea.trim()}`);
    });
}

if (encontrados.length > 0) {
  console.error('URLs de la API escritas fuera de src/environments/ (usá environment.apiUrl):');
  encontrados.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log('OK: la URL de la API solo está en src/environments/');
