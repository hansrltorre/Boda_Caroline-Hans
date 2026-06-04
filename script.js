// =========================
// CONFIGURACIÓN
// =========================
var GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbxftMlepYXqjQFjUSWUlqiuYBtixF1v-0-KejYGgtC_9FyxHmmTOdYsgf5FfZkY09s4rg/exec";

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
var rsvpForm = document.getElementById('rsvpForm');
var formStatus = document.getElementById('formStatus');
var submitBtn = document.getElementById('submitBtn');
var rompehielosCheck = document.getElementById('rompehielosCheck');
var bodaCheck = document.getElementById('bodaCheck');
var icebreakerDiv = document.getElementById('icebreakerCheckbox');
var weddingDiv = document.getElementById('weddingCheckbox');

var isSubmitting = false;

// =========================
// CHECKBOX STYLE
// =========================
function updateCheckboxStyle() {
  if (!icebreakerDiv || !weddingDiv || !rompehielosCheck || !bodaCheck) return;
  if (rompehielosCheck.checked) {
    icebreakerDiv.classList.add('checked');
  } else {
    icebreakerDiv.classList.remove('checked');
  }
  if (bodaCheck.checked) {
    weddingDiv.classList.add('checked');
  } else {
    weddingDiv.classList.remove('checked');
  }
}

if (rompehielosCheck && bodaCheck) {
  rompehielosCheck.addEventListener('change', updateCheckboxStyle);
  bodaCheck.addEventListener('change', updateCheckboxStyle);
  updateCheckboxStyle();
}

// =========================
// EVENTOS
// =========================
function getSelectedEvents() {
  var selected = [];
  if (rompehielosCheck && rompehielosCheck.checked) selected.push('🍽️ Cena Rompehielos');
  if (bodaCheck && bodaCheck.checked) selected.push('💒 Ceremonia y Recepción');
  return selected;
}

// =========================
// MENSAJES
// =========================
function showMessage(text, isError) {
  if (!formStatus) return;

  formStatus.style.display = 'block';
  formStatus.innerHTML = text.replace(/\n/g, '<br>');
  formStatus.style.background = isError ? '#f8e1de' : '#e2f0e6';
  formStatus.style.color = isError ? '#a1422f' : '#2a6b47';

  setTimeout(function () {
    formStatus.style.display = 'none';
  }, 6000);
}

// =========================
// GOOGLE SHEETS (VERSIÓN ESTABLE)
// =========================
var RSVP_BACKUP_KEY = 'wedding_rsvp_backup';

function saveRsvpBackup(data) {
  var backup = JSON.parse(localStorage.getItem(RSVP_BACKUP_KEY) || '[]');
  backup.push(data);
  localStorage.setItem(RSVP_BACKUP_KEY, JSON.stringify(backup));
}

function saveToGoogleSheets(data) {
  return fetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(data)
  }).then(function (response) {
    if (response.type === 'opaque') {
      return true;
    }
    if (!response.ok) {
      console.error('Respuesta HTTP no OK:', response.status);
      return false;
    }
    return true;
  }).catch(function (error) {
    console.error('Error:', error);
    return false;
  });
}

// =========================
// SELECT ASISTENCIA
// =========================
var asistenciaSelect = document.getElementById('asistencia');
if (asistenciaSelect) {
  asistenciaSelect.addEventListener('change', function (e) {
    if (e.target.value === 'No podré asistir') {
      if (rompehielosCheck) rompehielosCheck.checked = false;
      if (bodaCheck) bodaCheck.checked = false;
      updateCheckboxStyle();
    }
  });
}

// =========================
// SUBMIT
// =========================
if (rsvpForm) {
  rsvpForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    var asistencia = document.getElementById('asistencia').value;
    var selectedEvents = getSelectedEvents();

    if (asistencia === 'Sí asistiré' && selectedEvents.length === 0) {
      showMessage('❌ Selecciona al menos un evento.', true);
      isSubmitting = false;
      return;
    }

    var nombre = sanitize(document.getElementById('nombre').value);
    var email = sanitize(document.getElementById('email').value);
    var telefono = sanitize(document.getElementById('telefono').value);
    var alergias = sanitize(document.getElementById('alergias').value);

    if (!nombre || !email) {
      showMessage('❌ Completa nombre y correo.', true);
      isSubmitting = false;
      return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showMessage('❌ Correo inválido.', true);
      isSubmitting = false;
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loader"></span> Guardando...';
    }

    var reservationData = {
      fechaRegistro: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
      nombre: nombre,
      email: email,
      telefono: telefono || 'No proporcionado',
      asistencia: asistencia,
      eventosSeleccionados: asistencia === 'Sí asistiré' ? selectedEvents.join(', ') : 'No asistirá',
      alergias: alergias || 'Ninguna',
      timestamp: new Date().toISOString()
    };

    saveToGoogleSheets(reservationData).then(function (success) {
      if (success) {
        showMessage('✅ ¡Gracias ' + nombre + '!\n\nTu reservación fue registrada correctamente.');
        rsvpForm.reset();
        if (rompehielosCheck) rompehielosCheck.checked = false;
        if (bodaCheck) bodaCheck.checked = false;
        updateCheckboxStyle();
        console.log('✅ Enviado:', reservationData);
      } else {
        saveRsvpBackup(reservationData);
        showMessage('⚠️ No se pudo guardar en el servidor. Se creó un respaldo local.', true);
        console.log('💾 Respaldo local guardado:', reservationData);
      }
    }).catch(function (error) {
      console.error(error);
      showMessage('⚠️ Error inesperado.', true);
    }).then(function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirmar reservación';
      }
      isSubmitting = false;
    });
  });
}

// =========================
// ANIMACIONES CON WAYPOINTS
// =========================
$(document).ready(function () {
  var waypointMap = [
    { sel: '.wp1', anim: 'fadeInLeft' },
    { sel: '.wp2', anim: 'fadeInUp' },
    { sel: '.wp3', anim: 'fadeInRight' },
    { sel: '.wp4', anim: 'fadeInUp' },
    { sel: '.wp5', anim: 'fadeInLeft' },
    { sel: '.wp6', anim: 'fadeInUp' },
    { sel: '.wp7', anim: 'fadeInRight' },
    { sel: '.wp8', anim: 'fadeInUp' },
    { sel: '.wp9', anim: 'fadeInLeft' },
    { sel: '.wp10', anim: 'fadeInUp' },
    { sel: '.wp11', anim: 'fadeInRight' },
    { sel: '.wp12', anim: 'fadeInUp' }
  ];

  function bindWaypoints() {
    var wpOffset = $(window).width() <= 700 ? '90%' : '75%';
    waypointMap.forEach(function (item) {
      $(item.sel).waypoint(function () {
        try {
          $(this.element).addClass('animated ' + item.anim);
        } catch (e) {
          console.warn('Waypoint callback error for', item.sel, e);
        }
      }, { offset: wpOffset, triggerOnce: true });
    });
  }

  function destroyWaypoints() {
    waypointMap.forEach(function (item) {
      try {
        $(item.sel).waypoint('destroy');
      } catch (e) {
        // ignore if none exist
      }
    });
  }

  function initWaypoints() {
    destroyWaypoints();
    bindWaypoints();
  }

  initWaypoints();

  var resizeTimer = null;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      initWaypoints();
      console.log('Waypoints re-initialized after resize.');
    }, 200);
  });
});
