/* ============================================================
   FastFit · Utilidades generales y componentes compartidos
   (header, footer, tarjetas de profesional, buscador, etc.)
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const params = new URLSearchParams(location.search);

const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const money = (n) => "S/ " + Number(n).toFixed(n % 1 ? 2 : 0);
const roleOf = (p) => (CATEGORIES.find((c) => c.key === p.cat) || {}).role || p.cat;
const getPro = (id) => PROS.find((p) => p.id === id);

const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const longDate = (isoStr) => {
  const [y, m, d] = isoStr.split("-").map(Number);
  const s = new Date(y, m - 1, d).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/* Reserva en curso (entre horario.html y confirmacion.html). Vive solo durante la pestaña. */
const pendingBooking = {
  get: () => { try { return JSON.parse(sessionStorage.getItem("fastfit_booking") || "null"); } catch (e) { return null; } },
  set: (v) => { try { sessionStorage.setItem("fastfit_booking", JSON.stringify(v)); } catch (e) {} },
  clear: () => { try { sessionStorage.removeItem("fastfit_booking"); } catch (e) {} },
};

/* ---------- Header y footer ---------- */
function renderHeader() {
  const header = $(".site-header");
  if (!header) return;
  const page = document.body.dataset.page;

  $$(".main-nav a[data-nav]", header).forEach((a) => a.classList.toggle("active", a.dataset.nav === page));

  const cur = auth.current();
  const isPro = !!cur && cur.role === "pro";
  const acctHref = isPro ? "panel.html" : "cuenta.html";
  const authArea = $("#auth-area");
  const mobileAuth = $("#mobile-auth");
  const authHTML = cur
    ? `<div class="user-menu"><button class="user-btn" id="user-btn" type="button" aria-haspopup="true"><span class="avatar-sm">${initials(cur.name)}</span><span class="user-name">${cur.name.split(" ")[0]}</span><span aria-hidden="true">▾</span></button><div class="user-dd" id="user-dd"><a href="${acctHref}">Mi perfil</a>${isPro ? `<a href="perfil.html?id=${cur.proId}">Ver perfil público</a>` : ""}<button type="button" data-logout>Cerrar sesión</button></div></div>`
    : '<a class="btn-auth ghost" href="login.html">Iniciar sesión</a><a class="btn-auth solid" href="registro.html">Registrarse</a>';
  const mobileHTML = cur
    ? `<a class="mobile-only" href="${acctHref}">Mi perfil</a><a class="mobile-only" href="index.html" data-logout>Cerrar sesión</a>`
    : '<a class="mobile-only" href="login.html">Iniciar sesión</a><a class="mobile-only" href="registro.html">Registrarse</a>';
  if (authArea) authArea.innerHTML = authHTML;
  if (mobileAuth) mobileAuth.innerHTML = mobileHTML;

  const toggle = $(".nav-toggle", header);
  if (toggle) toggle.addEventListener("click", () => $(".main-nav", header).classList.toggle("open"));
}

function renderFooter() {
  const y = $("#footer-year");
  if (y) y.textContent = new Date().getFullYear();
}

/* Clic global: cerrar sesión y abrir/cerrar el menú de usuario */
document.addEventListener("click", (e) => {
  const lo = e.target.closest("[data-logout]");
  if (lo) { e.preventDefault(); auth.logout(); location.href = "index.html"; return; }
  const dd = $("#user-dd");
  if (e.target.closest("#user-btn") && dd) { dd.classList.toggle("open"); return; }
  if (dd) dd.classList.remove("open");
});

/* ---------- Componentes ---------- */
function videoHTML(url) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `<div class="video-wrap"><iframe src="https://www.youtube.com/embed/${yt[1]}" title="Video de presentación" allowfullscreen loading="lazy"></iframe></div>`;
  return `<div class="video-wrap"><video src="${url}" controls playsinline preload="metadata"></video></div>`;
}

