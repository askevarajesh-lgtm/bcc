import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';
import { message } from 'antd';

const MonitoringContext = createContext(null);

export const MonitoringProvider = ({ children, project }) => {
  const { projectId } = useParams();
  const activeProjectId = projectId || project?._id;
  
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [scanStatus, setScanStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      setLoading(true);
      const data = await seoWorkspaceApi.getMonitoringDashboard(activeProjectId);
      setSnapshot(data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitoring snapshot:', err);
      setError(err.response?.data?.error || err.message);
      message.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const triggerScan = async () => {
    try {
      setIsScanning(true);
      const res = await seoWorkspaceApi.triggerMonitoringScan(activeProjectId);
      if (res.data.alreadyRunning) {
        message.success(`Scan already running. Progress: ${res.data.progress}%`);
        setScanStatus(res.data);
      } else {
        message.success('Monitoring scan started');
        setScanStatus(res.data);
      }
      
      // Poll for completion (simplified)
      pollScanStatus(res.data.scanId);
    } catch (err) {
      console.error(err);
      message.error('Failed to trigger scan');
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (scanId) => {
    const interval = setInterval(async () => {
      try {
        const res = await seoWorkspaceApi.getMonitoringScanStatus(activeProjectId, scanId);
        setScanStatus(res.data);
        if (res.data.status === 'Completed' || res.data.status === 'Failed') {
          clearInterval(interval);
          setIsScanning(false);
          if (res.data.status === 'Completed') {
            message.success('Scan completed successfully');
            fetchSnapshot(); // Reload data
          } else {
            message.error(`Scan failed: ${res.data.error}`);
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 3000);
  };

  const value = {
    snapshot,
    loading,
    error,
    refresh: fetchSnapshot,
    triggerScan,
    isScanning,
    scanStatus
  };

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => useContext(MonitoringContext);
