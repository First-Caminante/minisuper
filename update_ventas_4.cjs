const fs = require('fs');
const path = require('path');

const ventasPath = path.join(__dirname, 'src/pages/ventas/nueva.astro');
let content = fs.readFileSync(ventasPath, 'utf8');

// 1. Extract and remove the forms from the right panel
const rightPanelStartRegex = /<div class="mb-4">\s*<label class="form-label text-muted small text-uppercase fw-semibold mb-3 tracking-wide">Datos del Cliente<\/label>/;
const rightPanelEndRegex = /<button class="btn btn-primary-gradient w-100 py-3 fs-5 fw-bold shadow-lg" id="btnConsolidar" disabled>\s*<i class="bi bi-check2-circle me-2"><\/i>Consolidar Venta\s*<\/button>\s*<\/div>/;

// Instead of regex slicing which can be tricky with HTML, I will replace the entire "Totales y Consolidación" div content
const oldTotales = `        <!-- Totales y Consolidación -->
        <div class="p-4 bg-dark bg-opacity-50 border-top border-secondary">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <span class="text-muted text-uppercase small fw-bold tracking-wide">Total a Cobrar</span>
            <span class="fs-2 fw-bold text-success" id="totalMonto">Bs. 0.00</span>
          </div>
          
          
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
          <div class="mb-4">
            <label class="form-label text-muted small text-uppercase fw-semibold mb-3 tracking-wide">Método de Pago</label>
            <div class="d-flex gap-2">
              <input type="radio" class="btn-check" name="metodo_pago" id="pago_efectivo" value="efectivo" checked>
              <label class="btn btn-outline-light flex-grow-1 py-2" for="pago_efectivo"><i class="bi bi-cash me-1"></i> Efectivo</label>

              <input type="radio" class="btn-check" name="metodo_pago" id="pago_tarjeta" value="tarjeta">
              <label class="btn btn-outline-light flex-grow-1 py-2" for="pago_tarjeta"><i class="bi bi-credit-card me-1"></i> Tarjeta</label>

              <input type="radio" class="btn-check" name="metodo_pago" id="pago_qr" value="qr">
              <label class="btn btn-outline-light flex-grow-1 py-2" for="pago_qr"><i class="bi bi-qr-code-scan me-1"></i> QR</label>
            
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
            <div id="form-qr" class="d-none text-center">
              <p class="text-white small mb-3"><i class="bi bi-info-circle me-1 text-info"></i> Escanee el código para pagar</p>
              <img src="/images/qr-pago.png" alt="Código QR" class="img-fluid rounded border border-light mb-3" style="width: 100%; max-width: 300px;">
              <div class="form-check text-white small d-flex justify-content-center">
                <input class="form-check-input me-2" type="checkbox" id="checkQR" checked>
                <label class="form-check-label" for="checkQR">Confirmar transferencia</label>
              </div>
            </div>
          </div>

          <button class="btn btn-primary-gradient w-100 py-3 fs-5 fw-bold shadow-lg" id="btnConsolidar" disabled>
            <i class="bi bi-check2-circle me-2"></i>Consolidar Venta
          </button>
        </div>`;

const newTotales = `        <!-- Totales y Consolidación -->
        <div class="p-4 bg-dark bg-opacity-50 border-top border-secondary">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <span class="text-muted text-uppercase small fw-bold tracking-wide">Total a Cobrar</span>
            <span class="fs-2 fw-bold text-success" id="totalMonto">Bs. 0.00</span>
          </div>
          
          <button class="btn btn-primary-gradient w-100 py-3 fs-5 fw-bold shadow-lg" id="btnOpenCheckout" disabled data-bs-toggle="modal" data-bs-target="#checkoutModal">
            <i class="bi bi-wallet2 me-2"></i>Cobrar
          </button>
        </div>`;

content = content.replace(oldTotales, newTotales);

