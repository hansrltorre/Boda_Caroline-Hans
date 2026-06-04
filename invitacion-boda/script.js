// =========================
// CONFIGURACIÓN
// =========================
const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbxftMlepYXqjQFjUSWUlqiuYBtixF1v-0-KejYGgtC_9FyxHmmTOdYsgf5FfZkY09s4rg/exec";

// =========================
// SANITIZE MEJORADO
// =========================
function sanitize(str) {
  return (str || '')
    .replace(/[<>]/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .trim();
}

// =========================
// ELEMENTOS
// =========================
const rsvpForm = document.getElementById('rsvpForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');
const rompehielosCheck = document.getElementById('rompehielosCheck');
const bodaCheck = document.getElementById('bodaCheck');
const icebreakerDiv = document.getElementById('icebreakerCheckbox');
const weddingDiv = document.getElementById('weddingCheckbox');

let isSubmitting = false;

// =========================
// CHECKBOX STYLE
// =========================
function updateCheckboxStyle() {
  icebreakerDiv.classList.toggle('checked', rompehielosCheck.checked);
  weddingDiv.classList.toggle('checked', bodaCheck.checked);
}

rompehielosCheck.addEventListener('change', updateCheckboxStyle);
bodaCheck.addEventListener('change', updateCheckboxStyle);
updateCheckboxStyle();

// =========================
// EVENTOS
// =========================
function getSelectedEvents() {
  const selected = [];
  if (rompehielosCheck.checked) selected.push("🍽️ Cena Rompehielos");
  if (bodaCheck.checked) selected.push("💒 Ceremonia y Recepción");
  return selected;
}

// =========================
// MENSAJES
// =========================
function showMessage(text, isError = false) {
  formStatus.style.display = 'block';
  formStatus.innerHTML = text.replace(/\n/g, '<br>');
  formStatus.style.background = isError ? '#f8e1de' : '#e2f0e6';
  formStatus.style.color = isError ? '#a1422f' : '#2a6b47';

  setTimeout(() => {
    formStatus.style.display = 'none';
  }, 6000);
}

// =========================
// GOOGLE SHEETS (VERSIÓN ESTABLE)
// =========================
const RSVP_BACKUP_KEY = 'wedding_rsvp_backup';

function saveRsvpBackup(data) {
  const backup = JSON.parse(localStorage.getItem(RSVP_BACKUP_KEY) || '[]');
  backup.push(data);
  localStorage.setItem(RSVP_BACKUP_KEY, JSON.stringify(backup));
}

async function saveToGoogleSheets(data) {
  try {
    const response = await fetch(GOOGLE_SHEETS_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(data)
    });

    if (response.type === 'opaque') {
      return true;
    }

    if (!response.ok) {
      console.error('Respuesta HTTP no OK:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// =========================
// SELECT ASISTENCIA
// =========================
document.getElementById('asistencia').addEventListener('change', (e) => {
  if (e.target.value === 'No podré asistir') {
    rompehielosCheck.checked = false;
    bodaCheck.checked = false;
    updateCheckboxStyle();
  }
});

// =========================
// SUBMIT
// =========================
rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;

  const asistencia = document.getElementById('asistencia').value;
  const selectedEvents = getSelectedEvents();

  // ✅ CORRECCIÓN IMPORTANTE
  if (asistencia === 'Sí asistiré' && selectedEvents.length === 0) {
    showMessage('❌ Selecciona al menos un evento.', true);
    isSubmitting = false;
    return;
  }

  const nombre = sanitize(document.getElementById('nombre').value);
  const email = sanitize(document.getElementById('email').value);
  const telefono = sanitize(document.getElementById('telefono').value);
  const alergias = sanitize(document.getElementById('alergias').value);

  if (!nombre || !email) {
    showMessage('❌ Completa nombre y correo.', true);
    isSubmitting = false;
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showMessage('❌ Correo inválido.', true);
    isSubmitting = false;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"></span> Guardando...';

  const reservationData = {
    fechaRegistro: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
    nombre,
    email,
    telefono: telefono || 'No proporcionado',
    asistencia,
    eventosSeleccionados: asistencia === 'Sí asistiré'
      ? selectedEvents.join(', ')
      : 'No asistirá',
    alergias: alergias || 'Ninguna',
    timestamp: new Date().toISOString()
  };

  try {
    const success = await saveToGoogleSheets(reservationData);

    if (success) {
      showMessage(`✅ ¡Gracias ${nombre}!\n\nTu reservación fue registrada correctamente.`);
      
      rsvpForm.reset();
      rompehielosCheck.checked = false;
      bodaCheck.checked = false;
      updateCheckboxStyle();

      console.log('✅ Enviado:', reservationData);

    } else {
      saveRsvpBackup(reservationData);
      showMessage('⚠️ No se pudo guardar en el servidor. Se creó un respaldo local.', true);
      console.log('💾 Respaldo local guardado:', reservationData);
    }

  } catch (error) {
    console.error(error);
    showMessage('⚠️ Error inesperado.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirmar reservación';
    isSubmitting = false;
  }
});
