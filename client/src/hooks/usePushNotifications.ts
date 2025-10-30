import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        // Test if the subscription is still valid by checking the endpoint
        console.log('Found existing subscription:', existingSubscription.endpoint);
        setIsSubscribed(true);
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }

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
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "You need to allow notifications to receive push updates",
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
      await apiRequest('POST', '/api/push/subscribe', {
        subscription: pushSubscription.toJSON(),
      });

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
      await apiRequest('POST', '/api/push/unsubscribe', {
        endpoint: subscription.endpoint,
      });

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

