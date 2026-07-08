import React, { createContext, useContext, useState, useCallback } from 'react';

const ContentModuleContext = createContext();

export const ContentModuleProvider = ({ children }) => {
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshContent = useCallback(() => {
    setRefreshToken(prev => prev + 1);
  }, []);

  return (
    <ContentModuleContext.Provider value={{ refreshToken, refreshContent }}>
      {children}
    </ContentModuleContext.Provider>
  );
};

export const useContentModule = () => useContext(ContentModuleContext);
