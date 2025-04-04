// Referencias globales a la pila SIP, sesión de llamada, registro y mensajes
let sipStack = null;
let sipSession = null;
let registerSession = null;
let messageSession = null;

/**
 * Inicializa la pila SIP con la configuración proveniente de variables de entorno.
 * Se conecta al servidor SIP y escucha eventos como inicio y llamadas entrantes.
 *
 * @param {Object} options
 * @param {Function} options.onStarted - Función a ejecutar cuando el stack SIP está listo.
 * @param {Function} options.onEvent - Función para manejar eventos SIP.
 */

export function iniciarSIP({ onStarted, onEvent }) {
  if (!window.SIPml) {
    console.error("SIPml5 no está cargado");
    return;
  }

  // Variables de entorno para la configuración SIP
  const realm = import.meta.env.VITE_SIP_REALM;
  const user = import.meta.env.VITE_SIP_USER;
  const password = import.meta.env.VITE_SIP_PASSWORD;
  const displayName = import.meta.env.VITE_SIP_DISPLAY;
  const websocket = import.meta.env.VITE_SIP_WEBSOCKET;
  const outboundProxy = import.meta.env.VITE_SIP_OUTBOUND;
  const impu = `sip:${user}@${realm}`; // URI del usuario SIP

  console.log("Conectando con:", {
    realm,
    user,
    impu,
    password,
    displayName,
    websocket,
    outboundProxy,
  });

  // Instancia del stack SIPml
  sipStack = new window.SIPml.Stack({
    realm,
    impi: user,
    impu,
    password,
    display_name: displayName,
    websocket_proxy_url: websocket,
    outbound_proxy_url: outboundProxy,
    enable_rtcweb_breaker: false,
    enable_early_ims: false,
    enable_media_stream_cache: true,
    bandwidth: { audio: "64" }, // kbps
    sip_headers: [
      { name: "User-Agent", value: "IM-client/OMA1.0 sipML5-v1.0.0.0" },
      { name: "Organization", value: "Doubango Telecom" },
    ],
    events_listener: {
      events: "*",
      listener: (e) => {
        console.log("SIP EVENT:", e.type);
        if (e.type === "started" && typeof onStarted === "function") {
          onStarted(); // Stack listo
        }
        if (typeof onEvent === "function") {
          onEvent(e); // Otros eventos
        }
      },
    },
  });

  sipStack.start(); // Inicia la pila SIP
}

/**
 * Registra al usuario SIP ante el servidor.
 */
export function registrarUsuario() {
  if (!sipStack) return;

  registerSession = sipStack.newSession("register", {
    events_listener: {
      events: "*",
      listener: (e) => {
        console.log("REGISTRO:", e.type);
      },
    },
  });

  registerSession.register();
}

/**
 * Realiza una llamada saliente a un número SIP.
 *
 * @param {string} numero - Número al que se desea llamar.
 * @param {HTMLAudioElement} audioRef - Referencia al componente de audio que reproduce la llamada.
 */
export function realizarLlamada(numero, audioRef) {
  if (!sipStack || !numero) return;

  sipSession = sipStack.newSession("call-audio", {
    audio_remote: audioRef,
    events_listener: {
      events: "*",
      listener: (e) => {
        console.log("CALL EVENT:", e.type);
      },
    },
  });

  sipSession.call(`sip:${numero}@${import.meta.env.VITE_SIP_REALM}`);
}

/**
 * Cuelga la llamada activa (si existe).
 */
export function colgarLlamada() {
  if (sipSession) {
    sipSession.hangup();
    sipSession = null;
  }
}

/**
 * Acepta una llamada entrante.
 *
 * @param {Object} evento - Evento SIP entrante.
 * @param {HTMLAudioElement} audioRef - Elemento donde se reproducirá el audio de la llamada.
 */
export function aceptarLlamada(evento, audioRef) {
  const incomingSession = evento.newSession;

  incomingSession.accept({
    audio_remote: audioRef,
    events_listener: {
      events: "*",
      listener: (e) => console.log("LLAMADA ENTRANTE:", e.type),
    },
  });
}

/**
 * Envía un mensaje de texto SIP a un destinatario.
 *
 * @param {string} destinatario - Usuario SIP destino.
 * @param {string} mensaje - Contenido del mensaje a enviar.
 */
export function enviarMensaje(destinatario, mensaje) {
  if (!sipStack) return;

  messageSession = sipStack.newSession("message", {
    events_listener: {
      events: "*",
      listener: (e) => console.log("MENSAJE:", e.type),
    },
  });

  messageSession.send(
    `sip:${destinatario}@${import.meta.env.VITE_SIP_REALM}`,
    mensaje
  );
}

/**
 * Pone la llamada actual en espera (hold).
 */
export function ponerEnEspera() {
  if (sipSession) {
    sipSession.hold();
    console.log("Llamada en espera");
  }
}

/**
 * Reanuda la llamada previamente puesta en espera.
 */
export function reanudarLlamada() {
  if (sipSession) {
    sipSession.resume();
    console.log("Llamada reanudada");
  }
}

/**
 * Transfiere la llamada activa a otro número SIP.
 *
 * @param {string} destino - Número SIP al que se desea transferir la llamada.
 */
export function transferirLlamada(destino) {
  if (sipSession && destino) {
    sipSession.transfer(`sip:${destino}@${import.meta.env.VITE_SIP_REALM}`);
    console.log("Llamada transferida a:", destino);
  }
}
