/* ============================================================
   FastFit · Lógica de cada página
   Se apoya en data.js (datos), auth.js (cuentas/sesión) y
   ui.js (componentes compartidos). Qué función se ejecuta lo
   decide el atributo data-page del <body> de cada página.
   ============================================================ */

/* ---------- HOME ---------- */
function initHome() {
  $("#search-slot").innerHTML = searchBox("Personal Trainers", "San Borja, Lima");
  bindSearch();
  $("#chips").innerHTML = chipsHTML("", false);
  $$("#chips .chip").forEach((b) => b.addEventListener("click", () => {
    location.href = "buscar.html?cat=" + encodeURIComponent(b.dataset.cat);
  }));
  $("#featured").innerHTML = PROS.slice(0, 3).map((p) => card(p)).join("");
}

/* ---------- BUSCAR ---------- */
function initBuscar() {
  const state = {
    cat: params.get("cat") || "",
    loc: params.get("loc") || "San Borja, Lima",
    max: 200, minRating: 0, sort: "rel",
  };
  if (state.cat && !CATEGORIES.some((c) => c.key === state.cat)) state.cat = "";

  $("#search-slot").innerHTML = searchBox(state.cat || "Personal Trainers", state.loc);
  bindSearch();

  function paintChips() {
    $("#chips").innerHTML = chipsHTML(state.cat, true);
    $$("#chips .chip").forEach((b) => b.addEventListener("click", () => { state.cat = b.dataset.cat; paintChips(); paintResults(); }));
  }

  function paintResults() {
    const locPart = norm(state.loc.split(",")[0]);
    let list = PROS.filter((p) => (!state.cat || p.cat === state.cat) && p.price <= state.max && p.rating >= state.minRating)
      .map((p) => ({ p, zone: !!locPart && norm(p.zone).includes(locPart) }));
    list.sort((a, b) => {
      if (state.sort === "rating") return b.p.rating - a.p.rating;
      if (state.sort === "price-asc") return a.p.price - b.p.price;
      if (state.sort === "price-desc") return b.p.price - a.p.price;
      return (b.zone - a.zone) || (b.p.rating - a.p.rating);
    });
    $("#count").textContent = list.length + (list.length === 1 ? " profesional encontrado" : " profesionales encontrados");
    $("#results-title").textContent = state.cat || "Todos los profesionales";
    $("#results").innerHTML = list.length
      ? list.map((x) => card(x.p, x.zone)).join("")
      : '<div class="empty"><b>No encontramos resultados</b><br>Prueba ampliando el precio o quitando algún filtro.</div>';
  }

  $("#f-price").addEventListener("input", (e) => { state.max = +e.target.value; $("#f-price-val").textContent = "Hasta " + money(state.max); paintResults(); });
  $("#f-rating").addEventListener("change", (e) => { state.minRating = +e.target.value; paintResults(); });
  $("#f-sort").addEventListener("change", (e) => { state.sort = e.target.value; paintResults(); });
  $("#f-reset").addEventListener("click", () => {
    state.max = 200; state.minRating = 0; state.sort = "rel";
    $("#f-price").value = 200; $("#f-price-val").textContent = "Hasta S/ 200";
    $("#f-rating").value = 0; $("#f-sort").value = "rel"; paintResults();
  });

  paintChips(); paintResults();
}

