/* ==========================================================================
   Evolutiva Norte — interacciones
   Sin dependencias. Cada bloque es independiente del resto.
   ========================================================================== */

const CONFIG = {
  // Número de WhatsApp en formato internacional, solo dígitos.
  whatsapp: '5493816487967',

  // Opcional: URL que recibe la solicitud de turno por POST (JSON).
  // Sirve con Formspree, un webhook o una API propia. Si queda vacío,
  // la solicitud se envía únicamente por WhatsApp.
  formEndpoint: '',
};

const PROYECTOS = {
  casa: 'Construcción de casa',
  presupuesto: 'Presupuesto de obra',
  arreglos: 'Arreglos o refacciones',
  otro: 'Mantenimiento u otro trabajo',
};

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initSelector();
  initAtajosDeProyecto();
  initFormulario();
  initReveal();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------- Encabezado y menú móvil ---------- */
function initHeader() {
  const header = document.getElementById('header');
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');

  const cerrar = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  };

  toggle.addEventListener('click', () => {
    const abierto = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(abierto));
    toggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) cerrar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      cerrar();
      toggle.focus();
    }
  });

  const alScrollear = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  alScrollear();
  window.addEventListener('scroll', alScrollear, { passive: true });
}

/* ---------- Selector de necesidad (pestañas accesibles) ---------- */
function initSelector() {
  const tabs = Array.from(document.querySelectorAll('.selector__tab'));
  if (!tabs.length) return;

  const activar = (tab, enfocar = false) => {
    tabs.forEach((t) => {
      const activa = t === tab;
      t.classList.toggle('is-active', activa);
      t.setAttribute('aria-selected', String(activa));
      t.tabIndex = activa ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !activa;
    });
    if (enfocar) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activar(tab));
    tab.addEventListener('keydown', (e) => {
      const mov = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      let destino = null;
      if (mov) destino = tabs[(i + mov + tabs.length) % tabs.length];
      if (e.key === 'Home') destino = tabs[0];
      if (e.key === 'End') destino = tabs[tabs.length - 1];
      if (destino) {
        e.preventDefault();
        activar(destino, true);
      }
    });
  });
}

/* ---------- Enlaces que preseleccionan el tipo de proyecto ---------- */
function initAtajosDeProyecto() {
  const select = document.getElementById('proyecto');
  document.querySelectorAll('[data-proyecto]').forEach((link) => {
    link.addEventListener('click', () => {
      select.value = link.dataset.proyecto;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

/* ---------- Formulario de turnos ---------- */
function initFormulario() {
  const form = document.getElementById('form-turno');
  const exito = document.getElementById('form-success');
  if (!form) return;

  // Cada regla devuelve un mensaje de error, o '' si el dato es válido.
  const reglas = {
    nombre: (v) => (v.trim().length >= 3 ? '' : 'Ingresá tu nombre y apellido.'),
    telefono: (v) => {
      const digitos = v.replace(/\D/g, '');
      if (!digitos) return 'Ingresá un teléfono para poder contactarte.';
      if (/[^\d\s()+-]/.test(v)) return 'Usá solo números, espacios o guiones.';
      return digitos.length >= 8 && digitos.length <= 15
        ? ''
        : 'Revisá el número: incluí la característica (ej.: 381 555 1234).';
    },
    proyecto: (v) => (v ? '' : 'Elegí el tipo de proyecto.'),
    modalidad: (v) => (v ? '' : 'Elegí cómo preferís reunirte.'),
    franja: (v) => (v ? '' : 'Elegí una franja horaria.'),
  };

  const valorDe = (nombre) => new FormData(form).get(nombre) || '';

  const validar = (nombre) => {
    const control = form.elements[nombre];
    const primero = control instanceof RadioNodeList ? control[0] : control;
    const campo = primero.closest('.field');
    const mensaje = reglas[nombre](valorDe(nombre));

    campo.classList.toggle('is-invalid', Boolean(mensaje));
    campo.classList.toggle('is-valid', !mensaje);
    campo.querySelector('.field__error').textContent = mensaje;
    if (!(control instanceof RadioNodeList)) {
      control.setAttribute('aria-invalid', String(Boolean(mensaje)));
    }
    return !mensaje;
  };

  // Validación en vivo: al salir del campo, y mientras se corrige un error.
  Object.keys(reglas).forEach((nombre) => {
    const control = form.elements[nombre];
    const nodos = control instanceof RadioNodeList ? Array.from(control) : [control];
    nodos.forEach((nodo) => {
      nodo.addEventListener('change', () => validar(nombre));
      if (nodo.type === 'text' || nodo.type === 'tel') {
        nodo.addEventListener('blur', () => validar(nombre));
        nodo.addEventListener('input', () => {
          if (nodo.closest('.field').classList.contains('is-invalid')) validar(nombre);
        });
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const invalidos = Object.keys(reglas).filter((nombre) => !validar(nombre));
    if (invalidos.length) {
      const control = form.elements[invalidos[0]];
      (control instanceof RadioNodeList ? control[0] : control).focus();
      return;
    }

    const datos = Object.fromEntries(new FormData(form));
    if (datos.empresa) return; // campo trampa completado: es un bot
    delete datos.empresa;
    datos.proyecto = PROYECTOS[datos.proyecto];

    const urlWhatsApp = armarLinkWhatsApp(datos);
    let enviadoAlServidor = false;

    if (CONFIG.formEndpoint) {
      const boton = form.querySelector('[type="submit"]');
      boton.setAttribute('aria-busy', 'true');
      boton.textContent = 'Enviando…';
      try {
        const respuesta = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(datos),
        });
        enviadoAlServidor = respuesta.ok;
      } catch (error) {
        enviadoAlServidor = false; // sin conexión: queda el envío por WhatsApp
      }
      boton.removeAttribute('aria-busy');
      boton.textContent = 'Solicitar turno';
    } else {
      window.open(urlWhatsApp, '_blank', 'noopener');
    }

    document.getElementById('success-nombre').textContent = datos.nombre.trim().split(' ')[0];
    document.getElementById('success-texto').textContent = enviadoAlServidor
      ? 'Recibimos tu solicitud. Te vamos a contactar para confirmar día y horario. Si querés, también podés escribirnos ahora.'
      : 'Tu solicitud quedó armada. Si WhatsApp no se abrió solo, tocá el botón para enviarla.';
    document.getElementById('success-wa').href = urlWhatsApp;

    form.hidden = true;
    exito.hidden = false;
    exito.focus();
  });

  document.getElementById('success-reset').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.field').forEach((c) => c.classList.remove('is-valid', 'is-invalid'));
    exito.hidden = true;
    form.hidden = false;
    form.elements.nombre.focus();
  });
}

function armarLinkWhatsApp(datos) {
  const lineas = [
    'Hola Evolutiva Norte, quiero coordinar una reunión.',
    '',
    `Nombre: ${datos.nombre.trim()}`,
    `Teléfono: ${datos.telefono.trim()}`,
    `Tipo de proyecto: ${datos.proyecto}`,
    `Modalidad: ${datos.modalidad}`,
    `Franja horaria: ${datos.franja}`,
  ];
  if (datos.mensaje && datos.mensaje.trim()) lineas.push(`Detalle: ${datos.mensaje.trim()}`);
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lineas.join('\n'))}`;
}

/* ---------- Aparición suave al hacer scroll ---------- */
function initReveal() {
  const elementos = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  elementos.forEach((el) => observador.observe(el));
}
