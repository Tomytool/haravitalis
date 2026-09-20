import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlOA8NbU9Ba81TW_RDbtg1uprxMj9fds4",
  authDomain: "huravitalis-pilates.firebaseapp.com",
  projectId: "huravitalis-pilates",
  storageBucket: "huravitalis-pilates.firebasestorage.app",
  messagingSenderId: "1080755197036",
  appId: "1:1080755197036:web:47c974442585bf69127449"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inicializarColeccion() {
  console.log("Conectando a Firestore en el proyecto: huravitalis-pilates...");
  const coleccionRef = collection(db, "historial_pagos_usuarios");

  const documentoInicial = {
    fecha_modificacion: serverTimestamp(),
    fecha_legible: new Date().toLocaleString("es-CL"),
    timestamp_ms: Date.now(),
    usuario_id: "sistema_inicial",
    usuario_nombre: "Registro Inicial del Sistema",
    usuario_email: "contacto@huravitalis.cl",
    admin_id: "admin_sistema",
    admin_nombre: "Administrador Huravitalis",
    admin_email: "admin@huravitalis.cl",
    clases_pactadas_anteriores: 0,
    clases_pactadas_nuevas: 4,
    clases_agregadas: 4,
    sesiones_terapia_anteriores: 0,
    sesiones_terapia_nuevas: 2,
    sesiones_terapia_agregadas: 2,
    monto_pago: 57000,
    monto_formateado: "$57.000",
    detalle_tarifa: "Pack: 4 clases + 2 terapias (Inicialización de Colección)",
    es_tarifa_oficial: true,
    tipo_operacion: "inicializacion_coleccion",
    nota: "Documento inicial para crear y habilitar la colección historial_pagos_usuarios en la consola de Firebase."
  };

  try {
    const docRef = await addDoc(coleccionRef, documentoInicial);
    console.log("¡ÉXITO! Colección 'historial_pagos_usuarios' creada exitosamente en Firestore.");
    console.log("ID del documento creado:", docRef.id);
  } catch (error) {
    console.error("Error al crear documento en Firestore:", error);
    process.exit(1);
  }
}

inicializarColeccion().then(() => {
  process.exit(0);
});