/* ---------- PERFIL (público, de un profesional) ---------- */
function initPerfil() {
  const p = getPro(params.get("id"));
  const root = $("#profile-root");
  if (!p) {
    root.innerHTML = '<div class="empty">Profesional no encontrado. <a href="buscar.html" style="color:var(--accent);font-weight:600">Volver a explorar</a></div>';
    return;
  }
  document.title = p.name + " · FastFit";
  root.innerHTML = `
    <div class="breadcrumb"><a href="index.html">Inicio</a> / <a href="buscar.html?cat=${encodeURIComponent(p.cat)}">${p.cat}</a> / ${p.name}</div>
    <div class="two-col">
      <article>
        <div class="panel"><div class="profile-head">${avatar(p, true)}
          <div><h1>${p.name}</h1><div class="role">${roleOf(p)}</div>
          <div class="rating">${ratingText(p, true)} · ${p.zone}, Lima</div></div></div></div>
        <div class="panel"><h2>Sobre mí</h2><p style="line-height:1.6;color:var(--muted);margin:0">${p.bio}</p></div>
        ${p.video ? '<div class="panel"><h2>Video de presentación</h2>' + videoHTML(p.video) + "</div>" : ""}
        <div class="panel"><h2>Servicios</h2><div class="tags">${p.services.map((s) => `<span class="tag">${s}</span>`).join("")}</div></div>
        <div class="panel"><h2>Reseñas</h2>${!p.reviews ? '<p class="muted" style="margin:0">Aún no tiene reseñas.</p>' : REVIEWS.map((r) => `<div class="review"><b>${r.who} <span>★ 5.0</span></b>${r.text}</div>`).join("")}</div>
      </article>
      <aside class="sticky-box"><div class="panel">
        <p class="price-big">${money(p.price)} <span class="muted">/ sesión</span></p>
        <p class="muted" style="margin:0 0 18px">Sesión de 60 min · Cancelación gratuita hasta 24 h antes</p>
        <a class="btn-primary btn-coral btn-lg" style="display:block;text-align:center" href="horario.html?id=${p.id}">Reservar sesión</a>
      </div></aside>
    </div>`;
}

/* ---------- HORARIO ---------- */
function initHorario() {
  const p = getPro(params.get("id"));
  const root = $("#schedule-root");
  if (!p) { root.innerHTML = '<div class="empty">Profesional no encontrado. <a href="buscar.html" style="color:var(--accent);font-weight:600">Volver a explorar</a></div>'; return; }

  const HOURS = [7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20];
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  let selDay = 0, selTime = null;

  function isFree(d, h) {
    if (iso(d) === iso(today) && h <= today.getHours()) return false;
    if (bookings().some((x) => x.proId === p.id && x.date === iso(d) && x.hour === h && x.status === "confirmada")) return false;
    if (p.owner) return true; // profesionales registrados: libres salvo reservas ya hechas
    return hashStr(p.id + iso(d) + h) % 4 !== 0; // disponibilidad de ejemplo
  }

  root.innerHTML = `
    <div class="breadcrumb"><a href="index.html">Inicio</a> / <a href="perfil.html?id=${p.id}">${p.name}</a> / Selecciona horario</div>
    <div class="two-col">
      <div class="panel"><h2>Elige día y hora</h2><div class="days" id="days"></div><h3>Horarios disponibles</h3><div class="slots" id="slots"></div></div>
      <aside class="sticky-box"><div class="panel">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">${avatar(p)}<div><b>${p.name}</b><div class="muted">${roleOf(p)}</div></div></div>
        <div class="summary-row"><span>Fecha</span><span id="sum-date">—</span></div>
        <div class="summary-row"><span>Hora</span><span id="sum-time">—</span></div>
        <div class="summary-row"><span>Duración</span><span>60 min</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(p.price)}</span></div>
        <button class="btn-primary btn-coral btn-lg" id="go" style="width:100%;margin-top:16px" disabled>Continuar al pago</button>
      </div></aside>
    </div>`;

  function paintDays() {
    $("#days").innerHTML = days.map((d, i) => `<button class="day ${i === selDay ? "active" : ""}" data-i="${i}"><small>${d.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "")}</small><strong>${d.getDate()}</strong></button>`).join("");
    $$("#days .day").forEach((b) => b.addEventListener("click", () => { selDay = +b.dataset.i; selTime = null; paintDays(); paintSlots(); paintSummary(); }));
  }
  function paintSlots() {
    $("#slots").innerHTML = HOURS.map((h) => {
      const free = isFree(days[selDay], h);
      return `<button class="slot ${selTime === h ? "active" : ""}" data-h="${h}" ${free ? "" : "disabled"}>${String(h).padStart(2, "0")}:00</button>`;
    }).join("");
    $$("#slots .slot:not([disabled])").forEach((b) => b.addEventListener("click", () => { selTime = +b.dataset.h; paintSlots(); paintSummary(); }));
  }
  function paintSummary() {
    $("#sum-date").textContent = longDate(iso(days[selDay]));
    $("#sum-time").textContent = selTime === null ? "—" : String(selTime).padStart(2, "0") + ":00";
    $("#go").disabled = selTime === null;
  }
  $("#go").addEventListener("click", () => {
    if (selTime === null) return;
    pendingBooking.set({ proId: p.id, date: iso(days[selDay]), hour: selTime });
    location.href = "checkout.html";
  });
  paintDays(); paintSlots(); paintSummary();
}

