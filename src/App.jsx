import React, { useState, useEffect, useRef } from "react";
import {
  FaPhone,
  FaMicrophone,
  FaKeyboard,
  FaVolumeMute,
  FaPause,
  FaExchangeAlt,
  FaCog,
  FaPhoneSlash,
} from "react-icons/fa";
import "./style/App.scss";

import {
  configuration,
  registerSession,
  unregisterSession,
  subscribeSessionH,
  unsubscribeSession,
  makeCall,
  hangupCall,
  holdCall,
  resumeCall,
  muteAudio,
  transferCall,
} from "../auth/sip";

const App = () => {
  const [number, setNumber] = useState("");
  const [originalNumber, setOriginalNumber] = useState("");
  const [transferNumber, setTransferNumber] = useState("");
  const [showTransferInput, setShowTransferInput] = useState(false);
  const [micVolume, setMicVolume] = useState(50);
  const [callVolume, setCallVolume] = useState(50);
  const [activeTab, setActiveTab] = useState("teclado");
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const settingsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef();

  const handleDial = (digit) => {
    if (!showTransferInput) {
      setNumber((prev) => prev + digit);
    } else {
      setTransferNumber((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (!showTransferInput) {
      setNumber((prev) => prev.slice(0, -1));
    } else {
      setTransferNumber((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!showTransferInput) {
      setNumber("");
    } else {
      setTransferNumber("");
    }
  };

  const cancelTransfer = () => {
    setShowTransferInput(false);
    setTransferNumber("");
    setNumber(originalNumber);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const wasConnected = localStorage.getItem("sip_connected") === "true";
    if (wasConnected) {
      handleConnect();
    }
  }, []);

  useEffect(() => {
    let rafId;

    const detectVoice = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const microphone = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detect = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          // console.log("Mic volume:", volume);
          setIsSpeaking(!isMuted && volume > 10);
          setMicLevel(volume);
          requestAnimationFrame(detect);
        };

        detect();
      } catch (err) {
        console.error("Error accediendo al micrófono:", err);
      }
    };

    detectVoice();
    return () => cancelAnimationFrame(rafId);
  }, [isMuted]);

  const handleTransfer = () => {
    if (!showTransferInput) {
      setOriginalNumber(number);
      setNumber("");
      setShowTransferInput(true);
      return;
    }

    if (transferNumber.trim()) {
      console.log("Realizando transferencia a:", transferNumber);
      transferCall(transferNumber);
      setShowTransferInput(false);
      setTransferNumber("");
    }
  };

  const handleConnect = async () => {
    try {
      await configuration(() => {});
      registerSession();
      subscribeSessionH(() => {});
      setIsConnected(true);
      localStorage.setItem("sip_connected", "true");
    } catch (error) {
      console.error("Error al conectar:", error);
      setIsConnected(false);
      localStorage.removeItem("sip_connected");
    }
  };

  const handleDisconnect = () => {
    unsubscribeSession();
    unregisterSession();
    setIsConnected(false);
    localStorage.removeItem("sip_connected");
  };

  const handleCall = () => {
    if (number) {
      makeCall(number, {
        audio_remote: audioRef.current,
        events_listener: {
          events: "*",
          listener: (e) => console.log("CALL EVENT:", e.type),
        },
      });
    }
  };

  const handleHangup = () => hangupCall();
  const handleMute = () => {
    muteAudio(!isMuted);
    setIsMuted((prev) => !prev);
  };
  const handlePause = () => {
    if (!isPaused) {
      holdCall();
    } else {
      resumeCall();
    }
    setIsPaused((prev) => !prev);
  };

  return (
    <>
      <div className="settings-wrapper" ref={settingsRef}>
        <div
          className="settings-icon-fixed"
          onClick={() => setShowSettings(!showSettings)}
        >
          <FaCog />
        </div>
        {showSettings && (
          <div className="settings-dropdown floating">
            <div className="slider-group">
              <label>Volumen micrófono: {micVolume}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={micVolume}
                onChange={(e) => setMicVolume(e.target.value)}
              />
            </div>
            <div className="slider-group">
              <label>Volumen llamada: {callVolume}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={callVolume}
                onChange={(e) => setCallVolume(e.target.value)}
              />
            </div>
            {!isConnected ? (
              <button className="connect" onClick={handleConnect}>
                Conectar
              </button>
            ) : (
              <button className="disconnect danger" onClick={handleDisconnect}>
                Desconectar
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="webphone compact"
        style={{ transform: "scale(1.2)", transformOrigin: "top center" }}
      >
        <div className="display">
          {showTransferInput
            ? `Transferir llamada desde ${originalNumber}`
            : number || "Inserta el número a llamar"}
        </div>

        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
            (d) => (
              <button key={d} onClick={() => handleDial(d)}>
                {d}
              </button>
            )
          )}
        </div>

        <div className="horizontal-actions">
          <button
            className="delete square gray"
            onClick={handleDelete}
            onContextMenu={(e) => {
              e.preventDefault();
              handleClear();
            }}
            title="Clic derecho para borrar todo"
          >
            Borrar
          </button>
          <button className="call square green" onClick={handleCall}>
            <FaPhone /> Llamar
          </button>
          <button className="call hangup square red" onClick={handleHangup}>
            <FaPhoneSlash /> Colgar
          </button>
        </div>

        <div className="actions">
          <button
            className={activeTab === "llamadas" ? "active" : ""}
            onClick={() => setActiveTab("llamadas")}
          >
            <FaPhone /> Historial Llamadas
          </button>
          <button
            className={activeTab === "teclado" ? "active" : ""}
            onClick={() => setActiveTab("teclado")}
          >
            <FaKeyboard /> Teclado
          </button>
          <button
            className={`microphone-tab ${
              activeTab === "hablando" ? "active" : ""
            } ${isSpeaking ? "pulse-mic" : ""}`}
            onClick={() => setActiveTab("hablando")}
          >
            <FaMicrophone /> Hablando
          </button>
        </div>

        <div className="actions">
          <button onClick={handleMute} className={isMuted ? "active" : ""}>
            <FaVolumeMute /> {isMuted ? "Activar" : "Silenciar"}
          </button>
          <button onClick={handlePause} className={isPaused ? "active" : ""}>
            <FaPause /> {isPaused ? "Reanudar" : "En espera"}
          </button>
          <button onClick={handleTransfer}>
            <FaExchangeAlt />{" "}
            {showTransferInput ? "Confirmar número" : "Realizar transferencia"}
          </button>
        </div>

        {showTransferInput && (
          <div className="transfer animate">
            <label>Transferir a:</label>
            <input
              type="text"
              placeholder="Número de destino"
              value={transferNumber}
              className={transferNumber.trim() === "" ? "invalid" : "valid"}
              onChange={(e) => setTransferNumber(e.target.value)}
            />
            <button onClick={cancelTransfer} className="gray square">
              Cancelar transferencia
            </button>
          </div>
        )}

        <audio ref={audioRef} autoPlay style={{ display: "none" }} />
      </div>
    </>
  );
};

export default App;
