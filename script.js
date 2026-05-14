/*
  ╔══════════════════════════════════════════════╗
  ║         CONFIGURACIÓN REQUERIDA              ║
  ╠══════════════════════════════════════════════╣
  ║ WEBHOOK_N8N    → URL del webhook de n8n      ║
  ║ WHATSAPP_NUMBER → Número con código de país  ║
  ║   Ejemplo Colombia: 573001234567             ║
  ╚══════════════════════════════════════════════╝
*/
const WEBHOOK_N8N      = "https://n8n-production-efec.up.railway.app/webhook/landing";
const WHATSAPP_NUMBER  = "3127071743";

document.addEventListener("DOMContentLoaded", function () {

  // ── 1. Bloquear fechas pasadas ──
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").setAttribute("min", hoy);

  // ── 2. Sticky nav ──
  const nav = document.getElementById("topNav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });

  // ── 3. Nav CTA → scroll a formulario ──
  function scrollToForm() {
    const formCard = document.getElementById("formCol");
    formCard.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => document.getElementById("nombre").focus(), 600);
  }
  document.getElementById("navCtaBtn").addEventListener("click", scrollToForm);

  // CTA final también scrollea al form
  const ctaFinal = document.getElementById("ctaFinalBtn");
  if (ctaFinal) {
    ctaFinal.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToForm();
    });
  }

  // ── 4. Scroll animations (fade-up) ──
  const fadeObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        fadeObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.10, rootMargin: "0px 0px -30px 0px" }
  );
  document.querySelectorAll(".animate-fadeup").forEach((el) => fadeObserver.observe(el));

  // ── 5. Animated counter for hero stats ──
  function animateCounter(el, target, duration = 1200) {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        const target = parseInt(e.target.dataset.target, 10);
        if (!isNaN(target)) animateCounter(e.target, target);
        counterObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.5 }
  );
  document.querySelectorAll(".stat-number[data-target]")
    .forEach((el) => counterObserver.observe(el));

  // ── 6. Validation helpers ──
  function setError(id, msg) {
    const input = document.getElementById(id);
    input.classList.add("input-error");
    input.classList.remove("input-ok");
    let errEl = input.parentElement.querySelector(".field-error");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "field-error";
      input.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.setAttribute("role", "alert");
  }

  function clearError(id) {
    const input = document.getElementById(id);
    input.classList.remove("input-error");
    input.classList.add("input-ok");
    const errEl = input.parentElement.querySelector(".field-error");
    if (errEl) errEl.textContent = "";
  }

  function validateAll() {
    const nombre   = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const terapia  = document.getElementById("terapia").value;
    const fecha    = document.getElementById("fecha").value;
    let valid = true;

    if (!nombre || nombre.length < 2) {
      setError("nombre", "Por favor ingresa tu nombre completo.");
      valid = false;
    } else { clearError("nombre"); }

    if (!telefono || !/^\+?\d{7,15}$/.test(telefono.replace(/\s/g, ""))) {
      setError("telefono", "Número de WhatsApp válido (ej. 3001234567).");
      valid = false;
    } else { clearError("telefono"); }

    if (!terapia) {
      setError("terapia", "Selecciona la terapia de tu interés.");
      valid = false;
    } else { clearError("terapia"); }

    if (!fecha) {
      setError("fecha", "Selecciona la fecha en que deseas tu cita.");
      valid = false;
    } else if (fecha < hoy) {
      setError("fecha", "La fecha no puede ser anterior a hoy.");
      valid = false;
    } else { clearError("fecha"); }

    return valid;
  }

  // Validar en blur (no en cada tecla)
  ["nombre", "telefono", "terapia", "fecha"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("blur",   () => validateFieldOnBlur(id));
    el.addEventListener("change", () => validateFieldOnBlur(id));
    el.addEventListener("input",  () => {
      if (el.classList.contains("input-error")) validateFieldOnBlur(id);
    });
  });

  function validateFieldOnBlur(id) {
    const hoyStr = new Date().toISOString().split("T")[0];
    const val    = document.getElementById(id).value.trim();
    if (id === "nombre"   && val.length >= 2) clearError("nombre");
    if (id === "telefono" && /^\+?\d{7,15}$/.test(val.replace(/\s/g, ""))) clearError("telefono");
    if (id === "terapia"  && val) clearError("terapia");
    if (id === "fecha"    && val >= hoyStr)  clearError("fecha");
  }

  // ── 7. Form submit ──
  document.getElementById("agendamiento-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!validateAll()) {
        const firstErr = document.querySelector(".input-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const btn      = document.getElementById("btn-agendar");
      const origHTML = btn.innerHTML;
      btn.disabled   = true;
      btn.innerHTML  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin .7s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Enviando…`;

      const nombre   = document.getElementById("nombre").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const terapia  = document.getElementById("terapia").value;
      const fecha    = document.getElementById("fecha").value;
      const mensaje  = document.getElementById("mensaje").value.trim();

      const payload = { nombre, telefono, terapia, fecha, mensaje, origen: "landing", timestamp: new Date().toISOString() };

      try {
        await fetch(WEBHOOK_N8N, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Webhook n8n no disponible:", err);
      }

      const fechaFormateada = new Date(fecha + "T12:00:00")
        .toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const textoWA = encodeURIComponent(
        `Hola Angie 👋 Mi nombre es *${nombre}*.\n` +
        `Me interesa una sesión de *${terapia}* para el *${fechaFormateada}*.\n` +
        (mensaje ? `\n\nNota: ${mensaje}` : "")
      );

      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${textoWA}`;

      // Restore button in case navigation is blocked
      setTimeout(() => {
        btn.disabled  = false;
        btn.innerHTML = origHTML;
      }, 4000);
    });

});