/* ---------- CHECKOUT ---------- */
function initCheckout() {
  const b = pendingBooking.get();
  const p = b && getPro(b.proId);
  const root = $("#checkout-root");
  if (!b || !p) { root.innerHTML = '<div class="empty">No hay una reserva en curso. <a href="buscar.html" style="color:var(--accent);font-weight:600">Buscar profesional</a></div>'; return; }

  const fee = Math.round(p.price * 0.1 * 100) / 100;
  const total = p.price + fee;
  let method = "card";

  root.innerHTML = `
    <div class="breadcrumb"><a href="index.html">Inicio</a> / <a href="horario.html?id=${p.id}">Horario</a> / Pago</div>
    <div class="two-col">
      <form id="pay-form" class="panel" novalidate>
        ${auth.current() ? "" : '<p class="notice" style="margin:0 0 18px">¿Ya tienes cuenta? <a href="login.html?next=checkout.html" style="color:var(--accent);font-weight:600">Inicia sesión</a> para guardar tus reservas.</p>'}
        <h2>Tus datos</h2>
        <div class="form-grid">
          <div class="field full"><label for="f-name">Nombre completo</label><input id="f-name" autocomplete="name"><div class="err"></div></div>
          <div class="field"><label for="f-email">Correo electrónico</label><input id="f-email" type="email" autocomplete="email"><div class="err"></div></div>
          <div class="field"><label for="f-phone">Celular</label><input id="f-phone" inputmode="numeric" maxlength="9" placeholder="9XXXXXXXX" autocomplete="tel"><div class="err"></div></div>
        </div>
        <h2 style="margin-top:28px">Método de pago</h2>
        <div class="pay-methods">
          <button type="button" class="pay-method active" data-m="card">Tarjeta</button>
          <button type="button" class="pay-method" data-m="yape">Yape</button>
          <button type="button" class="pay-method" data-m="plin">Plin</button>
        </div>
        <div id="card-fields" class="form-grid">
          <div class="field full"><label for="f-card">Número de tarjeta</label><input id="f-card" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" autocomplete="cc-number"><div class="err"></div></div>
          <div class="field"><label for="f-exp">Vencimiento</label><input id="f-exp" maxlength="5" placeholder="MM/AA" autocomplete="cc-exp"><div class="err"></div></div>
          <div class="field"><label for="f-cvv">CVV</label><input id="f-cvv" inputmode="numeric" maxlength="4" placeholder="123" autocomplete="cc-csc"><div class="err"></div></div>
        </div>
        <p id="wallet-note" class="muted" style="display:none;line-height:1.5">Al confirmar te mostraremos las instrucciones para completar el pago desde tu app.</p>
        <button class="btn-primary btn-coral btn-lg" type="submit" style="width:100%;margin-top:24px">Pagar ${money(total)}</button>
      </form>
      <aside class="sticky-box"><div class="panel">
        <h2>Resumen</h2>
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">${avatar(p)}<div><b>${p.name}</b><div class="muted">${roleOf(p)}</div></div></div>
        <div class="summary-row"><span>Fecha</span><span>${longDate(b.date)}</span></div>
        <div class="summary-row"><span>Hora</span><span>${String(b.hour).padStart(2, "0")}:00</span></div>
        <div class="summary-row"><span>Sesión (60 min)</span><span>${money(p.price)}</span></div>
        <div class="summary-row"><span>Tarifa de servicio (10%)</span><span>${money(fee)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(total)}</span></div>
      </div></aside>
    </div>`;

  const acct = auth.current();
  if (acct) { $("#f-name").value = acct.name; $("#f-email").value = acct.email; $("#f-phone").value = acct.phone || ""; }

  $$(".pay-method").forEach((btn) => btn.addEventListener("click", () => {
    method = btn.dataset.m;
    $$(".pay-method").forEach((x) => x.classList.toggle("active", x === btn));
    $("#card-fields").style.display = method === "card" ? "grid" : "none";
    $("#wallet-note").style.display = method === "card" ? "none" : "block";
  }));
  $("#f-card").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); });
  $("#f-exp").addEventListener("input", (e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); e.target.value = v; });
  $("#f-cvv").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, ""); });
  $("#f-phone").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, ""); });

  $("#pay-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = clean($("#f-name").value.trim()), email = $("#f-email").value.trim(), phone = $("#f-phone").value.trim();
    let ok = true;
    ok = fieldErr("f-name", name.length < 3 ? "Ingresa tu nombre completo" : "") && ok;
    ok = fieldErr("f-email", EMAIL_RE.test(email) ? "" : "Ingresa un correo válido") && ok;
    ok = fieldErr("f-phone", /^9\d{8}$/.test(phone) ? "" : "Celular de 9 dígitos que empiece con 9") && ok;
    if (method === "card") {
      const num = $("#f-card").value.replace(/\s/g, ""), exp = $("#f-exp").value, cvv = $("#f-cvv").value;
      ok = fieldErr("f-card", /^\d{16}$/.test(num) ? "" : "Ingresa los 16 dígitos") && ok;
      const m = exp.match(/^(\d{2})\/(\d{2})$/);
      const now = new Date();
      const valid = m && +m[1] >= 1 && +m[1] <= 12 && new Date(2000 + +m[2], +m[1], 0, 23, 59) >= now;
      ok = fieldErr("f-exp", valid ? "" : "Fecha inválida o vencida") && ok;
      ok = fieldErr("f-cvv", /^\d{3,4}$/.test(cvv) ? "" : "CVV inválido") && ok;
    }
    if (!ok) return;
    // Pago SIMULADO: aquí integrarías tu pasarela (Culqi, Izipay, Niubiz, etc.). No se guardan datos de tarjeta.
    const code = "FF-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const done = { ...b, name, email, phone, method, total, code };
    pendingBooking.set(done);
    const all = bookings();
    all.push({ ...done, status: "confirmada", createdAt: Date.now(), userEmail: (auth.current() || {}).email || null });
    LS.set("fastfit_bookings", all);
    location.href = "confirmacion.html";
  });
}

