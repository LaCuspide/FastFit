/* ============================================================
   FastFit · Cuentas, sesión y reservas
   ------------------------------------------------------------
   Todo se guarda en el navegador (localStorage), no en un
   servidor. Sirve para demostrar el flujo completo, pero cada
   dispositivo/navegador tiene sus propias cuentas y reservas.
   Para una versión real hace falta un backend (p. ej. Firebase
   o Supabase) que reemplace este archivo.
   ============================================================ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(t) {
  return (t || "").toString().replace(/[<>"`\\]/g, "").replace(/\s+/g, " ").trim();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* Lectura/escritura segura en localStorage (puede fallar en modo privado) */
const LS = {
  get(k, d) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v === null || v === undefined ? d : v;
    } catch (e) { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { toast("No se pudo guardar (almacenamiento lleno o bloqueado)"); return false; }
  },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

/* Hash simple de contraseñas con SHA-256 (suficiente para esta demo, no para producción real) */
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
async function sha(str) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fastfit:" + str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) { return "h" + hashStr("fastfit:" + str); }
}

/* Cuentas y sesión */
const auth = {
  users() { return LS.get("fastfit_users", []); },
  saveUsers(u) { return LS.set("fastfit_users", u); },
  current() {
    const e = LS.get("fastfit_session", null);
    return e ? (this.users().find((u) => u.email === e) || null) : null;
  },
  login(email) { LS.set("fastfit_session", email); },
  logout() { LS.del("fastfit_session"); },
};

/* Reservas (compartidas entre todos los usuarios de este navegador) */
const bookings = () => LS.get("fastfit_bookings", []);
const sortBookings = (a, b) => (a.date + pad2(a.hour)).localeCompare(b.date + pad2(b.hour));

/* Agrega al arreglo PROS (de data.js) los profesionales que se registraron en este navegador */
function loadCustomPros() {
  auth.users().filter((u) => u.role === "pro" && u.pro).forEach((u) => {
    if (!PROS.some((p) => p.id === u.pro.id)) PROS.push(u.pro);
  });
}

/* Actualiza (o agrega) un profesional dentro de PROS, tras editar su perfil */
function syncPro(pro) {
  const i = PROS.findIndex((p) => p.id === pro.id);
  if (i >= 0) PROS[i] = pro; else PROS.push(pro);
}

/* Marca un campo de formulario como inválido/válido y muestra el mensaje de error */
function fieldErr(id, msg) {
  const el = document.getElementById(id);
  const f = el.closest(".field");
  f.classList.toggle("invalid", !!msg);
  const e = f.querySelector(".err");
  if (e) e.textContent = msg || "";
  return !msg;
}

/* Lee un ?next=archivo.html de la URL, validando que sea un nombre de archivo seguro */
function safeNext(params) {
  const n = params.get("next") || "";
  return /^[a-z0-9-]+\.html$/.test(n) ? n : "";
}

const ratingText = (p, long) => (p.reviews ? `★ ${p.rating.toFixed(1)} (${p.reviews}${long ? " reseñas" : ""})` : "★ Nuevo");

/* Convierte una foto subida por el usuario en un cuadrado recortado, guardable en localStorage */
function fileToAvatar(file, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const sz = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      c.getContext("2d").drawImage(img, (img.width - sz) / 2, (img.height - sz) / 2, sz, sz, 0, 0, 256, 256);
      cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => toast("No se pudo leer la imagen");
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}
