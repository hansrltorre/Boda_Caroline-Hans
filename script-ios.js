// =========================
// iOS-specific invitation script
// =========================
var GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbxftMlepYXqjQFjUSWUlqiuYBtixF1v-0-KejYGgtC_9FyxHmmTOdYsgf5FfZkY09s4rg/exec";

function sanitize(str) {
  return (str || '')
    .replace(/[<>]/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .trim();
}

var rsvpForm = document.getElementById('rsvpForm');
var formStatus = document.getElementById('formStatus');
var submitBtn = document.getElementById('submitBtn');
var rompehielosCheck = document.getElementById('rompehielosCheck');
var bodaCheck = document.getElementById('bodaCheck');
var icebreakerDiv = document.getElementById('icebreakerCheckbox');
var weddingDiv = document.getElementById('weddingCheckbox');
var isSubmitting = false;

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

function getSelectedEvents() {
  var selected = [];
  if (rompehielosCheck && rompehielosCheck.checked) selected.push('🍽️ Cena Rompehielos');
  if (bodaCheck && bodaCheck.checked) selected.push('💒 Ceremonia y Recepción');
  return selected;
}

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

if (rsvpForm) {
  rsvpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    var asistencia = asistenciaSelect ? asistenciaSelect.value : 'Sí asistiré';
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

function startIOSAnimations() {
  var animMap = {
    'wp1': 'fadeInLeft',
    'wp2': 'fadeInUp',
    'wp3': 'fadeInRight',
    'wp4': 'fadeInUp',
    'wp5': 'fadeInLeft',
    'wp6': 'fadeInUp',
    'wp7': 'fadeInRight',
    'wp8': 'fadeInUp',
    'wp9': 'fadeInLeft',
    'wp10': 'fadeInUp',
    'wp11': 'fadeInRight',
    'wp12': 'fadeInUp'
  };

  function animateElement(el) {
    Object.keys(animMap).some(function (k) {
      if (el.classList.contains(k)) {
        el.classList.add('animated', animMap[k]);
        return true;
      }
      return false;
    });
  }

  function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
  }

  function setupAnimationObservers(items) {
    var animated = new WeakSet();

    function markVisibleItems() {
      for (var i = 0; i < items.length; i++) {
        if (animated.has(items[i])) continue;
        if (isElementInViewport(items[i])) {
          animateElement(items[i]);
          animated.add(items[i]);
        }
      }
    }

    if (typeof window.IntersectionObserver !== 'undefined') {
      var options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
      };

      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateElement(entry.target);
          animated.add(entry.target);
          obs.unobserve(entry.target);
        });
      }, options);

      for (var i = 0; i < items.length; i++) {
        observer.observe(items[i]);
      }

      window.addEventListener('scroll', markVisibleItems);
      window.addEventListener('resize', markVisibleItems);
      setTimeout(markVisibleItems, 200);
    } else {
      markVisibleItems();
      window.addEventListener('scroll', markVisibleItems);
      window.addEventListener('resize', markVisibleItems);
    }
  }

  var items = document.querySelectorAll('.wp1, .wp2, .wp3, .wp4, .wp5, .wp6, .wp7, .wp8, .wp9, .wp10, .wp11, .wp12');
  if (items.length > 0) {
    setupAnimationObservers(items);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startIOSAnimations();
} else {
  document.addEventListener('DOMContentLoaded', startIOSAnimations);
}