/* ---------- CONFIRMACIÓN ---------- */
function initConfirmacion() {
  const b = pendingBooking.get();
  const p = b && getPro(b.proId);
  const root = $("#confirm-root");
  if (!b || !p || !b.code) { root.innerHTML = '<div class="empty">No hay una reserva confirmada. <a href="index.html" style="color:var(--accent);font-weight:600">Ir al inicio</a></div>'; return; }
  const methods = { card: "Tarjeta", yape: "Yape", plin: "Plin" };
  root.innerHTML = `<div class="confirm-box">
    <div class="check">✓</div><h1>¡Reserva confirmada!</h1>
    <p class="muted" style="font-size:15px">Enviamos los detalles a ${b.email}</p>
    <div class="code">${b.code}</div>
    <div class="panel">
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">${avatar(p)}<div><b>${p.name}</b><div class="muted">${roleOf(p)}</div></div></div>
      <div class="summary-row"><span>Fecha</span><span>${longDate(b.date)}</span></div>
      <div class="summary-row"><span>Hora</span><span>${String(b.hour).padStart(2, "0")}:00 (60 min)</span></div>
      <div class="summary-row"><span>Método de pago</span><span>${methods[b.method]}</span></div>
      <div class="summary-row total"><span>Total</span><span>${money(b.total)}</span></div>
    </div>
    <div class="actions">
      <button class="btn-primary btn-lg btn-outline" id="ics">Agregar al calendario</button>
      <a class="btn-primary btn-lg btn-coral" id="home" href="index.html">Volver al inicio</a>
    </div></div>`;
  $("#home").addEventListener("click", () => pendingBooking.clear());
  $("#ics").addEventListener("click", () => {
    const [y, m, d] = b.date.split("-").map(Number);
    const fmt = (h) => `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}0000`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FastFit//ES", "BEGIN:VEVENT", "UID:" + b.code + "@fastfit",
      "DTSTAMP:" + fmt(new Date().getHours()), "DTSTART:" + fmt(b.hour), "DTEND:" + fmt(b.hour + 1),
      "SUMMARY:Sesión FastFit con " + p.name, "DESCRIPTION:Código de reserva " + b.code, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "fastfit-" + b.code + ".ics"; a.click(); URL.revokeObjectURL(a.href);
    toast("Evento descargado");
  });
}

