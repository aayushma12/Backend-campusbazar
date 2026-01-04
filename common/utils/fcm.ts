import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function sendPushNotification(fcmToken: string, title: string, body: string, data?: Record<string, any>) {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
    });
  } catch (err) {
    console.error('FCM push error:', err);
  }
}
