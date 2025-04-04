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

cd webphone
npm install

## Variables de entorno en archivo .env

VITE_SIP_REALM=dominio.com
VITE_SIP_USER=usuario
VITE_SIP_PASSWORD=clave
VITE_SIP_DISPLAY=Nombre
VITE_SIP_WEBSOCKET=wss://dominio.com/ws
VITE_SIP_OUTBOUND=sip:dominio.com

## Ejecución

npm run dev