/* ---------- LOGIN ---------- */
function initLogin() {
  if (auth.current()) { location.href = auth.current().role === "pro" ? "panel.html" : "index.html"; return; }
  const next = safeNext(params);
  $("#login-root").innerHTML = `<div class="auth-card">
    <h1>Iniciar sesión</h1><p class="muted" style="margin:0 0 20px">Accede como usuario o como profesional.</p>
    <form id="login-form" novalidate>
      <div class="field"><label for="l-email">Correo electrónico</label><input id="l-email" type="email" autocomplete="email"><div class="err"></div></div>
      <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" type="password" autocomplete="current-password"><div class="err"></div></div>
      <div class="form-err" id="l-err"></div>
      <button class="btn-primary btn-coral btn-lg" type="submit" style="width:100%">Ingresar</button>
    </form>
    <p class="auth-alt">¿No tienes cuenta? <a href="registro.html${next ? "?next=" + next : ""}">Regístrate como usuario</a> o <a href="registro.html?tipo=pro">como profesional</a></p></div>`;
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#l-email").value.trim().toLowerCase(), pass = $("#l-pass").value;
    let ok = fieldErr("l-email", EMAIL_RE.test(email) ? "" : "Ingresa un correo válido");
    ok = fieldErr("l-pass", pass ? "" : "Ingresa tu contraseña") && ok;
    if (!ok) return;
    const u = auth.users().find((x) => x.email === email);
    const h = await sha(pass);
    if (!u || u.passHash !== h) { $("#l-err").textContent = "Correo o contraseña incorrectos."; return; }
    auth.login(email);
    location.href = next || (u.role === "pro" ? "panel.html" : "index.html");
  });
}

