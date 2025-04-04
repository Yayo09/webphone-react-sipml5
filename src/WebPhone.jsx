import React, { useEffect, useRef, useState } from "react";
import "./style/WebPhone.css";

// Funciones SIP externas
import {
  iniciarSIP,
  realizarLlamada,
  colgarLlamada,
  aceptarLlamada,
  transferirLlamada,
  ponerEnEspera,
  reanudarLlamada,
} from "./auth/sipService";
import {
  FaPlay,
  FaPhone,
  FaKeyboard,
  FaMicrophone,
  FaVolumeMute,
  FaPause,
  FaExchangeAlt,
  FaEnvelope,
  FaCog,
} from "react-icons/fa";

const WebPhone = () => {
  // ---------------------- Estados ----------------------
  const [numero, setNumero] = useState("");
  const [registrado, setRegistrado] = useState(false);
  const [menuActivo, setMenuActivo] = useState("teclado");
  const [enEspera, setEnEspera] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const [callVolume, setCallVolume] = useState(1);
  const [micVolume, setMicVolume] = useState(1);
  const [mostrarConfig, setMostrarConfig] = useState(false);

  // ---------------------- Refs ----------------------

  // Referencia al elemento de audio que reproduce la llamada
  const remoteAudioRef = useRef(null);

  // Referencia al contexto de audio Web Audio API
  const micAudioContextRef = useRef(null);

  // Nodo de ganancia para controlar el volumen del micrófono
  const micGainNodeRef = useRef(null);

  // Analizador de audio para visualizar el volumen del micrófono
  const micAnalyserNodeRef = useRef(null);

  // Fuente de audio del micrófono (stream de entrada)
  const micSourceRef = useRef(null);

  // ---------------------- Efecto de Inicialización SIP ----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.SIPml) {
        clearInterval(interval);
        window.SIPml.init(() => {
          iniciarSIP({
            onStarted: () => setRegistrado(true),
            onEvent: (e) => {
              if (e.type === "i_new_call") {
                aceptarLlamada(e, remoteAudioRef.current);
              }
            },
          });
        });
      }
    }, 300);
  }, []);

  // ---------------------- Volumen dinámico ----------------------
  useEffect(() => {
    if (micGainNodeRef.current) micGainNodeRef.current.gain.value = micVolume;
    if (remoteAudioRef.current) remoteAudioRef.current.volume = callVolume;
  }, [micVolume, callVolume]);

  // ---------------------- Funciones ----------------------
  const toggleConfiguracion = () => setMostrarConfig((prev) => !prev);
  const marcar = (valor) => setNumero((prev) => prev + valor);
  const limpiar = () => setNumero("");

  const llamar = () => realizarLlamada(numero, remoteAudioRef.current);
  const colgar = () => colgarLlamada();
  const transferir = () => transferirLlamada(numero);

  const toggleEspera = () => {
    enEspera ? reanudarLlamada() : ponerEnEspera();
    setEnEspera(!enEspera);
  };

  const activarMicrofono = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!micAudioContextRef.current) {
        // Crea un AudioContext solo si no existe
        micAudioContextRef.current = new AudioContext();
        micSourceRef.current =
          micAudioContextRef.current.createMediaStreamSource(stream);
        // Crea una fuenta de audio a partir del stream (en vivo) del microfono
        micGainNodeRef.current = micAudioContextRef.current.createGain();
        // Este es el nodo para controlar el volumen
        micAnalyserNodeRef.current =
          micAudioContextRef.current.createAnalyser();
        // Es el nodo para visualizar el volumen (lo que esta usandose en la barra de volumen)
        micSourceRef.current.connect(micGainNodeRef.current);
        micGainNodeRef.current.connect(micAnalyserNodeRef.current);
        updateVolumeMeter();
      }
    });
  };

  const updateVolumeMeter = () => {
    const bufferLength = micAnalyserNodeRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    // Obtiene el tamaño del buffer y crea un array de datos.

    const calculateVolume = () => {
      micAnalyserNodeRef.current.getFloatTimeDomainData(dataArray); // Obtiene los datos del volumen en tiempo real
      const rms = Math.sqrt(
        dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length
      );
      setVolumeLevel(rms);
      requestAnimationFrame(calculateVolume);
    };
    calculateVolume();
  };

  const toggleMute = () => {
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = micMuted ? micVolume : 0;
      setMicMuted(!micMuted);
    }
  };

  const login = () => {
    window.SIPml.init(() => {
      iniciarSIP({
        onStarted: () => setRegistrado(true),
        onEvent: (e) => {
          if (e.type === "i_new_call")
            aceptarLlamada(e, remoteAudioRef.current);
        },
      });
    });
  };

  // ---------------------- Render ----------------------
  return (
    <div className="phone">
      <div className="top-bar">
        <button
          className={`connect-btn ${registrado ? "connected" : ""}`}
          onClick={login}
          disabled={registrado}
        >
          {registrado ? "Conectado" : "Conectar"}
        </button>
        <button className="settings-btn" onClick={toggleConfiguracion}>
          <FaCog />
        </button>
        {mostrarConfig && (
          <div className="config-modal">
            <h4>Ajustes de Volumen</h4>
            <label>
              Micrófono:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={micVolume}
                onChange={(e) => setMicVolume(parseFloat(e.target.value))}
              />
            </label>
            <label>
              Llamada:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={callVolume}
                onChange={(e) => setCallVolume(parseFloat(e.target.value))}
              />
            </label>
            <button onClick={toggleConfiguracion}>Cerrar</button>
          </div>
        )}
      </div>

      <div className="input-row">
        <input
          type="text"
          placeholder="Inserta el número a llamar"
          value={numero}
          readOnly
        />
        <button className="clear-btn" onClick={limpiar}>
          ✕
        </button>
      </div>

      <div className="dialpad">
        {"123456789*0#".split("").map((n, i) => (
          <button key={i} onClick={() => marcar(n)}>
            {n}
          </button>
        ))}
      </div>

      <button className="call-btn" onClick={llamar}>
        Llamar
      </button>
      <button className="call-btn" onClick={colgar}>
        Colgar
      </button>

      <div className="footer">
        <div
          className={`footer-btn ${menuActivo === "llamadas" ? "active" : ""}`}
          onClick={() => setMenuActivo("llamadas")}
        >
          <FaPhone />
          <p>Llamadas</p>
        </div>
        <div
          className={`footer-btn ${menuActivo === "teclado" ? "active" : ""}`}
          onClick={() => setMenuActivo("teclado")}
        >
          <FaKeyboard />
          <p>Teclado</p>
        </div>
        <div
          className={`footer-btn ${
            menuActivo === "microfono" ? "active" : ""
          } ${volumeLevel > 0.05 && !micMuted ? "hablando" : ""}`}
          onClick={() => {
            activarMicrofono();
            setMenuActivo("microfono");
          }}
        >
          <FaMicrophone />
          <p>
            {micMuted
              ? "Silenciado"
              : volumeLevel > 0.05
              ? "Hablando"
              : "Micrófono"}
          </p>
        </div>
        <div
          className={`footer-btn ${menuActivo === "silenciar" ? "active" : ""}`}
          onClick={() => {
            toggleMute();
            setMenuActivo("silenciar");
          }}
        >
          {micMuted ? <FaVolumeMute /> : <FaMicrophone />}
          <p>{micMuted ? "Activar micrófono" : "Silenciar"}</p>
        </div>
        <div
          className={`footer-btn ${menuActivo === "espera" ? "active" : ""}`}
          onClick={() => {
            toggleEspera();
            setMenuActivo("espera");
          }}
        >
          {enEspera ? <FaPlay /> : <FaPause />}
          <p>{enEspera ? "Reanudar llamada" : "En espera"}</p>
        </div>

        <div className="footer-btn" onClick={transferir}>
          <FaExchangeAlt />
          <p>Transferir</p>
        </div>
        <div className="footer-btn">
          <FaEnvelope />
          <p>Buzón voz</p>
        </div>
      </div>

      <div className="volume-meter">
        <div
          className="volume-bar"
          style={{ width: `${Math.min(volumeLevel * 100 * 2, 100)}%` }}
        />
      </div>

      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default WebPhone;
