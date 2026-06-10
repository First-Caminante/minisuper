const fs = require('fs');
const path = require('path');

const ventasPath = path.join(__dirname, 'src/pages/ventas/nueva.astro');
let content = fs.readFileSync(ventasPath, 'utf8');

// 1. Inject dynamic forms in HTML
const formsHtml = `
            </div>
          </div>
          
          <!-- Formularios Dinámicos -->
          <div id="dynamicPaymentForms" class="mb-4 p-3 bg-dark bg-opacity-25 border border-secondary rounded">
            <!-- Efectivo -->
            <div id="form-efectivo">
              <label class="form-label text-muted small text-uppercase fw-semibold mb-2">Monto Recibido (Bs.)</label>
              <div class="input-group mb-2">
                <span class="input-group-text bg-transparent border-end-0 text-muted">Bs.</span>
                <input type="number" step="0.01" class="form-control border-start-0 ps-0 text-white bg-transparent" id="monto_recibido" placeholder="0.00">
              </div>
              <div class="d-flex justify-content-between text-success fw-bold">
                <span>Cambio:</span>
                <span id="cambio_efectivo">Bs. 0.00</span>
              </div>
            </div>

            <!-- Tarjeta -->
            <div id="form-tarjeta" class="d-none">
              <div class="mb-2">
                <label class="form-label text-muted small text-uppercase fw-semibold mb-1">Titular de la Tarjeta</label>
                <input type="text" class="form-control text-white bg-transparent border-secondary" placeholder="EJ: JUAN PEREZ">
              </div>
              <div class="mb-2">
                <label class="form-label text-muted small text-uppercase fw-semibold mb-1">Número de Tarjeta</label>
                <input type="text" class="form-control text-white bg-transparent border-secondary" placeholder="0000 0000 0000 0000">
              </div>
              <div class="d-flex gap-2">
                <div class="flex-grow-1">
                  <label class="form-label text-muted small text-uppercase fw-semibold mb-1">Vencimiento</label>
                  <input type="text" class="form-control text-white bg-transparent border-secondary" placeholder="MM/AA">
                </div>
                <div class="flex-grow-1">
                  <label class="form-label text-muted small text-uppercase fw-semibold mb-1">CVV</label>
                  <input type="text" class="form-control text-white bg-transparent border-secondary" placeholder="123">
                </div>
              </div>
            </div>

            <!-- QR -->
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
            </div>
          </div>
`;
content = content.replace(/<\/div>\s*<\/div>\s*<button class="btn btn-primary-gradient/, formsHtml + '\n          <button class="btn btn-primary-gradient');

// 2. Inject DOM logic
const domLogic = `
    const cartCount = document.getElementById('cartCount');

    // Nodos para pagos
    const pagoEfectivo = document.getElementById('pago_efectivo');
    const pagoTarjeta = document.getElementById('pago_tarjeta');
    const pagoQR = document.getElementById('pago_qr');
    const formEfectivo = document.getElementById('form-efectivo');
    const formTarjeta = document.getElementById('form-tarjeta');
    const formQr = document.getElementById('form-qr');
    const montoRecibido = document.getElementById('monto_recibido');
    const cambioEfectivo = document.getElementById('cambio_efectivo');

    function togglePaymentForms() {
      formEfectivo.classList.toggle('d-none', !pagoEfectivo.checked);
      formTarjeta.classList.toggle('d-none', !pagoTarjeta.checked);
      formQr.classList.toggle('d-none', !pagoQR.checked);
    }
    document.querySelectorAll('input[name="metodo_pago"]').forEach(r => r.addEventListener('change', togglePaymentForms));
    
    montoRecibido.addEventListener('input', () => {
      const total = carrito.reduce((acc, curr) => acc + (curr.precio_venta * curr.cantidad), 0);
      const recibido = parseFloat(montoRecibido.value) || 0;
      const cambio = recibido - total;
      cambioEfectivo.textContent = 'Bs. ' + (cambio > 0 ? cambio.toFixed(2) : '0.00');
    });
`;
content = content.replace("const cartCount = document.getElementById('cartCount');", domLogic);

// 3. Inject Ticket logic
const ticketLogic = `
  function NumeroALetras(num) {
    return num.toFixed(2) + " CON 00/100 BOLIVIANOS";
  }

  function mostrarTicketFiscal(ventaDB, cliente, items, metodo_pago) {
    const total = items.reduce((acc, curr) => acc + (curr.precio_venta * curr.cantidad), 0);
    const mRecibido = document.getElementById('monto_recibido').value;
    const montoRecib = metodo_pago === 'efectivo' ? (parseFloat(mRecibido) || total) : total;
    const cambio = metodo_pago === 'efectivo' ? (montoRecib - total) : 0;
    const date = new Date().toLocaleString();

    let itemsHtml = '';
    items.forEach(i => {
      itemsHtml += \`\${i.nombre.padEnd(20).substring(0, 20)} \${i.cantidad.toString().padStart(3)} \${i.precio_venta.toFixed(2).padStart(6)} \${(i.cantidad*i.precio_venta).toFixed(2).padStart(8)}\\n\`;
    });

    const ticket = \`<pre style="text-align: left; font-family: monospace; font-size: 13px; line-height: 1.2; background: #fff; color: #000; padding: 20px; border-radius: 8px; margin: 0; overflow-x: hidden;">
=========================================
       MINISUPER KRN - SUCURSAL 3
     El Alto - Z. Villa Dolores N° 330
            TELÉFONO: 4367541
            La Paz – Bolivia
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
=========================================</pre>\`;

    Swal.fire({
      html: ticket,
      showConfirmButton: true,
      confirmButtonText: 'Imprimir / Cerrar',
      confirmButtonColor: '#4f46e5',
      background: '#e0e0e0',
      width: '400px'
    });
  }

  // Funciones globales originales
`;
content = content.replace("// 1. Cargar productos", ticketLogic + "    // 1. Cargar productos");

// 4. Update Swal processing
const originalSwal = `await Swal.fire({
              title: '¡Venta Procesada!',
              text: \`Operación exitosa. Total cobrado: Bs. \${(carrito.reduce((acc, curr) => acc + (curr.precio_venta * curr.cantidad), 0)).toFixed(2)}. La factura se está descargando.\`,
              icon: 'success',
              background: '#1e1f22',
              color: '#fff',
              confirmButtonColor: '#4f46e5',
              timer: 3500,
              showConfirmButton: false
            });`;

content = content.replace(originalSwal, `mostrarTicketFiscal(data.venta, formValues, carrito, metodo_pago);
            document.getElementById('monto_recibido').value = '';
            document.getElementById('cambio_efectivo').textContent = 'Bs. 0.00';`);

fs.writeFileSync(ventasPath, content, 'utf8');
console.log('Done modifying ventas/nueva.astro');
