# Guía de Construcción de SafeSignal para Android e iOS

Esta guía explica cómo compilar SafeSignal como aplicación nativa para Android e iOS usando Capacitor con Firebase.

## Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Construcción para Android](#construcción-para-android)
4. [Construcción para iOS](#construcción-para-ios)
5. [Configuración de Firebase](#configuración-de-firebase)
6. [Notificaciones Push](#notificaciones-push)
7. [Publicación en Tiendas](#publicación-en-tiendas)
8. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Para Android

1. **Node.js** (versión 18 o superior)
   - Descarga: https://nodejs.org/

2. **Java Development Kit (JDK) 17**
   - Descarga: https://adoptium.net/
   - Configura `JAVA_HOME` en tus variables de entorno

3. **Android Studio**
   - Descarga: https://developer.android.com/studio
   - Instala el SDK de Android (API 33 o superior)
   - Configura `ANDROID_HOME` en tus variables de entorno

### Para iOS (solo en macOS)

1. **macOS** (Monterey 12.0 o superior)

2. **Xcode 15** o superior
   - Descarga desde la App Store de Mac
   - Instala las herramientas de línea de comandos:
     ```bash
     xcode-select --install
     ```

3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

4. **Cuenta de Apple Developer** ($99 USD/año)
   - Registro: https://developer.apple.com/

### Para ambos

- **Cuenta de Google Play Console** ($25 USD pago único) - Para publicar en Android
- **Firebase** (gratis) - Ya configurado para notificaciones y base de datos en tiempo real

---

## Configuración Inicial

### 1. Descargar el proyecto

Descarga el código desde Replit:
1. En Replit, ve a los tres puntos (...) del menú
2. Selecciona "Download as zip"
3. Extrae en tu Mac

### 2. Instalar dependencias

```bash
cd safesignal
npm install
```

### 3. Construir la aplicación web

```bash
npm run build
```

Esto creará la carpeta `dist` con los archivos compilados.

### 4. Añadir plataformas nativas

```bash
# Para iOS (en Mac)
npx cap add ios

# Para Android
npx cap add android
```

### 5. Sincronizar el código

Después de cualquier cambio en el código web:

```bash
npm run build
npx cap sync
```

---

## Construcción para iOS (Mac)

### Paso 1: Abrir en Xcode

```bash
npx cap open ios
```

### Paso 2: Configurar firma de código

1. En Xcode, selecciona el proyecto **App** en el navegador izquierdo
2. Ve a la pestaña **Signing & Capabilities**
3. Activa **Automatically manage signing**
4. Selecciona tu equipo de desarrollo (tu Apple ID)
5. El **Bundle Identifier** debe ser `com.safesignal.app`

### Paso 3: Ejecutar en simulador

1. En la barra superior, selecciona un simulador (ej: iPhone 15)
2. Presiona **Cmd + R** o haz clic en el botón ▶️
3. Espera a que compile y se abra en el simulador

### Paso 4: Ejecutar en tu iPhone

1. Conecta tu iPhone por USB
2. Desbloquea el iPhone y confía en la computadora
3. En Xcode, selecciona tu iPhone en la barra superior
4. Presiona **Cmd + R**
5. La primera vez, ve a **Configuración > General > VPN y gestión de dispositivos** en tu iPhone y confía en el desarrollador

### Paso 5: Generar IPA para distribución

1. En Xcode: **Product > Archive**
2. Espera a que termine (puede tardar varios minutos)
3. Se abrirá el **Organizer**
4. Selecciona el archivo y haz clic en **Distribute App**
5. Elige:
   - **App Store Connect** para publicar
   - **Ad Hoc** para pruebas internas
   - **Development** para desarrollo

---

## Construcción para Android

### Paso 1: Abrir en Android Studio

```bash
npx cap open android
```

### Paso 2: Esperar sincronización de Gradle

Android Studio sincronizará automáticamente. Esto puede tardar unos minutos la primera vez.

### Paso 3: Ejecutar en emulador

1. En la barra superior, selecciona un emulador o créalo en **Device Manager**
2. Haz clic en **Run** (▶️) o presiona `Shift + F10`

### Paso 4: Ejecutar en tu Android

1. En tu Android: **Configuración > Opciones de desarrollador > Depuración USB** (actívala)
2. Conecta tu dispositivo por USB
3. Acepta la depuración USB en tu dispositivo
4. Selecciona tu dispositivo en Android Studio
5. Haz clic en **Run** (▶️)

### Paso 5: Generar APK firmado

#### Crear keystore (solo la primera vez)

```bash
keytool -genkey -v -keystore safesignal-release.keystore \
  -alias safesignal -keyalg RSA -keysize 2048 -validity 10000
```

Guarda la contraseña que elijas.

#### Configurar firma en Android Studio

1. **Build > Generate Signed Bundle / APK**
2. Selecciona **APK** y haz clic en **Next**
3. Selecciona tu keystore o créalo
4. Completa los campos y haz clic en **Next**
5. Selecciona **release** y haz clic en **Create**

El APK estará en: `android/app/release/app-release.apk`

---

## Configuración de Firebase

### Ya está configurado

SafeSignal ya tiene Firebase configurado. Los datos se guardan en Firebase Realtime Database automáticamente.

### Para ver los datos en Firebase Console

1. Ve a https://console.firebase.google.com/
2. Abre el proyecto "safesignal-1f22c"
3. Ve a **Realtime Database** para ver las salas y alertas

### Configuración para Android (Notificaciones Push)

1. En Firebase Console, ve a **Project Settings > General**
2. En la sección "Your apps", busca Android
3. Si no existe, haz clic en **Add app** > Android
4. Ingresa el ID: `com.safesignal.app`
5. Descarga `google-services.json`
6. Copia el archivo a `android/app/`

### Configuración para iOS (Notificaciones Push)

1. En Firebase Console, ve a **Project Settings > General**
2. Añade una app iOS con Bundle ID: `com.safesignal.app`
3. Descarga `GoogleService-Info.plist`
4. En Xcode, arrastra el archivo a la carpeta `App`
5. En **Signing & Capabilities**, añade **Push Notifications**
6. Añade **Background Modes** y activa **Remote notifications**

---

## Notificaciones Push (Avanzado)

### Requisitos adicionales

Para que las notificaciones funcionen cuando la app está cerrada, necesitas:

1. **Firebase Cloud Messaging** configurado (ver arriba)
2. **Apple Push Notification Service (APNs)** para iOS:
   - Crea una Key en Apple Developer Portal
   - Súbela a Firebase Console > Project Settings > Cloud Messaging

### Código ya incluido

El archivo `client/src/lib/push-notifications.ts` ya maneja:
- Solicitar permisos
- Registrar el token del dispositivo
- Recibir notificaciones

---

## Publicación en Tiendas

### Google Play Store

1. Ve a https://play.google.com/console/
2. Paga la tarifa única de $25 USD
3. Crea una nueva aplicación
4. Sube el archivo AAB (no APK) desde:
   ```bash
   cd android && ./gradlew bundleRelease
   ```
5. Completa toda la información requerida
6. Envía para revisión (1-3 días)

### Apple App Store

1. Ve a https://appstoreconnect.apple.com/
2. Crea una nueva app
3. Sube el build desde Xcode (Archive > Distribute)
4. Completa la información y capturas de pantalla
5. Envía para revisión (1-7 días)

---

## Solución de Problemas

### "The web assets directory must contain an index.html"

Ejecuta primero:
```bash
npm run build
npx cap sync
```

### "SDK location not found" (Android)

Crea el archivo `android/local.properties`:
```
sdk.dir=/Users/TU_USUARIO/Library/Android/sdk
```

### "No signing certificate" (iOS)

1. Xcode > Preferences > Accounts
2. Añade tu Apple ID
3. Haz clic en "Download Manual Profiles"

### Firebase no conecta

Verifica que las variables de entorno estén configuradas correctamente en `.env`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_DATABASE_URL=...
```

### La app no vibra en iOS

iOS requiere feedback háptico específico. El código ya incluye fallbacks apropiados.

---

## Comandos Útiles

```bash
# Construir y sincronizar
npm run build && npx cap sync

# Abrir proyectos nativos
npx cap open ios
npx cap open android

# Ver logs de iOS
npx cap run ios --livereload

# Ver logs de Android
adb logcat | grep SafeSignal

# Actualizar Capacitor
npm update @capacitor/core @capacitor/cli
npx cap sync
```

---

## Estructura del Proyecto

```
safesignal/
├── client/                 # Código React (frontend)
│   ├── src/
│   │   ├── components/    # Componentes UI
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── lib/           # Firebase, audio, utilidades
│   │   └── pages/         # Páginas de la app
├── server/                # Servidor Express (para desarrollo)
├── shared/                # Tipos compartidos
├── ios/                   # Proyecto Xcode (generado)
├── android/               # Proyecto Android (generado)
├── dist/                  # Build de producción (generado)
├── capacitor.config.ts    # Configuración de Capacitor
└── NATIVE_BUILD_GUIDE.md  # Esta guía
```

---

## Soporte

Si tienes problemas:
1. Revisa la consola de Xcode o Android Studio
2. Verifica los logs de Firebase Console
3. Consulta https://capacitorjs.com/docs

---

*Última actualización: Enero 2026*
