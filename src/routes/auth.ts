import { Hono } from 'hono';
import { supabase } from '../lib/supabase';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

const authApp = new Hono();

// El secreto JWT debería venir del environment, usaremos un default robusto local
const JWT_SECRET = 's3cr3t_m1n1sup3r_2026_k3y_v3ry_s4f3';

/**
 * Utilidad criptográfica robusta (Web Crypto API) para generar y verificar Hashes SHA-256 + Salt
 */
const SALT = "MINISUPER_SALT_12345";

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Ruta de seed removida por seguridad

// ---------------------------------------------------------
// POST /login - Autenticación y Generación de Cookie
// ---------------------------------------------------------
const loginHandler = async (c: any) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ success: false, error: 'Credenciales incompletas' }, 400);
    }

    // Buscar el usuario por email/username
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !usuario) {
      return c.json({ success: false, error: 'Usuario o contraseña incorrectos' }, 401);
    }

    // Hashear el pass entrante y comparar
    const inputHash = await hashPassword(password);
    if (inputHash !== usuario.password_hash) {
      return c.json({ success: false, error: 'Usuario o contraseña incorrectos' }, 401);
    }

    // Generar JWT
    const payload = {
      id: usuario.id_usuario,
      nombre_real: usuario.nombre_real,
      username: usuario.username,
      rol: usuario.rol,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // Expira en 24h
    };
    
    const token = await sign(payload, JWT_SECRET);

    // Sembrar la cookie HttpOnly
    setCookie(c, 'auth_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24h
      sameSite: 'Lax',
    });

    return c.json({ 
      success: true, 
      message: 'Inicio de sesión exitoso',
      user: { id: usuario.id, nombre: usuario.nombre_real, rol: usuario.rol }
    }, 200);

  } catch (err: any) {
    return c.json({ success: false, error: 'Solicitud inválida' }, 400);
  }
};

authApp.post('/login', loginHandler);
authApp.post('/login/', loginHandler);

// ---------------------------------------------------------
// POST /logout - Destruir sesión
// ---------------------------------------------------------
const logoutHandler = async (c: any) => {
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.json({ success: true, message: 'Sesión finalizada exitosamente' }, 200);
};

authApp.post('/logout', logoutHandler);
authApp.post('/logout/', logoutHandler);

// ---------------------------------------------------------
// GET /usuarios - Listar personal (Solo ADMIN)
// ---------------------------------------------------------
authApp.get('/usuarios', async (c) => {
  try {
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ success: false, error: 'No autorizado' }, 401);
    const decodedPayload = await verify(token, JWT_SECRET, "HS256");
    if (decodedPayload.rol !== 'admin') return c.json({ success: false, error: 'Prohibido' }, 403);

    const { data, error } = await supabase
      .from('usuarios')
      .select('id:id_usuario, nombre_real, username, rol, creado_en:ultimo_login')
      .order('id_usuario', { ascending: false });

    if (error) throw error;
    return c.json(data, 200);
  } catch (err) {
    return c.json({ success: false, error: 'Solicitud inválida' }, 400);
  }
});

// ---------------------------------------------------------
// POST /usuarios - Registrar personal (Solo ADMIN)
// ---------------------------------------------------------
const registerUserHandler = async (c: any) => {
  try {
    // 1. Extraer y verificar el JWT desde la cookie manual
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ success: false, error: 'No autorizado' }, 401);

    let decodedPayload: any;
    try {
      decodedPayload = await verify(token, JWT_SECRET, "HS256");
    } catch(e: any) {
      console.error("Error al verificar JWT:", e);
      return c.json({ success: false, error: 'Token inválido o expirado: ' + e.message }, 401);
    }

    // 2. Control de Acceso Riguroso (RBAC Backend)
    if (decodedPayload.rol !== 'admin') {
      return c.json({ success: false, error: 'Prohibido: Solo un Administrador puede registrar personal.' }, 403);
    }

    // 3. Procesar Alta
    const body = await c.req.json();
    console.log("Intentando registrar usuario con body:", body);
    const { nombre_real, username, password, rol } = body;

    if (!nombre_real || !username || !password || !rol) {
      return c.json({ success: false, error: 'Faltan campos obligatorios' }, 400);
    }

    if (!['vendedor', 'almacenero', 'admin'].includes(rol)) {
      return c.json({ success: false, error: 'Rol no válido' }, 400);
    }

    // Hashear contraseña nueva
    const password_hash = await hashPassword(password);

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nombre_real, username, password_hash, rol }])
      .select('id:id_usuario, nombre_real, username, rol')
      .single();

    if (error) {
      if (error.code === '23505') { // unique violation
        return c.json({ success: false, error: 'El correo electrónico (username) ya está registrado.' }, 400);
      }
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, data, message: 'Empleado registrado exitosamente.' }, 201);

  } catch (err: any) {
    return c.json({ success: false, error: 'Solicitud inválida' }, 400);
  }
};

authApp.post('/usuarios', registerUserHandler);
authApp.post('/usuarios/', registerUserHandler);

// ---------------------------------------------------------
// PUT /usuarios/:id - Actualizar rol o contraseña (Solo ADMIN)
// ---------------------------------------------------------
authApp.put('/usuarios/:id', async (c) => {
  try {
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ success: false, error: 'No autorizado' }, 401);
    const decodedPayload = await verify(token, JWT_SECRET, "HS256");
    if (decodedPayload.rol !== 'admin') return c.json({ success: false, error: 'Prohibido' }, 403);

    const id = c.req.param('id');
    const body = await c.req.json();
    const { nombre_real, rol, password } = body;

    const updates: any = {};
    if (nombre_real) updates.nombre_real = nombre_real;
    if (rol) updates.rol = rol;
    if (password) {
      updates.password_hash = await hashPassword(password);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id_usuario', id)
      .select('id:id_usuario, nombre_real, username, rol')
      .single();

    if (error) throw error;
    return c.json({ success: true, message: 'Usuario actualizado', data }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ---------------------------------------------------------
// DELETE /usuarios/:id - Eliminar personal (Solo ADMIN)
// ---------------------------------------------------------
authApp.delete('/usuarios/:id', async (c) => {
  try {
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ success: false, error: 'No autorizado' }, 401);
    const decodedPayload = await verify(token, JWT_SECRET, "HS256");
    if (decodedPayload.rol !== 'admin') return c.json({ success: false, error: 'Prohibido' }, 403);

    const id = c.req.param('id');
    
    // Evitar que el admin se borre a sí mismo
    if (id == decodedPayload.id) {
      return c.json({ success: false, error: 'No puedes eliminar tu propia cuenta.' }, 400);
    }

    const { error } = await supabase.from('usuarios').delete().eq('id_usuario', id);
    if (error) throw error;

    return c.json({ success: true, message: 'Usuario eliminado' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

export default authApp;
