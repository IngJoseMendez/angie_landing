const WEBHOOK_N8N     = "https://n8n-production-efec.up.railway.app/webhook/landing";
const WHATSAPP_NUMBER = "3127071743";

document.addEventListener("DOMContentLoaded", function () {

  // Block past dates
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").setAttribute("min", hoy);

  // ── Validation helpers ──
  function setError(id, msg) {
    const el = document.getElementById(id);
    el.classList.add("input-error");
    el.classList.remove("input-ok");
    let errEl = (el.closest(".select-wrap") || el.parentElement).querySelector(".field-error");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "field-error";
      errEl.setAttribute("role", "alert");
      (el.closest(".select-wrap") || el.parentElement).appendChild(errEl);
    }
    errEl.textContent = msg;
  }

  function clearError(id) {
    const el = document.getElementById(id);
    el.classList.remove("input-error");
    el.classList.add("input-ok");
    const errEl = (el.closest(".select-wrap") || el.parentElement).querySelector(".field-error");
    if (errEl) errEl.textContent = "";
  }

  function validateAll() {
    const nombre   = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const terapia  = document.getElementById("terapia").value;
    const fecha    = document.getElementById("fecha").value;
    let ok = true;

    if (nombre.length < 2) { setError("nombre", "Ingresa tu nombre completo."); ok = false; }
    else clearError("nombre");

    if (!/^\+?\d{7,15}$/.test(telefono.replace(/\s/g, ""))) {
      setError("telefono", "Número válido, ej. 3001234567."); ok = false;
    } else clearError("telefono");

    if (!terapia) { setError("terapia", "Selecciona una terapia."); ok = false; }
    else clearError("terapia");

    if (!fecha) { setError("fecha", "Selecciona una fecha."); ok = false; }
    else if (fecha < hoy) { setError("fecha", "La fecha no puede ser anterior a hoy."); ok = false; }
    else clearError("fecha");

    return ok;
  }

  // Clear errors on blur
  ["nombre", "telefono", "terapia", "fecha"].forEach((id) => {
    const el = document.getElementById(id);
    const revalidate = () => {
      if (el.classList.contains("input-error")) validateField(id);
    };
    el.addEventListener("blur", () => validateField(id));
    el.addEventListener("input", revalidate);
    el.addEventListener("change", revalidate);
  });

  function validateField(id) {
    const val   = document.getElementById(id).value.trim();
    const today = new Date().toISOString().split("T")[0];
    if (id === "nombre"   && val.length >= 2) clearError("nombre");
    if (id === "telefono" && /^\+?\d{7,15}$/.test(val.replace(/\s/g, ""))) clearError("telefono");
    if (id === "terapia"  && val) clearError("terapia");
    if (id === "fecha"    && val >= today) clearError("fecha");
  }

  // ── Submit ──
  document.getElementById("agendamiento-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!validateAll()) {
        const first = document.querySelector(".input-error");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const btn  = document.getElementById("btn-agendar");
      const orig = btn.innerHTML;
      btn.disabled  = true;
      btn.innerHTML = "Enviando…";

      const nombre   = document.getElementById("nombre").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const terapia  = document.getElementById("terapia").value;
      const fecha    = document.getElementById("fecha").value;
      const mensaje  = document.getElementById("mensaje").value.trim();

      try {
        await fetch(WEBHOOK_N8N, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, telefono, terapia, fecha, mensaje, origen: "landing", timestamp: new Date().toISOString() })
        });
      } catch (err) {
        console.warn("Webhook no disponible:", err);
      }

      const fechaFormateada = new Date(fecha + "T12:00:00")
        .toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const textoWA = encodeURIComponent(
        `Hola Angie 👋 Mi nombre es *${nombre}*.\n` +
        `Me interesa una sesión de *${terapia}* para el *${fechaFormateada}*.\n` +
        (mensaje ? `\n\nNota: ${mensaje}` : "")
      );

      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${textoWA}`;

      setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; }, 4000);
    });
});
