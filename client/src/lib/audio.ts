import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGsjGjRrkMTTq2c5ImN9ssjVu35JN1d4pMjOr4RaRVqHn8O9n4BiTGqRp8C1kG9YV3mQqLelhn1rZHqKnKqfin91c3qEjJGNhX59fn+CgoF9fX1+gYOCgH5+fn+BgoJ/fn5/gIGBgH9/f4CBgYB/f3+AgYGAgH9/gICBgYCAf3+AgIGBgIB/f4CAgYGAgH9/gICBgYCAf3+AgIGBgH+Af4CAgYB/gH+AgICAgH+Af4CAgICAf4B/gICAgIB/gH+AgICAgH+Af4CAgICAgH+AgICAgICAf4CAgICAgIB/gICAgICAgH+AgICAgICAgICAgICAgICAf4CAgICAgICAgICAgICAgIB/gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

let audioContext: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;

async function initAudio() {
  if (audioContext) return;
  
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const response = await fetch(NOTIFICATION_SOUND_URL);
    const arrayBuffer = await response.arrayBuffer();
    notificationBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.log("Using generated tone for notification");
  }
}

export async function playNotificationSound() {
  try {
    await initAudio();
    
    if (!audioContext) return;
    
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
}

export async function triggerVibration() {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
      await Haptics.vibrate({ duration: 300 });
    } catch (error) {
      console.error("Haptics error:", error);
      fallbackVibration();
    }
  } else {
    fallbackVibration();
  }
}

function fallbackVibration() {
  if ("vibrate" in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }
}

export async function triggerAlertHaptic() {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
      await Haptics.vibrate({ duration: 500 });
    } catch (error) {
      console.error("Haptics error:", error);
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    }
  } else {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }
}

export async function triggerSuccessHaptic() {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error("Haptics error:", error);
    }
  }
}

export async function triggerButtonHaptic() {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error("Haptics error:", error);
    }
  }
}
