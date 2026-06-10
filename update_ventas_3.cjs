const fs = require('fs');
const path = require('path');

const ventasPath = path.join(__dirname, 'src/pages/ventas/nueva.astro');
let content = fs.readFileSync(ventasPath, 'utf8');

// 1. Move Client Data Inputs and Make QR larger
const oldFormQrHtml = `            <!-- QR -->
            <div id="form-qr" class="d-none row align-items-center">
              <div class="col-7">
                <p class="text-white small mb-2"><i class="bi bi-info-circle me-1 text-info"></i> Escanee el código desde su aplicación bancaria.</p>
                <div class="form-check text-white small">
                  <input class="form-check-input" type="checkbox" id="checkQR" checked>
                  <label class="form-check-label" for="checkQR">Confirmar transferencia</label>
                </div>
              </div>
              <div class="col-5 text-center">
                <img src="/images/qr-pago.png" alt="Código QR" class="img-fluid rounded border border-light" style="max-height: 120px;">
              </div>
            </div>`;
const newFormQrHtml = `            <!-- QR -->
            <div id="form-qr" class="d-none text-center">
              <p class="text-white small mb-3"><i class="bi bi-info-circle me-1 text-info"></i> Escanee el código para pagar</p>
              <img src="/images/qr-pago.png" alt="Código QR" class="img-fluid rounded border border-light mb-3" style="width: 100%; max-width: 300px;">
              <div class="form-check text-white small d-flex justify-content-center">
                <input class="form-check-input me-2" type="checkbox" id="checkQR" checked>
                <label class="form-check-label" for="checkQR">Confirmar transferencia</label>
              </div>
            </div>`;
content = content.replace(oldFormQrHtml, newFormQrHtml);

const clientInputsHtml = `
          <div class="mb-4">
            <label class="form-label text-muted small text-uppercase fw-semibold mb-3 tracking-wide">Datos del Cliente</label>
            <div class="row g-2">
              <div class="col-sm-7">
                <input type="text" id="input_nombre_cliente" class="form-control text-white bg-dark border-secondary" placeholder="Nombre Completo (Obligatorio)">
              </div>
              <div class="col-sm-5">
                <input type="text" id="input_nit_cliente" class="form-control text-white bg-dark border-secondary" placeholder="NIT / CI (Opcional)">
              </div>
            </div>
          </div>
`;
content = content.replace('<div class="mb-4">\n            <label class="form-label text-muted small text-uppercase fw-semibold mb-3 tracking-wide">Método de Pago</label>', clientInputsHtml + '          <div class="mb-4">\n            <label class="form-label text-muted small text-uppercase fw-semibold mb-3 tracking-wide">Método de Pago</label>');

// 2. Modify btnConsolidar listener
const oldConsolidarStart = `    // 6. Enviar Venta al Backend
    btnConsolidar.addEventListener('click', async () => {
      try {
        const metodo_pago = document.querySelector('input[name="metodo_pago"]:checked').value;
        
        const { value: formValues } = await Swal.fire({
          title: 'Datos del Cliente',
          html: \`
            <input id="swal-input-nombre" class="swal2-input bg-dark text-white border-secondary mb-3" style="width: 80%" placeholder="Nombre Completo (Obligatorio)">
            <input id="swal-input-nit" class="swal2-input bg-dark text-white border-secondary" style="width: 80%" placeholder="NIT / CI (Opcional)">
          \`,
          focusConfirm: false,
          background: '#1e1f22',
          color: '#fff',
          confirmButtonColor: '#4f46e5',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const nombre = document.getElementById('swal-input-nombre').value.trim();
            const nit_ci = document.getElementById('swal-input-nit').value.trim();
            if (!nombre) {
              Swal.showValidationMessage('El nombre es obligatorio');
              return false;
            }
            return { nombre, nit_ci };
          }
        });

        if (!formValues) return;

        const payload = {
          metodo_pago,
          cliente: formValues,
          items: carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad }))
        };

        btnConsolidar.disabled = true;`;

const newConsolidarStart = `    // 6. Enviar Venta al Backend
    btnConsolidar.addEventListener('click', async () => {
      try {
        const nombre = document.getElementById('input_nombre_cliente').value.trim();
        const nit_ci = document.getElementById('input_nit_cliente').value.trim();

        if (!nombre) {
          Swal.fire({ title: 'Atención', text: 'El nombre del cliente es obligatorio', icon: 'warning', background: '#1e1f22', color: '#fff' });
          return;
        }

        const formValues = { nombre, nit_ci };
        const metodo_pago = document.querySelector('input[name="metodo_pago"]:checked').value;

        const payload = {
          metodo_pago,
          cliente: formValues,
          items: carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad }))
        };

        btnConsolidar.disabled = true;`;

content = content.replace(oldConsolidarStart, newConsolidarStart);

