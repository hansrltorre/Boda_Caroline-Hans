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
  const selected = [];
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
const RSVP_BACKUP_KEY = 'wedding_rsvp_backup';

function saveRsvpBackup(data) {
  const backup = JSON.parse(localStorage.getItem(RSVP_BACKUP_KEY) || '[]');
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
const asistenciaSelect = document.getElementById('asistencia');
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

const asistencia = document.getElementById('asistencia').value;
  const selectedEvents = getSelectedEvents();

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

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Guardando...';
  }

  const reservationData = {
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
        // Al enviar con éxito, regresar al menú inicial (hero)
        try {
          if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) { /* no bloquear en caso de error */ }
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

// Botón para volver al inicio desde la sección RSVP
const rsvpBackBtn = document.getElementById('rsvpBackBtn');
if (rsvpBackBtn) {
  rsvpBackBtn.addEventListener('click', function () {
    try {
      if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { console.log(e); }
  });
}

// =========================
// ANIMACIONES DE SCROLL
// =========================
// IntersectionObserver se encarga de animar los elementos .wp1..wp12
(function () {
  if (typeof window.IntersectionObserver === 'undefined') return;

  const animated = new WeakSet();

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const animMap = {
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

  function observeAnimatedEntries(entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (animated.has(el)) {
        obs.unobserve(el);
        return;
      }
      // find which wp class it has
      Object.keys(animMap).some(function (k) {
        if (el.classList.contains(k)) {
          el.classList.add('animated', animMap[k]);
          animated.add(el);
          obs.unobserve(el);
          return true;
        }
        return false;
      });
    });
  }

  const io = new IntersectionObserver(observeAnimatedEntries, observerOptions);

    function initObserverFallback() {
      const all = document.querySelectorAll('.wp1, .wp2, .wp3, .wp4, .wp5, .wp6, .wp7, .wp8, .wp9, .wp10, .wp11, .wp12');
      for (const el of all) {
      if (!animated.has(el)) io.observe(el);
    }
  }

  // Run once and also on resize (in case layout changes)
  initObserverFallback();
  window.addEventListener('resize', function () {
    setTimeout(initObserverFallback, 250);
  });
})();

// =========================
// MÚSICA - REPRODUCCIÓN AUTOMÁTICA GARANTIZADA
// =========================
const music = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const musicIcon = document.getElementById('musicIcon');
let musicStarted = false;

function forceAutoPlay() {
  if (!music) return;

  try { music.muted = true; } catch (e) {}
  const attempt = music.play();
  if (attempt !== undefined) {
    attempt.then(() => {
      musicStarted = true;
      musicIcon.innerHTML = '⏸';
      musicToggle.setAttribute('aria-label', 'Pausar música');
      const unmuteOnGesture = function () {
        try { music.muted = false; } catch (e) {}
        document.removeEventListener('click', unmuteOnGesture);
        document.removeEventListener('touchstart', unmuteOnGesture);
      };
      document.addEventListener('click', unmuteOnGesture, { once: true });
      document.addEventListener('touchstart', unmuteOnGesture, { once: true });
      console.log('🎵 Música iniciada (muted start)');
    }).catch((error) => {
      console.log('Autoreproducción bloqueada:', error);
      musicIcon.innerHTML = '▶';
      musicToggle.setAttribute('aria-label', 'Reproducir música');

      const startMusic = function() {
        music.play().then(() => {
          musicStarted = true;
          musicIcon.innerHTML = '⏸';
          musicToggle.setAttribute('aria-label', 'Pausar música');
        }).catch(e => console.log('Error al reproducir', e));
        document.removeEventListener('click', startMusic);
        document.removeEventListener('touchstart', startMusic);
      };

      document.addEventListener('click', startMusic);
      document.addEventListener('touchstart', startMusic);
    });
  }
}

forceAutoPlay();

if (musicToggle && music) {
  musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (music.paused) {
      music.play().then(() => {
        musicStarted = true;
        musicIcon.innerHTML = '⏸';
        musicToggle.setAttribute('aria-label', 'Pausar música');
      }).catch(err => console.log('Error:', err));
    } else {
      music.pause();
      musicIcon.innerHTML = '▶';
      musicToggle.setAttribute('aria-label', 'Reproducir música');
    }
  });
}

if (music) {
  music.addEventListener('play', () => {
    musicIcon.innerHTML = '⏸';
    musicToggle.setAttribute('aria-label', 'Pausar música');
  });
  music.addEventListener('pause', () => {
    musicIcon.innerHTML = '▶';
    musicToggle.setAttribute('aria-label', 'Reproducir música');
  });
}

// =========================
// MOVIMIENTO EN EL EXPLORADOR
// =========================
const heroSection = document.querySelector('.hero');
const heroOverlay = document.querySelector('.hero .overlay');
const heroImage = document.querySelector('.hero img');
let motionFrame = null;
let pointerX = 0;
let pointerY = 0;

function updateHeroMotion() {
  if (!heroSection || !heroOverlay || !heroImage) return;
  const rect = heroSection.getBoundingClientRect();
  const offsetX = ((pointerX - rect.left) / rect.width - 0.5) * 18;
  const offsetY = ((pointerY - rect.top) / rect.height - 0.5) * 18;

  heroOverlay.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  heroImage.style.transform = `translate3d(${offsetX * 0.4}px, ${offsetY * 0.4}px, 0) rotate(${offsetX * 0.08}deg)`;
  motionFrame = null;
}

if (heroSection && heroOverlay && heroImage) {
  heroSection.addEventListener('mousemove', (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (!motionFrame) motionFrame = requestAnimationFrame(updateHeroMotion);
  });
  heroSection.addEventListener('mouseleave', () => {
    if (heroOverlay) heroOverlay.style.transform = '';
    if (heroImage) heroImage.style.transform = '';
  });
}

// =========================
// MODAL AGENDA
// =========================
const openAgendaBtn = document.getElementById('openAgendaModalBtn');
const agendaModal = document.getElementById('agendaModal');
const closeAgendaBtn = document.getElementById('closeAgendaModal');

if (openAgendaBtn && agendaModal && closeAgendaBtn) {
  openAgendaBtn.addEventListener('click', (e) => {
    e.preventDefault();
    agendaModal.style.display = 'flex';
  });

  closeAgendaBtn.addEventListener('click', () => {
    agendaModal.style.display = 'none';
  });

  agendaModal.addEventListener('click', (e) => {
    if (e.target === agendaModal) agendaModal.style.display = 'none';
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && agendaModal.style.display === 'flex') {
      agendaModal.style.display = 'none';
    }
  });
}

// =========================
// COUNTDOWN
// =========================
const weddingDate = new Date("Nov 27, 2026 00:00:00").getTime();
const timer = setInterval(() => {
  const now = new Date().getTime();
  const distance = weddingDate - now;
  
  if (distance < 0) {
    clearInterval(timer);
    const countdownDiv = document.querySelector(".countdown");
    if (countdownDiv) countdownDiv.innerHTML = "<h2>¡Llegó el gran día!</h2>";
    return;
  }
  
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  document.getElementById("days").innerHTML = days.toString().padStart(2, '0');
  document.getElementById("hours").innerHTML = hours.toString().padStart(2, '0');
  document.getElementById("minutes").innerHTML = minutes.toString().padStart(2, '0');
  document.getElementById("seconds").innerHTML = seconds.toString().padStart(2, '0');
}, 1000);
