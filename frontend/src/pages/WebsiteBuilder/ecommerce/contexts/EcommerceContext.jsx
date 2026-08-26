import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTemplates } from '../utils/storage';

export const EcommerceContext = createContext();

// Decode workspaceId from JWT stored in localStorage
const getWorkspaceIdFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.workspaceId || null;
  } catch {
    return null;
  }
};

export const EcommerceProvider = ({ children }) => {
  const [websiteId, setWebsiteId] = useState(localStorage.getItem('ecommerce_websiteId') || '');
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('ecommerce_workspaceId') || '');
  const [websites, setWebsites] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(localStorage.getItem('ecommerce_activeTemplateId') || '');

  // Fetch websites to get websiteId and workspaceId for backend ownership checks
  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/websites', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
          const allWebsites = data.data.filter(w => !w.isDeleted);
          setWebsites(allWebsites);

          // Determine workspaceId: prefer JWT > website field > localStorage
          const jwtWorkspaceId = getWorkspaceIdFromToken();
          const resolvedWorkspaceId =
            jwtWorkspaceId ||
            (allWebsites[0]?.workspaceId?.toString()) ||
            localStorage.getItem('ecommerce_workspaceId') ||
            '';

          if (resolvedWorkspaceId) {
            setWorkspaceId(resolvedWorkspaceId);
            localStorage.setItem('ecommerce_workspaceId', resolvedWorkspaceId);
          }

          // Use the persisted websiteId if still valid, else default to first website
          const savedWebsiteId = localStorage.getItem('ecommerce_websiteId');
          const isValidSaved = savedWebsiteId && allWebsites.some(w => w._id === savedWebsiteId);

          if (!isValidSaved) {
            const firstId = allWebsites[0]._id;
            setWebsiteId(firstId);
            localStorage.setItem('ecommerce_websiteId', firstId);
          }
        } else {
          // No websites available: try to get workspaceId from JWT at minimum
          const jwtWorkspaceId = getWorkspaceIdFromToken();
          if (jwtWorkspaceId) {
            setWorkspaceId(jwtWorkspaceId);
            localStorage.setItem('ecommerce_workspaceId', jwtWorkspaceId);
          }
        }
      } catch (err) {
        console.error('EcommerceContext: Failed to fetch websites', err);
        // Fallback to JWT workspaceId
        const jwtWorkspaceId = getWorkspaceIdFromToken();
        if (jwtWorkspaceId) {
          setWorkspaceId(jwtWorkspaceId);
        }
      }
    };
    fetchWebsites();
  }, []);

  // Load ecommerce stores (templates) from IndexedDB whenever websiteId/workspaceId changes
  useEffect(() => {
    if (!workspaceId || !websiteId) return;

    const loadTemplates = async () => {
      try {
        const templatesDict = await getTemplates(workspaceId, websiteId);
        const templatesArr = Object.values(templatesDict);
        setAllTemplates(templatesArr);

        const currentId = localStorage.getItem('ecommerce_activeTemplateId');
        const isCurrentValid = currentId && templatesArr.some(t => t.id === currentId);

        if (isCurrentValid) {
          setActiveTemplateId(currentId);
        } else if (templatesArr.length > 0) {
          const firstId = templatesArr[0].id;
          setActiveTemplateId(firstId);
          localStorage.setItem('ecommerce_activeTemplateId', firstId);
        } else {
          setActiveTemplateId('');
          localStorage.removeItem('ecommerce_activeTemplateId');
        }
      } catch (err) {
        console.error('EcommerceContext: Failed to load templates', err);
      }
    };

    loadTemplates();

    // Listen for template save events (e.g. after Store Builder saves a new store)
    const handleTemplateUpdate = () => loadTemplates();
    window.addEventListener('ecommerce_templates_updated', handleTemplateUpdate);
    return () => window.removeEventListener('ecommerce_templates_updated', handleTemplateUpdate);
  }, [workspaceId, websiteId]);

  const changeTemplate = (id) => {
    setActiveTemplateId(id);
    localStorage.setItem('ecommerce_activeTemplateId', id);
    // Broadcast to all admin components to reload their data
    window.dispatchEvent(new CustomEvent('ecommerce_store_changed', { detail: { storeId: id } }));
  };

  const changeWebsite = (id) => {
    setWebsiteId(id);
    localStorage.setItem('ecommerce_websiteId', id);
  };

  // Reload templates list (called after a new store is saved)
  const reloadTemplates = async () => {
    if (!workspaceId || !websiteId) return;
    try {
      const templatesDict = await getTemplates(workspaceId, websiteId);
      const templatesArr = Object.values(templatesDict);
      setAllTemplates(templatesArr);
    } catch (err) {
      console.error('EcommerceContext: Failed to reload templates', err);
    }
  };

  return (
    <EcommerceContext.Provider value={{
      workspaceId,
      websiteId,
      websites,
      changeWebsite,
      allTemplates,
      activeTemplateId,
      activeStoreId: activeTemplateId, // alias for clarity
      changeTemplate,
      reloadTemplates
    }}>
      {children}
    </EcommerceContext.Provider>
  );
};

export const useEcommerce = () => useContext(EcommerceContext);
