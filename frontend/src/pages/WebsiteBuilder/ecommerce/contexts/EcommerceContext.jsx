import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTemplates } from '../utils/storage';

export const EcommerceContext = createContext();

export const EcommerceProvider = ({ children }) => {
  const [websiteId, setWebsiteId] = useState(localStorage.getItem('ecommerce_websiteId') || '');
  const [websites, setWebsites] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('ecommerce_workspaceId') || 'default');
  const [allTemplates, setAllTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(localStorage.getItem('ecommerce_activeTemplateId') || '');

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/websites", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : ""
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          const ecommWebsites = data.data.filter(w => w.isEcommerce === true);
          setWebsites(ecommWebsites);

          const currentId = localStorage.getItem('ecommerce_websiteId');
          const isValidWebsiteId = currentId && ecommWebsites.some(w => w._id === currentId);

          if ((!currentId || !isValidWebsiteId) && ecommWebsites.length > 0) {
            const firstId = ecommWebsites[0]._id;
            setWebsiteId(firstId);
            localStorage.setItem('ecommerce_websiteId', firstId);
          } else if (!isValidWebsiteId && ecommWebsites.length === 0) {
            setWebsiteId('');
            localStorage.removeItem('ecommerce_websiteId');
          }
        }
      } catch (err) {
        console.error("Failed to fetch websites for ecommerce context", err);
      }
    };
    fetchWebsites();
  }, []);

  useEffect(() => {
    if (workspaceId && websiteId) {
      getTemplates(workspaceId, websiteId).then(templatesDict => {
        const templatesArr = Object.values(templatesDict);
        setAllTemplates(templatesArr);
        
        const currentId = localStorage.getItem('ecommerce_activeTemplateId');
        if (currentId && templatesArr.some(t => t.id === currentId)) {
          setActiveTemplateId(currentId);
        } else if (templatesArr.length > 0) {
          setActiveTemplateId(templatesArr[0].id);
          localStorage.setItem('ecommerce_activeTemplateId', templatesArr[0].id);
        } else {
          setActiveTemplateId('');
          localStorage.removeItem('ecommerce_activeTemplateId');
        }
      });
    }
  }, [workspaceId, websiteId]);

  const changeTemplate = (id) => {
    setActiveTemplateId(id);
    localStorage.setItem('ecommerce_activeTemplateId', id);
    window.dispatchEvent(new CustomEvent('ecommerce_template_changed', { detail: { templateId: id } }));
  };

  const changeWebsite = (id) => {
    setWebsiteId(id);
    localStorage.setItem('ecommerce_websiteId', id);
    window.dispatchEvent(new CustomEvent('ecommerce_website_changed', { detail: { websiteId: id } }));
  };

  return (
    <EcommerceContext.Provider value={{ 
      workspaceId, 
      websiteId, 
      websites, 
      changeWebsite,
      allTemplates,
      activeTemplateId,
      changeTemplate
    }}>
      {children}
    </EcommerceContext.Provider>
  );
};

export const useEcommerce = () => useContext(EcommerceContext);
