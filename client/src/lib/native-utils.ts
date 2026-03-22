import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }[style];

    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Haptic error:', error);
  }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const notificationType = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    }[type];

    await Haptics.notification({ type: notificationType });
  } catch (error) {
    console.error('Haptic error:', error);
  }
}

export async function hapticVibrate(duration: number = 300): Promise<void> {
  if (!isNativePlatform()) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
    return;
  }

  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.error('Vibrate error:', error);
  }
}

export async function setStatusBarStyle(isDark: boolean): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ 
        color: isDark ? '#1F2937' : '#F3E8FF' 
      });
    }
  } catch (error) {
    console.error('StatusBar error:', error);
  }
}

export async function hideStatusBar(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.hide();
  } catch (error) {
    console.error('StatusBar hide error:', error);
  }
}

export async function showStatusBar(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.show();
  } catch (error) {
    console.error('StatusBar show error:', error);
  }
}

export function setupAppListeners(callbacks: {
  onResume?: () => void;
  onPause?: () => void;
  onBackButton?: () => boolean;
}): () => void {
  if (!isNativePlatform()) {
    return () => {};
  }

  const listeners: (() => void)[] = [];

  if (callbacks.onResume) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        callbacks.onResume?.();
      } else {
        callbacks.onPause?.();
      }
    }).then(handle => {
      listeners.push(() => handle.remove());
    });
  }

  if (callbacks.onBackButton && Capacitor.getPlatform() === 'android') {
    App.addListener('backButton', ({ canGoBack }) => {
      const handled = callbacks.onBackButton?.();
      if (!handled && canGoBack) {
        window.history.back();
      }
    }).then(handle => {
      listeners.push(() => handle.remove());
    });
  }

  return () => {
    listeners.forEach(remove => remove());
  };
}
