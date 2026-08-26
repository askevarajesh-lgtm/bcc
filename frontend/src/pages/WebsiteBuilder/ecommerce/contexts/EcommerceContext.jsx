import React, { createContext, useContext, useState, useEffect } from 'react';

export const EcommerceContext = createContext();

export const EcommerceProvider = ({ children }) => {
  const [websiteId, setWebsiteId] = useState(localStorage.getItem('ecommerce_websiteId') || '');
  const [websites, setWebsites] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('ecommerce_workspaceId') || 'default');

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
          setWebsites(data.data);

          const currentId = localStorage.getItem('ecommerce_websiteId');
          const isValidWebsiteId = currentId && data.data.some(w => w._id === currentId);

          if ((!currentId || !isValidWebsiteId) && data.data.length > 0) {
            const firstId = data.data[0]._id;
            setWebsiteId(firstId);
            localStorage.setItem('ecommerce_websiteId', firstId);
          } else if (!isValidWebsiteId && data.data.length === 0) {
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

  const changeWebsite = (id) => {
    setWebsiteId(id);
    localStorage.setItem('ecommerce_websiteId', id);
    window.dispatchEvent(new CustomEvent('ecommerce_website_changed', { detail: { websiteId: id } }));
  };

  return (
    <EcommerceContext.Provider value={{ workspaceId, websiteId, websites, changeWebsite }}>
      {children}
    </EcommerceContext.Provider>
  );
};

export const useEcommerce = () => useContext(EcommerceContext);
