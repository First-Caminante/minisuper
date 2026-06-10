import { Hono } from 'hono';
import { getSupabase } from '../lib/supabase';

const reportesApp = new Hono();

// GET /api/reportes?desde=...&hasta=...
reportesApp.get('/', async (c) => {
  try {
    const { desde, hasta } = c.req.query();
    
    // Parsear fechas a ISO string si existen, considerando UTC para la base de datos
    let query = getSupabase(c.env).from('ventas').select('id_venta, total_venta, fecha_venta, metodo_pago, detalle_ventas(cantidad, subtotal, productos(nombre))');

    if (desde) {
      // Ajuste básico a inicio del día (UTC aproximado para simplicidad, en un caso real se ajustaría al timezone local)
      const fromDate = new Date(desde);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte('fecha_venta', fromDate.toISOString());
    }
    if (hasta) {
      const toDate = new Date(hasta);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('fecha_venta', toDate.toISOString());
    }

    const { data: ventas, error } = await query;

    if (error) {
      return c.json({ success: false, error: 'Error al consultar ventas: ' + error.message }, 500);
    }

    // Calcular KPIs
    let totalRecaudado = 0;
    let transacciones = 0;
    const desglosePago: Record<string, number> = { efectivo: 0, tarjeta: 0, qr: 0 };
    
    // Para gráficos (Agrupación por Día)
    const ventasPorDia: Record<string, number> = {};

    // Productos más vendidos (Top 5)
    const productosMap: Record<string, number> = {};

    ventas?.forEach((v: any) => {
      totalRecaudado += v.total_venta;
      transacciones += 1;
      
      const metodo = v.metodo_pago ? v.metodo_pago.toLowerCase() : 'efectivo';
      desglosePago[metodo] = (desglosePago[metodo] || 0) + v.total_venta;

      const dateStr = new Date(v.fecha_venta).toLocaleDateString();
      ventasPorDia[dateStr] = (ventasPorDia[dateStr] || 0) + v.total_venta;

      // Agrupar productos
      if (v.detalle_ventas && Array.isArray(v.detalle_ventas)) {
        v.detalle_ventas.forEach((d: any) => {
          const nombre = d.productos?.nombre || 'Producto Desconocido';
          productosMap[nombre] = (productosMap[nombre] || 0) + d.cantidad;
        });
      }
    });

    const ticketPromedio = transacciones > 0 ? totalRecaudado / transacciones : 0;

    // Ordenar productos top
    const topProductos = Object.entries(productosMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    // Para la gráfica de líneas, ordenamos cronológicamente si es posible (ya lo da el locale string casi siempre en orden si parseamos)
    // Para simplificar, pasamos las keys y values como vienen.
    const tendenciaFechas = Object.keys(ventasPorDia);
    // Ordenar las fechas de menor a mayor
    tendenciaFechas.sort((a, b) => {
        const da = a.split('/').reverse().join(''); // basic sort, might need better logic depending on locale but it works well enough for quick stats
        const db = b.split('/').reverse().join('');
        return da.localeCompare(db);
    });

    const tendenciaMontos = tendenciaFechas.map(f => ventasPorDia[f]);

    return c.json({
      success: true,
      data: {
        kpis: {
          total_recaudado: totalRecaudado,
          transacciones: transacciones,
          ticket_promedio: ticketPromedio,
          desglose_pago: desglosePago
        },
        graficas: {
          tendencia: {
            fechas: tendenciaFechas,
            montos: tendenciaMontos
          },
          top_productos: topProductos
        }
      }
    });

  } catch (err) {
    console.error("Reportes Error:", err);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

export default reportesApp;
