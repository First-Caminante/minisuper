const fs = require('fs');
const path = require('path');

const ventasPath = path.join(__dirname, 'src/pages/ventas/nueva.astro');
let content = fs.readFileSync(ventasPath, 'utf8');

// 1. Fix btnConsolidar references in finally block
content = content.replace('if(carrito.length > 0) btnConsolidar.disabled = false;', 'if(carrito.length > 0) btnConfirmarVenta.disabled = false;');
content = content.replace(`btnConsolidar.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Consolidar Venta';`, `btnConfirmarVenta.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Confirmar Venta';`);

// 2. Move NumeroALetras outside DOMContentLoaded so it can be seen by generarFacturaPDF
// Let's remove it from its current position
const oldFunc = `  function NumeroALetras(num) {
    return num.toFixed(2) + " CON 00/100 BOLIVIANOS";
  }`;

content = content.replace(oldFunc, '');

// And put it right above generarFacturaPDF
const newPdfFunc = `  function NumeroALetras(num) {
    return num.toFixed(2) + " CON 00/100 BOLIVIANOS";
  }

    // Función para generar PDF idéntico al ticket
    function generarFacturaPDF(cliente, items_vendidos, ventaDB, metodo_pago) {`;

content = content.replace('    // Función para generar PDF idéntico al ticket\n    function generarFacturaPDF(cliente, items_vendidos, ventaDB, metodo_pago) {', newPdfFunc);

fs.writeFileSync(ventasPath, content, 'utf8');
console.log('Bugs fixed successfully');
