const fs = require('fs');
const path = require('path');

const reportesTsPath = path.join(__dirname, 'src/routes/reportes.ts');
let tsContent = fs.readFileSync(reportesTsPath, 'utf8');

// Update Supabase query
tsContent = tsContent.replace(
  "select('id_venta, total_venta, fecha_venta, metodo_pago, detalle_ventas(cantidad, subtotal, productos(nombre))')",
  "select('id_venta, total_venta, fecha_venta, metodo_pago, detalle_ventas(cantidad, subtotal, productos(nombre, categorias(nombre)))')"
);

// Add category logic
const mapVars = `    // Productos más vendidos (Top 5)
    const productosMap: Record<string, number> = {};
    const categoriasMap: Record<string, number> = {};`;

tsContent = tsContent.replace(`    // Productos más vendidos (Top 5)
    const productosMap: Record<string, number> = {};`, mapVars);

const aggLogic = `      // Agrupar productos
      if (v.detalle_ventas && Array.isArray(v.detalle_ventas)) {
        v.detalle_ventas.forEach((d: any) => {
          const nombre = d.productos?.nombre || 'Producto Desconocido';
          const categoria = d.productos?.categorias?.nombre || 'Sin Categoría';
          
          productosMap[nombre] = (productosMap[nombre] || 0) + d.cantidad;
          categoriasMap[categoria] = (categoriasMap[categoria] || 0) + d.cantidad;
        });
      }`;

tsContent = tsContent.replace(`      // Agrupar productos
      if (v.detalle_ventas && Array.isArray(v.detalle_ventas)) {
        v.detalle_ventas.forEach((d: any) => {
          const nombre = d.productos?.nombre || 'Producto Desconocido';
          productosMap[nombre] = (productosMap[nombre] || 0) + d.cantidad;
        });
      }`, aggLogic);

// Add top categorias logic
const sortLogic = `    // Ordenar productos top
    const topProductos = Object.entries(productosMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    const topCategorias = Object.entries(categoriasMap)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));`;

tsContent = tsContent.replace(`    // Ordenar productos top
    const topProductos = Object.entries(productosMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));`, sortLogic);

// Return payload
tsContent = tsContent.replace(`          top_productos: topProductos`, `          top_productos: topProductos,
          categorias: topCategorias`);

fs.writeFileSync(reportesTsPath, tsContent, 'utf8');


const reportesAstroPath = path.join(__dirname, 'src/pages/reportes.astro');
let astroContent = fs.readFileSync(reportesAstroPath, 'utf8');

// Inject HTML for new charts/tables
const newHtml = `    <!-- Gráficas y Top -->
    <div class="row g-4 mb-4">
      <div class="col-lg-8">
        <div class="glass-card p-4 h-100">
          <h5 class="text-white mb-4"><i class="bi bi-graph-up text-primary me-2"></i>Tendencia de Ventas</h5>
          <div style="height: 300px; position: relative;">
            <canvas id="chartTendencia"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="glass-card p-4 h-100">
          <h5 class="text-white mb-4"><i class="bi bi-pie-chart text-info me-2"></i>Métodos de Pago</h5>
          <div style="height: 300px; position: relative;" class="d-flex justify-content-center">
            <canvas id="chartPagos"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Tendencia por Categorías y Top Productos -->
    <div class="row g-4 mb-4">
      <div class="col-lg-6">
        <div class="glass-card p-4 h-100">
          <h5 class="text-white mb-4"><i class="bi bi-tags text-warning me-2"></i>Tendencia por Categorías (Unidades Vendidas)</h5>
          <div style="height: 300px; position: relative;">
            <canvas id="chartCategorias"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="glass-card p-4 h-100 custom-scroll" style="max-height: 390px; overflow-y: auto;">
          <h5 class="text-white mb-4"><i class="bi bi-trophy text-success me-2"></i>Top Productos Más Vendidos</h5>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-white">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-end">Unidades Vendidas</th>
                </tr>
              </thead>
              <tbody id="tablaTopProductos">
                <!-- Data here -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`;

// We replace the old Gráficas section
astroContent = astroContent.replace(/    <!-- Gráficas -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newHtml);

// Add chart var
astroContent = astroContent.replace(`  let chartTendenciaObj = null;
  let chartPagosObj = null;`, `  let chartTendenciaObj = null;
  let chartPagosObj = null;
  let chartCategoriasObj = null;`);

// Add UI update logic
const uiUpdate = `    // Actualizar Tabla de Top Productos
    const tabla = document.getElementById('tablaTopProductos');
    tabla.innerHTML = '';
    if (data.graficas.top_productos && data.graficas.top_productos.length > 0) {
      data.graficas.top_productos.forEach((p, idx) => {
        let badgeClass = 'bg-secondary';
        if (idx === 0) badgeClass = 'bg-warning text-dark';
        if (idx === 1) badgeClass = 'bg-secondary text-white';
        if (idx === 2) badgeClass = 'bg-info text-dark';

        tabla.innerHTML += \`
          <tr>
            <td>
              <span class="badge \${badgeClass} me-2" style="width:24px;">\${idx + 1}</span>
              \${p.nombre}
            </td>
            <td class="text-end fw-bold text-success">\${p.cantidad} u.</td>
          </tr>
        \`;
      });
    } else {
      tabla.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No hay datos en este rango</td></tr>';
    }

    // Gráfica de Categorías (Bar Chart horizontal o Doughnut)
    const ctxCategorias = document.getElementById('chartCategorias')?.getContext('2d');
    if (ctxCategorias) {
      if (chartCategoriasObj) chartCategoriasObj.destroy();
      
      const categoriasNombres = data.graficas.categorias.map(c => c.nombre);
      const categoriasCantidades = data.graficas.categorias.map(c => c.cantidad);

      chartCategoriasObj = new Chart(ctxCategorias, {
        type: 'bar',
        data: {
          labels: categoriasNombres,
          datasets: [{
            label: 'Unidades Vendidas',
            data: categoriasCantidades,
            backgroundColor: 'rgba(234, 179, 8, 0.7)',
            borderColor: 'rgb(234, 179, 8)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y', // Hace las barras horizontales
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { grid: { display: false } }
          }
        }
      });
    }`;

astroContent = astroContent.replace(`  function actualizarUI(data) {`, `  function actualizarUI(data) {\n${uiUpdate}`);

fs.writeFileSync(reportesAstroPath, astroContent, 'utf8');
console.log("Done updating reportes files.");