// 2. Add Modal before </Layout>
const modalHtml = `
  <!-- Modal Checkout -->
  <div class="modal fade" id="checkoutModal" tabindex="-1" aria-labelledby="checkoutModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark border-secondary">
        <div class="modal-header border-secondary">
          <h5 class="modal-title text-white" id="checkoutModalLabel">Completar Pago</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
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
          
          <div class="mb-4">
            <label class="form-label text-muted small text-uppercase fw-semibold mb-3 tracking-wide">Método de Pago</label>
            <div class="d-flex gap-2">
              <input type="radio" class="btn-check" name="metodo_pago" id="pago_efectivo" value="efectivo" checked>
              <label class="btn btn-outline-light flex-grow-1 py-2" for="pago_efectivo"><i class="bi bi-cash me-1"></i> Efectivo</label>

              <input type="radio" class="btn-check" name="metodo_pago" id="pago_tarjeta" value="tarjeta">
              <label class="btn btn-outline-light flex-grow-1 py-2" for="pago_tarjeta"><i class="bi bi-credit-card me-1"></i> Tarjeta</label>

              <input type="radio" class="btn-check" name="metodo_pago" id="pago_qr" value="qr">
              <label class="btn btn-outline-light flex-grow-1 py-2" for="pago_qr"><i class="bi bi-qr-code-scan me-1"></i> QR</label>
            </div>
          </div>
          
          <!-- Formularios Dinámicos -->
          <div id="dynamicPaymentForms" class="p-3 bg-dark bg-opacity-25 border border-secondary rounded">
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
            <div id="form-qr" class="d-none text-center">
              <p class="text-white small mb-3"><i class="bi bi-info-circle me-1 text-info"></i> Escanee el código para pagar</p>
              <img src="/images/qr-pago.png" alt="Código QR" class="img-fluid rounded border border-light mb-3" style="width: 100%; max-width: 300px;">
              <div class="form-check text-white small d-flex justify-content-center">
                <input class="form-check-input me-2" type="checkbox" id="checkQR" checked>
                <label class="form-check-label" for="checkQR">Confirmar transferencia</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer border-secondary">
          <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary-gradient" id="btnConfirmarVenta">Confirmar Venta</button>
        </div>
      </div>
    </div>
  </div>

</Layout>`;
content = content.replace("</Layout>", modalHtml);

// 3. Update JS Logic
// Replace `btnConsolidar` with `btnOpenCheckout` and `btnConfirmarVenta` in variables
content = content.replace("const btnConsolidar = document.getElementById('btnConsolidar');", "const btnOpenCheckout = document.getElementById('btnOpenCheckout');\n    const btnConfirmarVenta = document.getElementById('btnConfirmarVenta');");

content = content.replace("btnConsolidar.disabled = true;", "btnOpenCheckout.disabled = true;");
content = content.replace("btnConsolidar.disabled = false;", "btnOpenCheckout.disabled = false;");

// Update the listener
const oldListenerStart = `    // 6. Enviar Venta al Backend
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

        btnConsolidar.disabled = true;
        const originalHtml = btnConsolidar.innerHTML;
        btnConsolidar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';`;

const newListenerStart = `    // 6. Enviar Venta al Backend
    btnConfirmarVenta.addEventListener('click', async () => {
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

        btnConfirmarVenta.disabled = true;
        const originalHtml = btnConfirmarVenta.innerHTML;
        btnConfirmarVenta.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';`;
content = content.replace(oldListenerStart, newListenerStart);

// Replace the end of the listener
const oldListenerEnd = `        btnConsolidar.disabled = false;
        btnConsolidar.innerHTML = originalHtml;
      }
    });`;
const newListenerEnd = `        btnConfirmarVenta.disabled = false;
        btnConfirmarVenta.innerHTML = originalHtml;
      }
    });`;
content = content.replace(oldListenerEnd, newListenerEnd);

// Also need to hide modal when confirmed
const oldSwalReplacement = `mostrarTicketFiscal(data.venta, formValues, carrito, metodo_pago);
            document.getElementById('monto_recibido').value = '';
            document.getElementById('cambio_efectivo').textContent = 'Bs. 0.00';
            document.getElementById('input_nombre_cliente').value = '';
            document.getElementById('input_nit_cliente').value = '';`;
const newSwalReplacement = `bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
            mostrarTicketFiscal(data.venta, formValues, carrito, metodo_pago);
            document.getElementById('monto_recibido').value = '';
            document.getElementById('cambio_efectivo').textContent = 'Bs. 0.00';
            document.getElementById('input_nombre_cliente').value = '';
            document.getElementById('input_nit_cliente').value = '';`;
content = content.replace(oldSwalReplacement, newSwalReplacement);

fs.writeFileSync(ventasPath, content, 'utf8');
console.log('Update 4 successful');
