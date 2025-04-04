# WebPhone SIP en React

Este proyecto implementa un softphone web desarrollado en React que se conecta a una infraestructura SIP mediante la librería SIPml5.

## Funcionalidades principales

- Registro de usuario SIP.
- Realización y recepción de llamadas.
- Control de volumen de micrófono y altavoz.
- Detección visual de voz activa con WebAudio.
- Indicadores de estado de llamada (en espera, colgar, transferir, etc).
- UI responsiva con iconografía y animaciones.

## Requisitos

- Node.js >= 16
- Navegador compatible con WebRTC
- Acceso a credenciales SIP

## Instalación

```bash
git clone https://github.com/Yayo09/webphone-react-sipml5.git
cd webphone-react-sipml5
npm install
```

## Variables de entorno en archivo .env

Configura un archivo `.env` en la raíz con lo siguiente:

```
VITE_SIP_REALM=dominio.com
VITE_SIP_USER=usuario
VITE_SIP_PASSWORD=clave
VITE_SIP_DISPLAY=Nombre
VITE_SIP_WEBSOCKET=wss://dominio.com/ws
VITE_SIP_OUTBOUND=sip:dominio.com
```

## Ejecución

npm run dev

## Estructura relevante

- `src/WebPhone.jsx`: Lógica principal del componente React.
- `src/auth/sipService.js`: Módulo que abstrae las funciones SIPml5 (registrar, llamar, colgar, etc).
- `src/style/WebPhone.css`: Estilos personalizados con animaciones de micrófono y UI.

## Tecnologías usadas

- React
- SIPml5
- WebRTC
- WebAudio API
- React Icons

## Notas técnicas

- Se usa `navigator.mediaDevices.getUserMedia()` con filtros de cancelación de ruido.
- El sistema detecta actividad de voz con `AnalyserNode` y muestra un aura de micrófono.
- El componente usa `useState`, `useEffect` y `useRef` para manejar la lógica en tiempo real.
