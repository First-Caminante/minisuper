const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/reportes.astro');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the custom-scroll div to remove height constraints on print
content = content.replace('class="glass-card p-4 h-100 custom-scroll"', 'class="glass-card p-4 h-100 custom-scroll print-no-scroll"');

// 2. Inject print event listeners for Chart.js colors
const scriptInject = `
  // Optimización de colores para impresión (PDF)
  window.addEventListener('beforeprint', () => {
    Chart.defaults.color = '#000';
    if(chartTendenciaObj) {
      chartTendenciaObj.options.scales.x.ticks.color = '#000';
      chartTendenciaObj.options.scales.y.ticks.color = '#000';
      chartTendenciaObj.update();
    }
    if(chartPagosObj) {
      chartPagosObj.options.plugins.legend.labels.color = '#000';
      chartPagosObj.update();
    }
    if(chartCategoriasObj) {
      chartCategoriasObj.options.scales.x.ticks.color = '#000';
      chartCategoriasObj.update();
    }
  });

  window.addEventListener('afterprint', () => {
    Chart.defaults.color = '#a1a1aa';
    if(chartTendenciaObj) {
      chartTendenciaObj.options.scales.x.ticks.color = '#a1a1aa';
      chartTendenciaObj.options.scales.y.ticks.color = '#a1a1aa';
      chartTendenciaObj.update();
    }
    if(chartPagosObj) {
      chartPagosObj.options.plugins.legend.labels.color = '#fff';
      chartPagosObj.update();
    }
    if(chartCategoriasObj) {
      chartCategoriasObj.options.scales.x.ticks.color = '#a1a1aa';
      chartCategoriasObj.update();
    }
  });
`;

content = content.replace('  function setRango(tipo) {', scriptInject + '\n  function setRango(tipo) {');

// 3. Update CSS rules
const cssInject = `
    .print-no-scroll {
      max-height: none !important;
      overflow: visible !important;
    }
    
    .glass-card > div[style*="height: 300px"] {
      height: 250px !important;
    }
    
    .text-white, .text-muted, .text-info, .text-success, .text-warning {
      color: black !important;
    }
    
    /* Table borders and text for print */
    .table, .table td, .table th {
      color: black !important;
      border-color: #dee2e6 !important;
    }
    
    /* Enforce background colors for badges in print */
    .badge {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Prevent rows from splitting across pages */
    .row {
      page-break-inside: avoid !important;
    }
    
    /* Adjust grid to prevent squishing charts */
    .col-lg-8, .col-lg-4, .col-lg-6 {
      width: 100% !important;
      flex: 0 0 100% !important;
      margin-bottom: 20px;
    }
`;

content = content.replace('    /* Fix chart colors for print */', cssInject + '\n    /* Fix chart colors for print */');

fs.writeFileSync(file, content, 'utf8');
console.log('Print optimizations applied successfully.');
