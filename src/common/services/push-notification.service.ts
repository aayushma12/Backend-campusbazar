import admin from 'firebase-admin';
import { UserModel } from '../../features/auth/entity/user.model';

let isInitialized = false;
let initializationFailed = false;

function ensureFirebaseInitialized() {
  if (initializationFailed) return;
  if (isInitialized) return;
  if (admin.apps.length > 0) {
    isInitialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    initializationFailed = true;
    console.warn('FCM is disabled: missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
    return;
  }

  const isPlaceholderKey = privateKey.includes('YOUR_PRIVATE_KEY') || privateKey.includes('your_private_key');
  if (isPlaceholderKey) {
    initializationFailed = true;
    console.warn('FCM is disabled: FIREBASE_PRIVATE_KEY appears to be a placeholder value');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    isInitialized = true;
  } catch (error) {
    initializationFailed = true;
    console.warn('FCM initialization failed. Push notifications will be skipped:', error);
  }
}

export class PushNotificationService {
  async sendToUser(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<boolean> {
    ensureFirebaseInitialized();
    if (!isInitialized) return false;

    const user = await UserModel.findById(params.userId).select('fcmToken pushNotificationsEnabled');
    if (!user || !user.pushNotificationsEnabled || !user.fcmToken) {
      return false;
    }

    try {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data,
      });
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }
}
