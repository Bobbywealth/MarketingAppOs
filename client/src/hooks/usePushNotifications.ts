import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type UsePushNotificationsOptions = {
  /**
   * When false, the hook will NOT attempt to sync subscriptions with the server.
   * Use this to prevent 401 spam on public (logged-out) pages.
   */
  enabled?: boolean;
};

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const enabled = options.enabled ?? true;
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const syncSubscriptionToServer = useCallback(
    async (sub: PushSubscription) => {
      if (!enabled) return;
      try {
        await apiRequest('POST', '/api/push/subscribe', {
          subscription: sub.toJSON(),
        });
      } catch (e) {
        // Don't toast here (it can be noisy on load); just log.
        console.warn('Failed to sync existing push subscription to server:', e);
      }
    },
    [enabled],
  );

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        // We have a browser subscription. Ensure the server also has it stored.
        console.log('Found existing subscription:', existingSubscription.endpoint);
        setIsSubscribed(true);
        setSubscription(existingSubscription);
        // Only sync to server when enabled (i.e., logged-in). This prevents 401 spam on public pages.
        await syncSubscriptionToServer(existingSubscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }

  // If we discovered an existing browser subscription while logged out,
  // sync it once auth becomes available.
  useEffect(() => {
    if (!enabled) return;
    if (!subscription) return;
    syncSubscriptionToServer(subscription);
  }, [enabled, subscription, syncSubscriptionToServer]);

  async function forceResubscribe() {
    try {
      // First unsubscribe completely
      await unsubscribe();
      
      // Clear the state
      setIsSubscribed(false);
      setSubscription(null);
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Subscribe again
      return await subscribe();
    } catch (error) {
      console.error('Error in force resubscribe:', error);
      return false;
    }
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function subscribe() {
    if (!enabled) {
      toast({
        title: "Login required",
        description: "Please log in to enable push notifications on this device.",
        variant: "destructive",
      });
      return false;
    }
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    try {
      // Check current permission state
      const currentPermission = Notification.permission;
      console.log('🔔 Current notification permission:', currentPermission);
      
      // If already denied, show helpful message
      if (currentPermission === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your device settings: Settings → Notifications → Marketing Team App",
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
      
      // Request notification permission
      console.log('📱 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('✅ Permission result:', permission);
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "You need to allow notifications to receive push updates. Check Settings → Notifications → Marketing Team App",
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }

      // Get VAPID public key from server
      const response = await apiRequest('GET', '/api/push/vapid-public-key', undefined);
      const { publicKey } = await response.json();

      if (!publicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await syncSubscriptionToServer(pushSubscription);

      setIsSubscribed(true);
      setSubscription(pushSubscription);

      toast({
        title: "✅ Subscribed!",
        description: "You'll now receive push notifications",
      });

      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Could not subscribe to push notifications",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  }

  async function unsubscribe() {
    if (!subscription) return false;

    setLoading(true);

    try {
      // Unsubscribe from push notifications
      await subscription.unsubscribe();

      // Remove subscription from server
      if (enabled) {
        await apiRequest('POST', '/api/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      setSubscription(null);

      toast({
        title: "Unsubscribed",
        description: "You won't receive push notifications anymore",
      });

      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "Unsubscribe Failed",
        description: error.message || "Could not unsubscribe from push notifications",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  }

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    forceResubscribe,
  };
}