function avatar(p, large) {
  return `<div class="avatar${large ? " lg" : ""}">${initials(p.name)}${p.img ? `<img src="${p.img}" alt="${p.name}" onerror="this.remove()">` : ""}</div>`;
}

function card(p, inZone) {
  return `<article class="card">
    ${avatar(p)}
    <h3 class="name">${p.name}</h3>
    <p class="role">${roleOf(p)}</p>
    <p class="rating">${ratingText(p)}</p>
    ${inZone ? '<span class="zone-tag">En tu zona</span>' : ""}
    <div class="foot"><span class="price">${money(p.price)} / sesión</span>
    <a class="btn-primary" href="perfil.html?id=${p.id}">Ver perfil</a></div></article>`;
}

function searchBox(cat, loc) {
  const opts = CATEGORIES.map((c) => `<option value="${c.key}" ${c.key === cat ? "selected" : ""}>${c.role}</option>`).join("");
  const districtsInUse = DISTRICTS.filter((d) => PROS.some((p) => p.zone === d));
  const locOpts = '<option value="">Todos los distritos</option>' +
    districtsInUse.map((d) => `<option value="${d}" ${d === loc ? "selected" : ""}>${d}</option>`).join("");
  return `<form class="search-box" id="search-form" role="search">
    <div class="search-field"><label for="sb-cat">Qué necesitas</label><select id="sb-cat">${opts}</select></div>
    <div class="search-divider"></div>
    <div class="search-field"><label for="sb-loc">Ubicación</label>
      <select id="sb-loc">${locOpts}</select></div>
    <button class="btn-search" type="submit">Buscar</button></form>`;
}

function bindSearch() {
  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new URLSearchParams({ cat: $("#sb-cat").value, loc: $("#sb-loc").value });
    location.href = "buscar.html?" + q.toString();
  });
}

function chipsHTML(active, withAll) {
  const all = withAll ? `<button class="chip ${active === "" ? "active" : ""}" data-cat="">Todos</button>` : "";
  return all + CATEGORIES.map((c) => `<button class="chip ${active === c.key ? "active" : ""}" data-cat="${c.key}">${c.key}</button>`).join("");
}

function bookingRow(b, mode) {
  const pro = getPro(b.proId);
  const title = mode === "pro" ? `${b.name} · ${b.phone}` : (pro ? pro.name : "Profesional");
  const canCancel = mode === "user" && b.status === "confirmada" && b.date >= iso(new Date());
  return `<div class="booking"><div><b>${title}</b><div class="muted">${longDate(b.date)} · ${pad2(b.hour)}:00 · ${b.code}</div></div>
    <div class="booking-side"><span class="status ${b.status}">${b.status === "cancelada" ? "Cancelada" : "Confirmada"}</span>${canCancel ? `<button class="btn-primary btn-outline" data-cancel="${b.code}">Cancelar</button>` : ""}</div></div>`;
}

/* ---------- Ubicación GPS ---------- */
/* Busca el distrito (de DISTRICT_COORDS) más cercano a una coordenada. */
function nearestDistrict(lat, lng) {
  let best = null, bestDist = Infinity;
  for (const d of DISTRICTS) {
    const c = DISTRICT_COORDS[d];
    if (!c) continue;
    const dLat = lat - c[0], dLng = lng - c[1];
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return best;
}

/* Pide la ubicación del navegador y, si el usuario la permite, llama a
   onFound(distrito). Si no hay soporte, el usuario la deniega o falla,
   simplemente no hace nada (no rompe la página). */
function detectUserDistrict(onFound) {
  if (!("geolocation" in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const d = nearestDistrict(pos.coords.latitude, pos.coords.longitude);
      if (d) onFound(d);
    },
    () => {},
    { enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60 * 1000 }
  );
}

/* Fondo del hero: si no existe images/hero.jpg, se usa solo el color verde */
(function heroFallback() {
  const h = $(".hero");
  if (!h) return;
  const img = new Image();
  img.onerror = () => h.classList.add("no-photo");
  img.src = "images/hero.jpg";
})();