// 3. Replace pdf code with monospaced style exactly like the pop up
const oldPdfFunc = `    // Función para generar PDF
    function generarFacturaPDF(cliente, items_vendidos, ventaDB) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.text("MiniSuper KRN - Factura Comercial", 105, 20, null, null, "center");
      
      doc.setFontSize(12);
      doc.text(\`Fecha: \${new Date().toLocaleString()}\`, 20, 35);
      doc.text(\`Nro Venta: \${ventaDB.id_venta}\`, 20, 42);
      doc.text(\`Cliente: \${cliente.nombre}\`, 20, 55);
      if(cliente.nit_ci) doc.text(\`NIT/CI: \${cliente.nit_ci}\`, 20, 62);
      
      let y = 80;
      doc.setFontSize(14);
      doc.text("Detalle de Compras", 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.text("Producto", 20, y);
      doc.text("Cant", 120, y);
      doc.text("Precio", 140, y);
      doc.text("Subtotal", 170, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 8;
      
      let total = 0;
      items_vendidos.forEach(item => {
        const sub = item.cantidad * item.precio_venta;
        total += sub;
        doc.text(item.nombre.substring(0, 40), 20, y);
        doc.text(item.cantidad.toString(), 120, y);
        doc.text(\`Bs. \${item.precio_venta.toFixed(2)}\`, 140, y);
        doc.text(\`Bs. \${sub.toFixed(2)}\`, 170, y);
        y += 8;
      });
      
      doc.line(20, y, 190, y);
      y += 10;
      doc.setFontSize(14);
      doc.text(\`Total: Bs. \${total.toFixed(2)}\`, 170, y, null, null, "right");
      
      doc.save(\`Factura_MiniSuper_KRN_V\${ventaDB.id_venta}.pdf\`);
    }`;

const newPdfFunc = `    // Función para generar PDF idéntico al ticket
    function generarFacturaPDF(cliente, items_vendidos, ventaDB, metodo_pago) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      
      const total = items_vendidos.reduce((acc, curr) => acc + (curr.precio_venta * curr.cantidad), 0);
      const mRecibido = document.getElementById('monto_recibido').value;
      const montoRecib = metodo_pago === 'efectivo' ? (parseFloat(mRecibido) || total) : total;
      const cambio = metodo_pago === 'efectivo' ? (montoRecib - total) : 0;
      const date = new Date().toLocaleString();

      let itemsHtml = '';
      items_vendidos.forEach(i => {
        itemsHtml += \`\${i.nombre.padEnd(20).substring(0, 20)} \${i.cantidad.toString().padStart(3)} \${i.precio_venta.toFixed(2).padStart(6)} \${(i.cantidad*i.precio_venta).toFixed(2).padStart(8)}\\n\`;
      });

      const ticketText = \`=========================================
       MINISUPER KRN - SUCURSAL 3
     El Alto - Z. Villa Dolores N° 330
            TELÉFONO: 4367541
            La Paz - Bolivia
-----------------------------------------
 FACTURA (Con derecho a Crédito Fiscal)
 N.I.T.: 1020493029
 FACTURA N°: \${ventaDB.id_venta.toString().padStart(6, '0')}
 Autorización N°: 434401100073615
-----------------------------------------
 FECHA: \${date}
 SEÑOR(ES): \${cliente.nombre || 'Cliente Casual'}
 NIT/CI: \${cliente.nit_ci || '0'}
-----------------------------------------
 PRODUCTO             CANT   P.U.  SUBTOT
\${itemsHtml}-----------------------------------------
 SUB TOTAL:                      Bs. \${total.toFixed(2)}
 TOTAL FACTURA:                  Bs. \${total.toFixed(2)}
 MÉTODO DE PAGO:                 \${metodo_pago.toUpperCase()}
 EFECTIVO ENTREGADO:             Bs. \${montoRecib.toFixed(2)}
 CAMBIO:                         Bs. \${(cambio < 0 ? 0 : cambio).toFixed(2)}

 SON: \${NumeroALetras(total)}
 Código de control: 27-24-1D-2A
 Fecha límite de emisión: 14/03/2026
-----------------------------------------
 ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL
 PAÍS. EL USO ILÍCITO DE ESTA FACTURA SERÁ
 SANCIONADO DE ACUERDO A LA LEY.

 Ley N° 453: Tienes derecho a un trato 
 equitativo sin discriminación en la 
 oferta de productos.
=========================================\`;

      const lines = doc.splitTextToSize(ticketText, 180);
      doc.text(lines, 10, 20);
      doc.save(\`Factura_MiniSuper_KRN_V\${ventaDB.id_venta}.pdf\`);
    }`;

content = content.replace(oldPdfFunc, newPdfFunc);

// 4. In btnConsolidar we call generarFacturaPDF without metodo_pago, we need to pass it now.
content = content.replace('generarFacturaPDF(formValues, carrito, data.venta);', 'generarFacturaPDF(formValues, carrito, data.venta, metodo_pago);');

// 5. Change "Imprimir / Cerrar" to "Cerrar"
content = content.replace("confirmButtonText: 'Imprimir / Cerrar',", "confirmButtonText: 'Cerrar',");

// 6. Fix "document.getElementById('input_nombre_cliente').value = '';" after successful process so the inputs clear
content = content.replace(`            document.getElementById('monto_recibido').value = '';
            document.getElementById('cambio_efectivo').textContent = 'Bs. 0.00';`, `            document.getElementById('monto_recibido').value = '';
            document.getElementById('cambio_efectivo').textContent = 'Bs. 0.00';
            document.getElementById('input_nombre_cliente').value = '';
            document.getElementById('input_nit_cliente').value = '';`);

fs.writeFileSync(ventasPath, content, 'utf8');
console.log('Update 3 successful');
