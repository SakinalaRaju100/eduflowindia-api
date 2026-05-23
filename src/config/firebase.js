import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config();

let firebaseApp;

function initFirebase() {
  if (admin.apps.length) return admin.apps[0];

  let credential;

  // Option 1: Service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const path = resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = JSON.parse(readFileSync(path, "utf8"));
      credential = admin.credential.cert(serviceAccount);
      console.log("✅ Firebase initialized via service account file");
    } catch (err) {
      console.warn("⚠️  Could not load service account file:", err.message);
    }
  }

  // Option 2: Individual environment variables
  if (!credential && process.env.FIREBASE_PROJECT_ID) {
    credential = admin.credential.cert({
      projectId:
        process.env.REACT_APP_FIREBASE_PROJECT_ID || "rajuproject1-1b60f",
      clientEmail:
        process.env.FIREBASE_CLIENT_EMAIL ||
        "firebase-adminsdk-ru0ge@rajuproject1-1b60f.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfhi/Pni6VDQ/z\nMDyXN3zmGI08DP7HAwyKjoqUtCPgjOaKXsCCGrBq9AIlMnwxWcFanjKc08t9ZTTg\nPPlI/XS8pBGPZkFqrifNnSCP4ISv52fzUwzxmLtp7rCpu4ucI1+zHJmjRrhrbB6D\ni2uJmQt3sEeEefhLnllFPkwO6gt5RmQppYJ7BQTS1g+5YvmOEQEuwGeHdQh109dk\nKnC0pLLkZTYuI5IWPL3jOZoU083vnQKdawx1ueToL9YvGq4B/wTkxXl2xKZbkZHU\nFAeiEMgjPmwNfSpJlDDTxxDhVYZUKC5E0K6H1HLpVPBVgG4v8dQa5ffC8MePqk9w\n0xljWWFfAgMBAAECggEAOsy51wvthRgikf6mccEPAhiDTsC8ZO3QZsKIggXBSljG\nbK/wRElxDzGRPufA89qAmq3y8n5kkWAGQNbJXQIPq3AdjnN/0ehuYBBteGu/e+aL\n2d6HESb0ZjF8F6pWV4SWsC9d2y3HZbrTbBdI+rFf6uRca+UKBBprsWNp7qJy0jvM\nErpbsln3YHberG6X0QpRRnwsWHeDp/T7jnWajnh802x+xu66oGEKPgzdkUn8Lalh\nkCdby7ypk5jZT+JjXyjzK1/VL90QpnuAcQyY1C3DOzjvaNMHEXBxEW+o9crC5h1F\nH5qal3vIWMbJsP2DLkgOZsXawsPVuYxbpzBgGSgDQQKBgQD+xWaNiUEBjS+92vCg\nBcRWE8qE4m/F0MYheytXR9RArE+e0BdOFgSs7t8COYmI80G6H48kzbUF1KdA/Zgi\n59JwECEjqwD8zViHgCBRgYLWMFYszuUqHgb7GiFeyrCb2cwnnoYhvWa0xfKid8g3\nMzPVqMwYoXchukgu1RGwGJS3GwKBgQDgmjOTdrr1dLfLlU966zkIdxA3KBx7jf+F\noP2KN+frF8C9cv4bJi2xOG+Q4AxqaTUpdre7qCGKX2gUSqOjbpJ4uyzweDgShC64\npjN5xL99oqjkGpApcaWk41U8o7czKqWC1dAKj+M7Zc1rVIZg3XOPRbpWvyKQm7zO\n8dIr+MyPDQKBgAzx9s4GRVlQ1TYuY7+dy2YcR1QNNWS1wPt+iKs8qRpIJxuIs0Zy\nc/ZdhNNWHRjqU1Kju+BA24vaTE1PFWXgpZ6wEx7+12QBAxiPeBTsIbvEZPyN3rMP\nJ4emwj9QyTyCCo+QzHv2ZbuVu0hqEbBMV7vpgcVWnvkFwBkxFl7+QMA1AoGBAIg6\nPyokC4WxQ4FBkLGXVkJiJP2vYIc4O1GLsfxRqGMZRxghVSqWX4RsHI8ctasdINeD\nYDF76swIzhHwq4wHFuQPc1RvNmNUtRneBL7IrPTA4ftoeSQKAFQgZqSfEBECvty6\nXrLpTwPJ3WxKGi9KYjr2Ke1PhOF89Gn4lmeBQmFJAoGBAKhLMRlUj5i+GWgbJBNR\nk8VKwzmIGPlANp6kys8+3SKDDnSYBNcnCwaERLksCcXIwxhsokA9JZZgrSzF0Il/\nMWMoqmPuEknPHNyaPgQ7h1Ya4k8D1FHRRI5xxFnmwyWjvzvaluV4LawPQsj2KLnH\nOpxsAU8IuHKGZEBclV/T3FXW\n-----END PRIVATE KEY-----\n".replace(
          /\\n/g,
          "\n",
        ),
    });
    console.log("✅ Firebase initialized via environment variables");
  }

  if (!credential) {
    console.warn(
      "⚠️  Firebase not configured — push notifications will be simulated",
    );
    return null;
  }

  firebaseApp = admin.initializeApp({ credential });
  return firebaseApp;
}

initFirebase();

/**
 * Send a push notification to a single FCM token.
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
export async function sendPushNotification({ token, title, body, data = {} }) {
  if (!admin.apps.length) {
    console.log(
      `[SIMULATED] Push → token:${token?.slice(0, 12)}… title:"${title}" body:"${body}"`,
    );
    return { success: true, messageId: "simulated-" + Date.now() };
  }

  if (!token) {
    return { success: false, error: "No FCM token for this user" };
  }

  try {
    const messageId = await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
      webpush: {
        notification: {
          title,
          body,
          // icon: "/logo192.png",
          // badge: "/badge.png",
          requireInteraction: true,
        },
        fcmOptions: { link: "/" },
      },
    });
    return { success: true, messageId };
  } catch (err) {
    console.error("FCM send error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send to multiple tokens (multicast).
 */
export async function sendMulticast({ tokens, title, body, data = {} }) {
  if (!tokens?.length) return { successCount: 0, failureCount: 0, results: [] };

  if (!admin.apps.length) {
    console.log(
      `[SIMULATED] Multicast → ${tokens.length} tokens, title:"${title}"`,
    );
    return {
      successCount: tokens.length,
      failureCount: 0,
      results: tokens.map(() => ({
        success: true,
        messageId: "sim-" + Date.now(),
      })),
    };
  }

  const message = {
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    ),
    webpush: {
      notification: {
        title,
        body,
        icon: "/logo192.png",
        requireInteraction: true,
      },
      fcmOptions: { link: "/" },
    },
    tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    results: response.responses.map((r) => ({
      success: r.success,
      messageId: r.messageId,
      error: r.error?.message,
    })),
  };
}

export default admin;
