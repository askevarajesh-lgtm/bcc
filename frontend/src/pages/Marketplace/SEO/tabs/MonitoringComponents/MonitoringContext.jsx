import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { seoWorkspaceApi } from '../../../../../api/seoWorkspaceApi';
import { message } from 'antd';

const MonitoringContext = createContext(null);

export const MonitoringProvider = ({ children, project }) => {
  const { projectId } = useParams();
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectId || project?._id || localStorage.getItem('seo_active_project_id') || '507f1f77bcf86cd799439011'
  );
  const [projectsList, setProjectsList] = useState([]);
  
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [scanStatus, setScanStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Sync if project prop or URL param changes
  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
    else if (project?._id) setSelectedProjectId(project._id);
  }, [projectId, project?._id]);

  // Load projects list
  useEffect(() => {
    seoWorkspaceApi.getProjects()
      .then(res => {
        const list = res.data || [];
        setProjectsList(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchSnapshot = useCallback(async () => {
    const targetId = selectedProjectId || '507f1f77bcf86cd799439011';
    try {
      setLoading(true);
      const data = await seoWorkspaceApi.getMonitoringDashboard(targetId);
      setSnapshot(data.data || data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitoring snapshot:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const triggerScan = async () => {
    const targetId = selectedProjectId || '507f1f77bcf86cd799439011';
    try {
      setIsScanning(true);
      const res = await seoWorkspaceApi.triggerMonitoringScan(targetId);
      if (res.data?.alreadyRunning) {
        message.info(`Scan already in progress. Progress: ${res.data.progress || 0}%`);
        setScanStatus(res.data);
      } else {
        message.success('11-Plugin SEO Monitoring scan initiated');
        setScanStatus(res.data);
      }
      
      if (res.data?.scanId) {
        pollScanStatus(res.data.scanId);
      } else {
        setTimeout(() => {
          setIsScanning(false);
          fetchSnapshot();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Failed to trigger scan');
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (scanId) => {
    const targetId = selectedProjectId || '507f1f77bcf86cd799439011';
    const interval = setInterval(async () => {
      try {
        const res = await seoWorkspaceApi.getMonitoringScanStatus(targetId, scanId);
        setScanStatus(res.data);
        if (res.data?.status === 'Completed' || res.data?.status === 'Failed') {
          clearInterval(interval);
          setIsScanning(false);
          if (res.data?.status === 'Completed') {
            message.success('11-Plugin SEO Scan completed successfully');
            fetchSnapshot();
          } else {
            message.error(`Scan failed: ${res.data?.error || 'Unknown error'}`);
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 3000);
  };

  const value = {
    activeProjectId: selectedProjectId || '507f1f77bcf86cd799439011',
    setProjectId: setSelectedProjectId,
    projects: projectsList,
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

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    return {
      activeProjectId: '507f1f77bcf86cd799439011',
      setProjectId: () => {},
      projects: [],
      snapshot: null,
      loading: false,
      error: null,
      refresh: () => {},
      triggerScan: () => {},
      isScanning: false,
      scanStatus: null
    };
  }
  return context;
};
