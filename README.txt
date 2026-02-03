=====================================================
EJEMPLO INTEGRACION WMEA (Medicion de Signos Vitales)
=====================================================

ESTRUCTURA DEL PROYECTO
-----------------------
ejemplo-wmea/
  ├── client/
  │   └── index.html    <- Frontend (interfaz de usuario)
  ├── server.mjs        <- Backend (servidor Express)
  ├── package.json      <- Dependencias del proyecto
  ├── .env              <- Variables de entorno (credenciales)
  └── README.txt        <- Este archivo


PASO 1: CONFIGURAR CREDENCIALES
-------------------------------
Editar el archivo .env con tus credenciales de Nuralogix:

API_URL=api.na-east.deepaffex.ai
STUDY_ID=tu_study_id_real
LICENSE_KEY=tu_license_key_real
PORT=7000


PASO 2: INSTALAR DEPENDENCIAS
-----------------------------
Abrir terminal en esta carpeta y ejecutar:

npm install


PASO 3: INICIAR EL SERVIDOR
---------------------------
npm start

El servidor estara disponible en: http://localhost:7000


COMO FUNCIONA
-------------
1. El usuario abre http://localhost:7000
2. Se muestra el widget de medicion WMEA
3. El usuario inicia la camara y realiza la medicion
4. Al completar, se muestran los resultados en pantalla
5. Los resultados tambien se guardan en localStorage


PERSONALIZACION
---------------
En client/index.html puedes modificar:

- profile: Datos demograficos del usuario (edad, altura, peso, etc.)
- config.checkConstraints: false para iPhone
- language: Idioma del widget ('es', 'en', 'fr', etc.)


REQUISITOS
----------
- Node.js >= 18 (recomendado >= 25)
- Credenciales validas de Nuralogix
- HTTPS en produccion (la camara requiere contexto seguro)


SOPORTE
-------
Documentacion: https://docs.nuralogix.ai
