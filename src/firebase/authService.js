import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

/**
 * Inicia sesión con correo electrónico y contraseña.
 */
export async function iniciarSesion(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Obtener perfil desde colección usuarios
  const userDocRef = doc(db, "usuarios", user.uid);
  const userSnapshot = await getDoc(userDocRef);

  if (userSnapshot.exists()) {
    const data = userSnapshot.data();
    return { uid: user.uid, clases_pactadas: data.clases_pactadas ?? 0, ...data };
  } else {
    // Si no existiera perfil, crear uno básico
    const nuevoPerfil = {
      nombre: user.displayName || email.split("@")[0],
      email: user.email,
      telefono: "",
      rol: "cliente",
      estado_cuenta: "activo",
      clases_pactadas: 0,
      fecha_creacion: serverTimestamp()
    };
    await setDoc(userDocRef, nuevoPerfil);
    return { uid: user.uid, ...nuevoPerfil };
  }
}

/**
 * Envia un correo electronico para restablecer la contraseña en Firebase Auth.
 */
export async function recuperarPassword(email) {
  if (!email || !email.trim()) {
    throw new Error("Por favor ingresa tu correo electrónico.");
  }

  await sendPasswordResetEmail(auth, email.trim());
  return "Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña.";
}

/**
 * Permite al usuario autenticado cambiar su contraseña validando su contraseña antigua.
 */
export async function cambiarPasswordUsuario({ claveAntigua, claveNueva, rectificarClave }) {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error("No hay una sesión de usuario activa.");
  }

  if (!claveAntigua || !claveAntigua.trim()) {
    throw new Error("Debes ingresar tu contraseña actual.");
  }

  if (!claveNueva || claveNueva.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  if (claveNueva !== rectificarClave) {
    throw new Error("La nueva contraseña y la confirmación no coinciden.");
  }

  try {
    // 1. Reautenticación con contraseña antigua
    const credential = EmailAuthProvider.credential(currentUser.email, claveAntigua);
    await reauthenticateWithCredential(currentUser, credential);

    // 2. Actualizar a la nueva contraseña en Firebase Auth
    await updatePassword(currentUser, claveNueva);
    return "Contraseña actualizada exitosamente en Firebase.";
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      throw new Error("La contraseña actual (antigua) es incorrecta.", { cause: error });
    }
    throw new Error(error.message || "No se pudo actualizar la contraseña.", { cause: error });
  }
}

/**
 * Registra un nuevo usuario y crea su perfil en la colección `usuarios`.
 */
export async function registrarUsuario({ email, password, nombre, telefono, rol = "cliente" }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const perfilUsuario = {
    nombre: nombre || email.split("@")[0],
    email: email.toLowerCase().trim(),
    telefono: telefono || "",
    rol: rol,
    estado_cuenta: "activo",
    clases_pactadas: 0,
    fecha_creacion: serverTimestamp()
  };

  await setDoc(doc(db, "usuarios", user.uid), perfilUsuario);
  return { uid: user.uid, ...perfilUsuario };
}

/**
 * Cierra la sesión activa.
 */
export async function cerrarSesion() {
  await signOut(auth);
}

/**
 * Escucha los cambios de estado de autenticación y carga el perfil de usuario.
 */
export function suscribirEstadoAuth(onChange) {
  let unsubscribeDoc = null;

  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeDoc) {
      unsubscribeDoc();
      unsubscribeDoc = null;
    }

    if (user) {
      const userDocRef = doc(db, "usuarios", user.uid);
      unsubscribeDoc = onSnapshot(userDocRef, (userSnapshot) => {
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          onChange({ uid: user.uid, clases_pactadas: data.clases_pactadas ?? 0, ...data });
        } else {
          onChange({
            uid: user.uid,
            email: user.email,
            nombre: user.displayName || user.email.split("@")[0],
            rol: "cliente",
            estado_cuenta: "activo",
            clases_pactadas: 0
          });
        }
      }, (error) => {
        console.error("Error al escuchar perfil de usuario:", error);
        onChange({ uid: user.uid, email: user.email, clases_pactadas: 0 });
      });
    } else {
      onChange(null);
    }
  });

  return () => {
    if (unsubscribeDoc) unsubscribeDoc();
    unsubAuth();
  };
}


