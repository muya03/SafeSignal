# Guía de Construcción de SafeSignal para Android e iOS

Esta guía explica cómo compilar SafeSignal como aplicación nativa para Android e iOS usando Capacitor.

## Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Construcción para Android](#construcción-para-android)
4. [Construcción para iOS](#construcción-para-ios)
5. [Solución de Problemas](#solución-de-problemas)

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

### 1. Instalar dependencias

```bash
cd safesignal
npm install
```

### 2. Construir la aplicación web

```bash
npm run build
```

Esto creará la carpeta `dist` con los archivos compilados.

### 3. Añadir plataformas nativas

```bash
# Para iOS (en Mac)
npx cap add ios

# Para Android
npx cap add android
```

### 4. Sincronizar el código

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

*Última actualización: Enero 2026*
