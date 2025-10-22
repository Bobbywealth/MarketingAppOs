// OneSignal Push Notification Setup
// https://documentation.onesignal.com/docs/web-sdk-setup

declare global {
  interface Window {
    OneSignalDeferred?: Promise<any>;
    OneSignal?: any;
  }
}

export const initOneSignal = () => {
  // Check if OneSignal is already initialized
  if (window.OneSignalDeferred) {
    console.log('OneSignal already initialized');
    return;
  }

  console.log('Initializing OneSignal...');

  // Initialize OneSignal
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      console.log('OneSignal.init called with App ID:', import.meta.env.VITE_ONESIGNAL_APP_ID || "eb172a4d-b3a3-471a-86a5-f5d0e0aa4e29");
      
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "eb172a4d-b3a3-471a-86a5-f5d0e0aa4e29",
        safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
        notifyButton: {
          enable: false, // We'll use our custom notification bell
        },
        allowLocalhostAsSecureOrigin: true, // For development
      });

      console.log('OneSignal initialized successfully!');

      // Track subscription changes
      OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
        console.log('OneSignal Push subscription changed:', event);
      });
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
    }
  });
};

// Set user ID for targeted notifications (call after login)
export const setOneSignalUserId = (userId: string) => {
  if (window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.login(userId);
      console.log('OneSignal user ID set:', userId);
    });
  }
};

// Remove user ID on logout
export const logoutOneSignal = () => {
  if (window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.logout();
      console.log('OneSignal user logged out');
    });
  }
};

// Send a tag to OneSignal (for segmentation)
export const setOneSignalTag = (key: string, value: string) => {
  if (window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.User.addTag(key, value);
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          const permission = await OneSignal.Notifications.requestPermission();
          console.log('Notification permission:', permission);
          resolve(permission);
        } catch (error) {
          console.error('Failed to request notification permission:', error);
          resolve(false);
        }
      });
    } else {
      console.warn('OneSignal not initialized');
      resolve(false);
    }
  });
};