/* ---------- REGISTRO (usuario o profesional) ---------- */
function initRegistro() {
  if (auth.current()) { location.href = auth.current().role === "pro" ? "panel.html" : "index.html"; return; }
  let tipo = params.get("tipo") === "pro" ? "pro" : "user";
  const next = safeNext(params);
  const root = $("#registro-root");
  const vals = {};

  function paint() {
    const proFields = tipo === "pro" ? `
      <div class="field"><label for="r-cat">Especialidad</label><select id="r-cat">${CATEGORIES.map((c) => `<option value="${c.key}">${c.role}</option>`).join("")}</select><div class="err"></div></div>
      <div class="field"><label for="r-zone">Distrito principal</label><select id="r-zone">${DISTRICTS.map((d) => `<option>${d}</option>`).join("")}</select><div class="err"></div></div>
      <div class="field"><label for="r-price">Tarifa por sesión (S/)</label><input id="r-price" type="number" min="20" max="500" step="5" placeholder="80"><div class="err"></div></div>
      <div class="field"><label for="r-services">Servicios (separados por coma)</label><input id="r-services" placeholder="Fuerza, Movilidad, Plan mensual"><div class="err"></div></div>
      <div class="field full"><label for="r-bio">Cuéntanos sobre ti</label><textarea id="r-bio" maxlength="500" placeholder="Experiencia, enfoque de trabajo, certificaciones..."></textarea><div class="err"></div></div>` : "";
    root.innerHTML = `<div class="auth-card wide"><h1>Crear cuenta</h1>
      <div class="tabs"><button type="button" class="tab ${tipo === "user" ? "active" : ""}" data-t="user">Soy usuario</button><button type="button" class="tab ${tipo === "pro" ? "active" : ""}" data-t="pro">Soy profesional</button></div>
      <p class="muted" style="margin:0 0 18px">${tipo === "user" ? "Reserva sesiones con profesionales verificados y gestiona tus reservas." : "Publica tu perfil, recibe reservas y gestiona tu agenda."}</p>
      <form id="reg-form" novalidate><div class="form-grid">
        <div class="field full"><label for="r-name">Nombre completo</label><input id="r-name" autocomplete="name"><div class="err"></div></div>
        <div class="field"><label for="r-email">Correo electrónico</label><input id="r-email" type="email" autocomplete="email"><div class="err"></div></div>
        <div class="field"><label for="r-phone">Celular</label><input id="r-phone" inputmode="numeric" maxlength="9" placeholder="9XXXXXXXX" autocomplete="tel"><div class="err"></div></div>
        ${proFields}
        <div class="field"><label for="r-pass">Contraseña</label><input id="r-pass" type="password" autocomplete="new-password"><div class="err"></div></div>
        <div class="field"><label for="r-pass2">Repetir contraseña</label><input id="r-pass2" type="password" autocomplete="new-password"><div class="err"></div></div>
      </div>
      <label class="check-row"><input type="checkbox" id="r-terms"> <span>Acepto los términos y condiciones y la política de privacidad.</span></label>
      <div class="form-err" id="r-terms-err"></div>
      <div class="form-err" id="r-err"></div>
      <button class="btn-primary btn-coral btn-lg" type="submit" style="width:100%">Crear cuenta</button></form>
      <p class="auth-alt">¿Ya tienes cuenta? <a href="login.html${next ? "?next=" + next : ""}">Inicia sesión</a></p></div>`;
    Object.keys(vals).forEach((id) => { const el = document.getElementById(id); if (el) el.value = vals[id]; });
    $$(".tab").forEach((t) => t.addEventListener("click", () => {
      $$("#reg-form input:not([type=checkbox]), #reg-form select, #reg-form textarea").forEach((el) => { vals[el.id] = el.value; });
      tipo = t.dataset.t; paint();
    }));
    $("#r-phone").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, ""); });
    $("#reg-form").addEventListener("submit", submit);
  }

  async function submit(e) {
    e.preventDefault();
    const v = (id) => ($("#" + id).value || "").trim();
    const name = clean(v("r-name")), email = v("r-email").toLowerCase(), phone = v("r-phone");
    const pass = $("#r-pass").value, pass2 = $("#r-pass2").value;
    let ok = fieldErr("r-name", name.length < 3 ? "Ingresa tu nombre completo" : "");
    ok = fieldErr("r-email", EMAIL_RE.test(email) ? "" : "Ingresa un correo válido") && ok;
    ok = fieldErr("r-phone", /^9\d{8}$/.test(phone) ? "" : "Celular de 9 dígitos que empiece con 9") && ok;
    ok = fieldErr("r-pass", pass.length >= 8 && /[A-Za-z]/.test(pass) && /\d/.test(pass) ? "" : "Mínimo 8 caracteres, con letras y números") && ok;
    ok = fieldErr("r-pass2", pass === pass2 ? "" : "Las contraseñas no coinciden") && ok;
    let cat, zone, price, services, bio;
    if (tipo === "pro") {
      cat = v("r-cat"); zone = v("r-zone"); price = Number(v("r-price"));
      services = clean(v("r-services")).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 8);
      bio = clean(v("r-bio"));
      ok = fieldErr("r-price", price >= 20 && price <= 500 ? "" : "Ingresa una tarifa entre S/ 20 y S/ 500") && ok;
      ok = fieldErr("r-services", services.length ? "" : "Agrega al menos un servicio") && ok;
      ok = fieldErr("r-bio", bio.length >= 30 ? "" : "Cuéntanos un poco más (mínimo 30 caracteres)") && ok;
    }
    $("#r-terms-err").textContent = $("#r-terms").checked ? "" : "Debes aceptar los términos para continuar.";
    if (!$("#r-terms").checked) ok = false;
    if (!ok) return;
    const users = auth.users();
    if (users.some((u) => u.email === email)) { $("#r-err").textContent = "Ya existe una cuenta con ese correo. Inicia sesión."; return; }
    const user = { id: "u" + Date.now(), role: tipo, name, email, phone, passHash: await sha(pass), created: Date.now(), bio: "", goals: "", notes: "", img: "" };
    if (tipo === "pro") {
      const slug = norm(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      user.proId = slug + "-" + Math.random().toString(36).slice(2, 6);
      user.pro = { id: user.proId, name, cat, rating: 0, reviews: 0, price, zone, img: "", video: "", bio, services, owner: email };
    }
    users.push(user);
    if (!auth.saveUsers(users)) return;
    if (user.pro) syncPro(user.pro);
    auth.login(email);
    toast("¡Cuenta creada! Bienvenido/a a FastFit");
    location.href = next || (tipo === "pro" ? "panel.html" : "index.html");
  }
  paint();
}

