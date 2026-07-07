import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../services/api';
import { message } from 'antd';

const AIStudioContext = createContext();

export const useAIStudio = () => useContext(AIStudioContext);

export const AIStudioProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('design');
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('ai_studio_api_key') || '');
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('ai_studio_api_key', key);
    message.success('API Key saved successfully');
  };

  const fetchAssets = async () => {
    try {
      setLoadingAssets(true);
      const response = await api.get('/ai-studio/assets');
      if (response.data.success) {
        setAssets(response.data.data.assets);
      }
    } catch (error) {
      console.error('Failed to fetch AI assets', error);
      message.error('Failed to load Asset Library');
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const saveAsset = async (type, prompt, url) => {
    try {
      const response = await api.post('/ai-studio/assets', { type, prompt, url });
      if (response.data.success) {
        message.success('Asset saved to library');
        fetchAssets(); // Refresh assets
        return true;
      }
    } catch (error) {
      console.error('Failed to save asset', error);
      message.error('Failed to save asset');
      return false;
    }
  };

  const deleteAsset = async (id) => {
    try {
      const response = await api.delete(`/ai-studio/assets/${id}`);
      if (response.data.success) {
        message.success('Asset deleted');
        fetchAssets(); // Refresh assets
        return true;
      }
    } catch (error) {
      console.error('Failed to delete asset', error);
      message.error('Failed to delete asset');
      return false;
    }
  };

  return (
    <AIStudioContext.Provider
      value={{
        activeTab,
        setActiveTab,
        assets,
        loadingAssets,
        fetchAssets,
        saveAsset,
        deleteAsset,
        apiKey,
        saveApiKey,
        isApiKeyModalVisible,
        setIsApiKeyModalVisible
      }}
    >
      {children}
    </AIStudioContext.Provider>
  );
};
