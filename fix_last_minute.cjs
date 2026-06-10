const fs = require('fs');
const path = require('path');

// 1. Fix ventas/nueva.astro
const ventasPath = path.join(__dirname, 'src/pages/ventas/nueva.astro');
let ventasContent = fs.readFileSync(ventasPath, 'utf8');
ventasContent = ventasContent.replace(/\$0\.00/g, 'Bs. 0.00');
ventasContent = ventasContent.replace(/totalMonto\.textContent = '\$' \+/g, "totalMonto.textContent = 'Bs. ' +");
fs.writeFileSync(ventasPath, ventasContent, 'utf8');
console.log('Fixed ventas/nueva.astro');

// 2. Fix productos/nuevo.astro
const productosPath = path.join(__dirname, 'src/pages/productos/nuevo.astro');
let productosContent = fs.readFileSync(productosPath, 'utf8');
productosContent = productosContent.replace(/<span class="input-group-text bg-transparent border-end-0 text-muted">\$<\/span>/g, '<span class="input-group-text bg-transparent border-end-0 text-muted">Bs.</span>');
fs.writeFileSync(productosPath, productosContent, 'utf8');
console.log('Fixed productos/nuevo.astro');

// 3. Fix Layout.astro
const layoutPath = path.join(__dirname, 'src/layouts/Layout.astro');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
const oldBrand = `<a href="/" class="sidebar-brand">
				<i class="bi bi-shop me-2"></i>MiniSuper
			</a>`;
const newBrand = `<a href="/" class="sidebar-brand d-flex align-items-center gap-2" style="font-size: 1.25rem;">
				<img src="/images/logo.png" alt="Logo" style="width: 32px; height: 32px; object-fit: contain; border-radius: 6px;">
				MiniSuper KRN
			</a>`;
layoutContent = layoutContent.replace(oldBrand, newBrand);
fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log('Fixed Layout.astro');
