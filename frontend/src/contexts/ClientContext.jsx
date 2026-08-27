import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const { role } = useAuth();
  const [selectedClient, setSelectedClient] = useState(() => {
    const saved = localStorage.getItem('selectedClient');
    return saved ? JSON.parse(saved) : null;
  });
  const [agencyClients, setAgencyClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    // Only fetch clients for agency roles
    const agencyRoles = ['agency_super_admin', 'agency_manager', 'agency', 'commander_admin'];
    if (agencyRoles.includes(role)) {
      fetchClients();
    }
  }, [role]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const res = await api.get('/brands');
      if (res.data?.success) {
        setAgencyClients(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch agency clients:", e);
    } finally {
      setLoadingClients(false);
    }
  };

  const switchClient = (client) => {
    setSelectedClient(client);
    if (client) {
      localStorage.setItem('selectedClient', JSON.stringify(client));
    } else {
      localStorage.removeItem('selectedClient');
    }
    // Dispatch an event so other components or interceptors can react if needed
    window.dispatchEvent(new Event('client-switched'));
  };

  return (
    <ClientContext.Provider value={{ selectedClient, switchClient, agencyClients, setAgencyClients, loadingClients }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => useContext(ClientContext);