/* ---------- MI PERFIL — USUARIO ---------- */
function initCuenta() {
  const cur = auth.current();
  if (!cur) { location.href = "login.html?next=cuenta.html"; return; }
  if (cur.role === "pro") { location.href = "panel.html"; return; }
  const root = $("#cuenta-root");
  let newPhoto = null;

  function paint() {
    const mine = bookings().filter((b) => b.userEmail === cur.email || b.email === cur.email).sort(sortBookings);
    root.innerHTML = `<h1 class="page-title">Mi perfil</h1><div class="account-grid">
      <section class="panel">
        <h2>Datos y biografía</h2>
        <div class="photo-row"><div id="u-avatar">${avatar({ name: cur.name, img: cur.img }, true)}</div>
          <div><label class="btn-primary btn-outline" style="cursor:pointer">Cambiar foto<input type="file" id="u-photo" accept="image/*" hidden></label><div class="muted" style="margin-top:6px">JPG o PNG</div></div></div>
        <div class="field" style="margin-bottom:14px"><label for="c-name">Nombre completo</label><input id="c-name" value="${cur.name}"><div class="err"></div></div>
        <div class="field" style="margin-bottom:14px"><label>Correo</label><input value="${cur.email}" disabled></div>
        <div class="field" style="margin-bottom:14px"><label for="c-phone">Celular</label><input id="c-phone" inputmode="numeric" maxlength="9" value="${cur.phone || ""}"><div class="err"></div></div>
        <div class="field" style="margin-bottom:14px"><label for="c-bio">Sobre mí</label><textarea id="c-bio" maxlength="400" placeholder="Cuéntales a tus profesionales un poco sobre ti...">${cur.bio || ""}</textarea></div>
        <div class="field" style="margin-bottom:14px"><label for="c-goals">Objetivos</label><textarea id="c-goals" maxlength="400" placeholder="Ej: bajar de peso, ganar fuerza, mejorar mi alimentación...">${cur.goals || ""}</textarea></div>
        <div class="field" style="margin-bottom:14px"><label for="c-notes">Indicaciones adicionales</label><textarea id="c-notes" maxlength="400" placeholder="Ej: lesiones, alergias, horarios preferidos...">${cur.notes || ""}</textarea></div>
        <button class="btn-primary btn-lg" id="c-save" style="width:100%">Guardar cambios</button>
        <button class="btn-primary btn-lg btn-outline" data-logout style="width:100%;margin-top:10px">Cerrar sesión</button>
      </section>
      <section class="panel"><h2>Mis reservas</h2>${mine.length ? mine.map((b) => bookingRow(b, "user")).join("") : '<p class="muted" style="margin:0">Aún no tienes reservas. <a href="buscar.html" style="color:var(--accent);font-weight:600">Explora profesionales</a></p>'}</section>
    </div>`;

    $("#u-photo").addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      fileToAvatar(f, (data) => { newPhoto = data; $("#u-avatar").innerHTML = avatar({ name: cur.name, img: data }, true); });
    });
    $("#c-save").addEventListener("click", () => {
      const name = clean($("#c-name").value), phone = $("#c-phone").value.trim();
      let ok = fieldErr("c-name", name.length < 3 ? "Ingresa tu nombre" : "");
      ok = fieldErr("c-phone", /^9\d{8}$/.test(phone) ? "" : "Celular de 9 dígitos que empiece con 9") && ok;
      if (!ok) return;
      const users = auth.users(); const u = users.find((x) => x.email === cur.email);
      u.name = name; u.phone = phone;
      u.bio = clean($("#c-bio").value); u.goals = clean($("#c-goals").value); u.notes = clean($("#c-notes").value);
      if (newPhoto) u.img = newPhoto;
      if (auth.saveUsers(users)) { toast("Datos actualizados"); cur.name = name; cur.phone = phone; cur.bio = u.bio; cur.goals = u.goals; cur.notes = u.notes; if (newPhoto) cur.img = newPhoto; newPhoto = null; paint(); renderHeader(); }
    });
    $$("[data-cancel]", root).forEach((btn) => btn.addEventListener("click", () => {
      if (!confirm("¿Cancelar esta reserva?")) return;
      const all = bookings(); const b = all.find((x) => x.code === btn.dataset.cancel);
      if (b) { b.status = "cancelada"; LS.set("fastfit_bookings", all); toast("Reserva cancelada"); paint(); }
    }));
  }
  paint();
}

