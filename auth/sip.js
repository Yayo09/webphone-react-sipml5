let sipStack;
let sipSession;
let subscribeSession;
let callSession;

const SIP_EVENTS = "*";

const configuration = (onEvents, onStarted) => {
  return new Promise((resolve, reject) => {
    if (!window.SIPml) return reject("SIPml not loaded");

    SIPml.init(() => {
      const eventsListener = (e) => {
        console.log("SIP Event:", e);
        if (e.type === "started") {
          sipSession = sipStack.newSession("register", {
            expires: 200,
            events_listener: {
              events: SIP_EVENTS,
              listener: onEvents || (() => {}),
            },
          });

          if (typeof onStarted === "function") {
            onStarted();
          }

          return resolve(sipStack);
        }
        if (onEvents) onEvents(e);
      };

      const user = import.meta.env.VITE_SIP_USER;
      const realm = import.meta.env.VITE_SIP_REALM;

      sipStack = new SIPml.Stack({
        realm,
        impi: user,
        impu: `sip:${user}@${realm}`,
        password: import.meta.env.VITE_SIP_PASSWORD,
        display_name: import.meta.env.VITE_SIP_DISPLAY,
        websocket_proxy_url: import.meta.env.VITE_SIP_WEBSOCKET,
        outbound_proxy_url: import.meta.env.VITE_SIP_OUTBOUND_PROXY,
        enable_rtcweb_breaker: false,
        enable_early_ims: false,
        enable_media_stream_cache: false,
        bandwidth: { audio: "64" },
        sip_headers: [
          { name: "User-Agent", value: "IM-client/OMA1.0 sipML5-v1.0.0.0" },
          { name: "Organization", value: "Doubango Telecom" },
        ],
        events_listener: {
          events: SIP_EVENTS,
          listener: eventsListener,
        },
      });

      sipStack.start();
    });
  });
};

const registerSession = () => {
  if (!sipSession) return;
  sipSession.register();
};

const unregisterSession = () => {
  if (!sipSession) return;
  sipSession.unregister();
};

const subscribeSessionH = (config) => {
  if (!sipSession) return;

  const to = `sip:${import.meta.env.VITE_SIP_USER}@${
    import.meta.env.VITE_SIP_REALM
  }`;
  subscribeSession = sipStack.newSession("subscribe", config);
  subscribeSession.subscribe(to);
};

const unsubscribeSession = () => {
  if (!subscribeSession) return;
  subscribeSession.unsubscribe();
};

const makeCall = (to, config) => {
  if (!sipStack || !to) return;

  callSession = sipStack.newSession("call-audio", config);
  callSession.call(`sip:${to}@${import.meta.env.VITE_SIP_REALM}`);
};

const acceptTransfer = (config) => {
  if (!sipSession) return;
  sipSession.acceptTransfer(config);
};

const hangupCall = () => {
  if (!callSession) return;
  callSession.hangup();
};

const holdCall = () => {
  if (!callSession) return;
  callSession.hold();
};

const muteAudio = (mute) => {
  if (!callSession || !callSession.mute) return;
  try {
    callSession.mute("audio", mute);
  } catch (e) {
    console.error("No se pudo silenciar la llamada:", e.message);
  }
};

const resumeCall = () => {
  if (!callSession) return;
  callSession.resume();
};

const rejectTransfer = (config) => {
  if (!callSession) return;
  callSession.rejectTransfer(config);
};

const transferCall = (to) => {
  if (!callSession || !to) return;
  console.log("Ejecutando transferCall hacia", to);
  callSession.transfer(`sip:${to}@${import.meta.env.VITE_SIP_REALM}`);
};

export {
  configuration,
  registerSession,
  unregisterSession,
  subscribeSessionH,
  unsubscribeSession,
  makeCall,
  acceptTransfer,
  hangupCall,
  holdCall,
  muteAudio,
  resumeCall,
  rejectTransfer,
  transferCall,
};
