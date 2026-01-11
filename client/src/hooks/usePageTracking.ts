import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { resolveApiUrl } from '@/lib/api';

// Generate a session ID that persists for the browser session
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session', sessionId);
  }
  return sessionId;
}

// Track page view to backend
async function trackPageView(page: string) {
  try {
    await fetch(resolveApiUrl('/api/track/pageview'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        referrer: document.referrer || 'Direct',
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
      })
    });
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
}

// Hook to automatically track page views
export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);
}

