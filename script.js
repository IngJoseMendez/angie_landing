/*
  ╔══════════════════════════════════════════════╗
  ║         CONFIGURACIÓN REQUERIDA              ║
  ╠══════════════════════════════════════════════╣
  ║ 1. WEBHOOK_N8N                               ║
  ║    → URL del webhook de tu flujo en n8n      ║
  ║    → Se obtiene en: n8n > Webhook node >     ║
  ║      "Production URL"                        ║
  ║                                              ║
  ║ 2. WHATSAPP_NUMBER                           ║
  ║    → Número con código de país sin + ni -    ║
  ║    → Ejemplo Colombia: 573001234567          ║
  ║      (57 + número sin el 0 inicial)          ║
  ╚══════════════════════════════════════════════╝
*/

// ============================================
// CONFIGURACIÓN — REEMPLAZAR ESTOS VALORES
// ============================================
const WEBHOOK_N8N = "https://n8n-production-efec.up.railway.app/webhook/landing";
const WHATSAPP_NUMBER = "3127059247";
// ============================================

document.addEventListener("DOMContentLoaded", function () {

  // --------------------------------------------------
  // 1. Bloquear fechas pasadas
  // --------------------------------------------------
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").setAttribute("min", hoy);

  // --------------------------------------------------
  // 2. Animaciones scroll-triggered (fade-up)
  // --------------------------------------------------
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".animate-fadeup").forEach((el) => observer.observe(el));

  // --------------------------------------------------
  // 3. Helpers de validación
  // --------------------------------------------------
  function setError(id, msg) {
    const input = document.getElementById(id);
    input.classList.add("input-error");
    input.classList.remove("input-ok");
    // Mostrar o actualizar mensaje de error
    let errEl = input.parentElement.querySelector(".field-error");
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "field-error";
      input.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
  }

  function clearError(id) {
    const input = document.getElementById(id);
    input.classList.remove("input-error");
    input.classList.add("input-ok");
    const errEl = input.parentElement.querySelector(".field-error");
    if (errEl) errEl.textContent = "";
  }

  function validateAll() {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const terapia = document.getElementById("terapia").value;
    const fecha = document.getElementById("fecha").value;
    let valid = true;

    // Nombre
    if (!nombre) {
      setError("nombre", "Por favor ingresa tu nombre completo.");
      valid = false;
    } else {
      clearError("nombre");
    }

    // Teléfono — mínimo 7 dígitos
    if (!telefono || !/^\+?\d{7,15}$/.test(telefono.replace(/\s/g, ""))) {
      setError("telefono", "Ingresa un número de WhatsApp válido (ej. 3001234567).");
      valid = false;
    } else {
      clearError("telefono");
    }

    // Terapia
    if (!terapia) {
      setError("terapia", "Selecciona la terapia de tu interés.");
      valid = false;
    } else {
      clearError("terapia");
    }

    // Fecha
    if (!fecha) {
      setError("fecha", "Selecciona la fecha en que deseas tu cita.");
      valid = false;
    } else if (fecha < hoy) {
      setError("fecha", "La fecha no puede ser anterior a hoy.");
      valid = false;
    } else {
      clearError("fecha");
    }

    return valid;
  }

  // Limpiar error en tiempo real al escribir / cambiar
  ["nombre", "telefono", "terapia", "fecha"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => validateField(id));
    el.addEventListener("change", () => validateField(id));
  });

  function validateField(id) {
    const hoyStr = new Date().toISOString().split("T")[0];
    const val = document.getElementById(id).value.trim();
    if (id === "nombre" && val) clearError("nombre");
    if (id === "telefono" && /^\+?\d{7,15}$/.test(val.replace(/\s/g, ""))) clearError("telefono");
    if (id === "terapia" && val) clearError("terapia");
    if (id === "fecha" && val >= hoyStr) clearError("fecha");
  }

  // --------------------------------------------------
  // 4. Submit del formulario
  // --------------------------------------------------
  document.getElementById("agendamiento-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Validar todos los campos obligatorios
      if (!validateAll()) {
        // Scroll al primer error
        const firstErr = document.querySelector(".input-error");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const btn = document.getElementById("btn-agendar");
      btn.disabled = true;
      btn.textContent = "Enviando…";

      const nombre = document.getElementById("nombre").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const terapia = document.getElementById("terapia").value;
      const fecha = document.getElementById("fecha").value;
      const mensaje = document.getElementById("mensaje").value.trim();

      const payload = {
        nombre, telefono, terapia, fecha, mensaje,
        origen: "landing",
        timestamp: new Date().toISOString()
      };

      // 4a. Enviar a n8n (no bloquea si falla)
      try {
        await fetch(WEBHOOK_N8N, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Webhook n8n no disponible:", err);
      }

      // 4b. Redirigir a WhatsApp con mensaje pre-llenado
      const fechaFormateada = new Date(fecha + "T12:00:00")
        .toLocaleDateString("es-CO", {
          weekday: "long", year: "numeric",
          month: "long", day: "numeric"
        });

      const textoWA = encodeURIComponent(
        `Hola Angie 👋 Mi nombre es *${nombre}*.\n` +
        `Me interesa una sesión de *${terapia}* ` +
        `para el *${fechaFormateada}*.\n` +
        (mensaje ? `\n\nNota: ${mensaje}` : "")
      );

      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${textoWA}`;
    });

});
