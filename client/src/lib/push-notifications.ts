import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

let notificationId = 1;
function nextId() { return notificationId++; }

export type NotificationEvent =
  | 'alert_on'
  | 'alert_off'
  | 'acknowledged'
  | 'message'
  | 'partner_joined'
  | 'partner_left';

const NOTIFICATION_CONFIG: Record<NotificationEvent, {
  title: string;
  channelId: string;
  sound: string;
}> = {
  alert_on: {
    title: '🚨 Necesita ayuda ahora',
    channelId: 'alerts',
    sound: 'alert.wav',
  },
  alert_off: {
    title: '💚 Ya está bien',
    channelId: 'general',
    sound: 'notification.wav',
  },
  acknowledged: {
    title: '🤝 Tu pareja está contigo',
    channelId: 'important',
    sound: 'notification.wav',
  },
  message: {
    title: '💬 Nuevo mensaje',
    channelId: 'messages',
    sound: 'notification.wav',
  },
  partner_joined: {
    title: '✅ Se ha conectado',
    channelId: 'general',
    sound: 'notification.wav',
  },
  partner_left: {
    title: '⚠️ Se ha desconectado',
    channelId: 'general',
    sound: 'notification.wav',
  },
};

async function requestWebNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function showNotification(
  event: NotificationEvent,
  body: string,
): Promise<void> {
  const config = NOTIFICATION_CONFIG[event];

  if (Capacitor.isNativePlatform()) {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: nextId(),
            title: config.title,
            body,
            channelId: config.channelId,
            sound: config.sound,
            ...(Capacitor.getPlatform() === 'android' && {
              smallIcon: 'ic_notification',
              iconColor: event === 'alert_on' ? '#E53E3E' : '#6B46C1',
              autoCancel: true,
            }),
          },
        ],
      });
    } catch (error) {
      console.error('Local notification error:', error);
    }
    return;
  }

  // Web fallback
  const granted = await requestWebNotificationPermission();
  if (!granted) return;

  try {
    new Notification(config.title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: event,
      renotify: true,
      requireInteraction: event === 'alert_on',
    });
  } catch (error) {
    console.error('Web notification error:', error);
  }
}

export async function createNotificationChannels(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    // Alertas críticas — máxima importancia, vibración larga, luz roja
    await LocalNotifications.createChannel({
      id: 'alerts',
      name: '🚨 Alertas de crisis',
      description: 'Cuando alguien necesita ayuda urgente',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'alert.wav',
      lights: true,
      lightColor: '#FF0000',
    });

    // Respuestas importantes
    await LocalNotifications.createChannel({
      id: 'important',
      name: '🤝 Respuestas',
      description: 'Cuando tu pareja responde o está contigo',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: 'notification.wav',
      lights: true,
      lightColor: '#00C853',
    });

    // Mensajes
    await LocalNotifications.createChannel({
      id: 'messages',
      name: '💬 Mensajes',
      description: 'Mensajes de tu pareja de apoyo',
      importance: 4,
      vibration: true,
      sound: 'notification.wav',
    });

    // General (conexiones, desconexiones)
    await LocalNotifications.createChannel({
      id: 'general',
      name: 'ℹ️ General',
      description: 'Conexiones y estado general',
      importance: 3,
      vibration: false,
      sound: 'notification.wav',
    });
  } catch (error) {
    console.error('Error creating notification channels:', error);
  }
}

export async function initPushNotifications(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    await requestWebNotificationPermission();
    return null;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return null;

    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value);
      });
      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Push init error:', error);
    return null;
  }
}
