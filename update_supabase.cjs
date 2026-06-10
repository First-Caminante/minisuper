const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = ['categorias.ts', 'productos.ts', 'proveedores.ts', 'ventas.ts'];

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace `await supabase` with `await getSupabase(c.env)`
  content = content.replace(/await supabase/g, "await getSupabase(c.env)");

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}