/* ---------- MI PERFIL — PROFESIONAL ---------- */
function initPanel() {
  const cur = auth.current();
  if (!cur) { location.href = "login.html?next=panel.html"; return; }
  if (cur.role !== "pro") { location.href = "cuenta.html"; return; }
  const root = $("#panel-root");
  let newPhoto = null;

  function paint() {
    const pro = cur.pro;
    const mine = bookings().filter((b) => b.proId === cur.proId).sort(sortBookings);
    root.innerHTML = `<h1 class="page-title">Mi perfil profesional</h1><div class="account-grid">
      <section class="panel"><h2>Mi perfil público</h2>
        <div class="photo-row"><div id="p-avatar">${avatar(pro, true)}</div>
          <div><label class="btn-primary btn-outline" style="cursor:pointer">Cambiar foto<input type="file" id="p-photo" accept="image/*" hidden></label><div class="muted" style="margin-top:6px">JPG o PNG</div></div></div>
        <div class="field" style="margin-bottom:14px"><label for="p-cat">Especialidad</label><select id="p-cat">${CATEGORIES.map((c) => `<option value="${c.key}" ${c.key === pro.cat ? "selected" : ""}>${c.role}</option>`).join("")}</select></div>
        <div class="field" style="margin-bottom:14px"><label for="p-zone">Distrito principal</label><select id="p-zone">${DISTRICTS.map((d) => `<option ${d === pro.zone ? "selected" : ""}>${d}</option>`).join("")}</select></div>
        <div class="field" style="margin-bottom:14px"><label for="p-price">Tarifa por sesión (S/)</label><input id="p-price" type="number" min="20" max="500" step="5" value="${pro.price}"><div class="err"></div></div>
        <div class="field" style="margin-bottom:14px"><label for="p-services">Servicios (separados por coma)</label><input id="p-services" value="${pro.services.join(", ")}"><div class="err"></div></div>
        <div class="field" style="margin-bottom:14px"><label for="p-bio">Sobre mí</label><textarea id="p-bio" maxlength="500">${pro.bio}</textarea><div class="err"></div></div>
        <div class="field" style="margin-bottom:14px"><label for="p-video">Video (link de YouTube o de tu archivo)</label><input id="p-video" placeholder="https://youtu.be/..." value="${pro.video || ""}"><div class="err"></div></div>
        <button class="btn-primary btn-coral btn-lg" id="p-save" style="width:100%">Guardar perfil</button>
        <a class="btn-primary btn-lg btn-outline" href="perfil.html?id=${pro.id}" style="display:block;text-align:center;margin-top:10px">Ver mi perfil público</a>
        <button class="btn-primary btn-lg btn-outline" data-logout style="width:100%;margin-top:10px">Cerrar sesión</button></section>
      <section class="panel"><h2>Reservas recibidas</h2>${mine.length ? mine.map((b) => bookingRow(b, "pro")).join("") : '<p class="muted" style="margin:0">Todavía no tienes reservas. Cuando un cliente reserve contigo, aparecerá aquí.</p>'}</section>
    </div>`;

    $("#p-photo").addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      fileToAvatar(f, (data) => { newPhoto = data; $("#p-avatar").innerHTML = avatar({ ...pro, img: data }, true); });
    });
    $("#p-save").addEventListener("click", () => {
      const price = Number($("#p-price").value);
      const services = clean($("#p-services").value).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 8);
      const bio = clean($("#p-bio").value);
      const video = $("#p-video").value.trim();
      let ok = fieldErr("p-price", price >= 20 && price <= 500 ? "" : "Tarifa entre S/ 20 y S/ 500");
      ok = fieldErr("p-services", services.length ? "" : "Agrega al menos un servicio") && ok;
      ok = fieldErr("p-bio", bio.length >= 30 ? "" : "Mínimo 30 caracteres") && ok;
      ok = fieldErr("p-video", !video || /^(https?:\/\/|images\/)[^\s"'<>`]+$/.test(video) ? "" : "Usa un link que empiece con https:// o images/") && ok;
      if (!ok) return;
      const users = auth.users(); const u = users.find((x) => x.email === cur.email);
      Object.assign(u.pro, { cat: $("#p-cat").value, zone: $("#p-zone").value, price, services, bio, video });
      if (newPhoto) u.pro.img = newPhoto;
      if (auth.saveUsers(users)) { syncPro(u.pro); cur.pro = u.pro; newPhoto = null; toast("Perfil actualizado"); paint(); }
    });
  }
  paint();
}

/* ---------- Arranque: ejecuta la función de la página actual ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadCustomPros();
  renderHeader();
  renderFooter();
  const INITS = {
    home: initHome, buscar: initBuscar, perfil: initPerfil, horario: initHorario,
    checkout: initCheckout, confirmacion: initConfirmacion, login: initLogin,
    registro: initRegistro, cuenta: initCuenta, panel: initPanel,
  };
  const page = document.body.dataset.page;
  if (INITS[page]) INITS[page]();
});
