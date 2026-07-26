import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getLocalBootstrapCache, setLocalBootstrapCache, fetchServerBootstrapData } from '../services/bootstrapService';
import { getMemberSession } from '../services/authSession';

const AppBootstrapContext = createContext(null);

export function AppBootstrapProvider({ children }) {
  const email = getMemberSession()?.email || '';
  // Synchronous 0ms initial hydration from local cache
  const [bootstrap, setBootstrap] = useState(() => getLocalBootstrapCache(email));
  const [loading, setLoading] = useState(!bootstrap);
  const [error, setError] = useState(null);

  // Background SWR Revalidation
  const revalidate = useCallback(async (isInitial = false) => {
    try {
      if (isInitial && !bootstrap) setLoading(true);
      const data = await fetchServerBootstrapData({ email });
      if (data) {
        setBootstrap(data);
        setError(null);
      }
    } catch (err) {
      console.error('[Bootstrap SWR Revalidation Error]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bootstrap, email]);

  useEffect(() => {
    revalidate(true);
  }, []);

  // Method to patch local state instantly (Optimistic UI updates)
  const patchBootstrap = useCallback((updater) => {
    setBootstrap(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      setLocalBootstrapCache(next, null, email);
      return next;
    });
  }, [email]);

  const value = {
    bootstrap,
    bio: bootstrap?.bio || null,
    wallet: bootstrap?.wallet || { balance: 0, currency: 'JOY', hasPin: false },
    workspace: bootstrap?.workspace || { installedApps: [], homeScreenApps: [] },
    notifications: bootstrap?.notifications || { unreadCount: 0, recent: [] },
    recentContacts: bootstrap?.recentContacts || [],
    loading,
    error,
    refreshBootstrap: revalidate,
    patchBootstrap
  };

  return (
    <AppBootstrapContext.Provider value={value}>
      {children}
    </AppBootstrapContext.Provider>
  );
}

export function useAppBootstrap() {
  const context = useContext(AppBootstrapContext);
  if (!context) {
    // Graceful fallback for components outside provider
    return {
      bootstrap: null,
      bio: null,
      wallet: { balance: 0, currency: 'JOY', hasPin: false },
      workspace: { installedApps: [], homeScreenApps: [] },
      notifications: { unreadCount: 0, recent: [] },
      recentContacts: [],
      loading: false,
      error: null,
      refreshBootstrap: () => {},
      patchBootstrap: () => {}
    };
  }
  return context;
}
