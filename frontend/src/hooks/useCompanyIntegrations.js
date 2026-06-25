import { useState, useEffect } from 'react';

export default function useCompanyIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return { integrations, isLoading };
}
