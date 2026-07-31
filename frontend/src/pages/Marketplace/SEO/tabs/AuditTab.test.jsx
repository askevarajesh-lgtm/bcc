import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import AuditTab from './AuditTab';
import { seoWorkspaceApi } from '../../../../api/seoWorkspaceApi';

// Mock dependencies
vi.mock('../../../../api/seoWorkspaceApi', () => ({
  seoWorkspaceApi: {
    getAudits: vi.fn().mockResolvedValue([]),
    runAuditorAgent: vi.fn(),
    getAuditStatus: vi.fn()
  }
}));

// Mock ProjectSelector to always trigger onChange with a fake project ID on render
vi.mock('../components/shared/ProjectSelector', () => {
  return {
    default: function MockProjectSelector({ onChange }) {
      React.useEffect(() => {
        onChange('mock-project-id');
      }, []);
      return <div data-testid="project-selector">Project Selector</div>;
    }
  };
});

describe('AuditTab Polling Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should only start polling after a successful audit start', async () => {
    seoWorkspaceApi.runAuditorAgent.mockResolvedValue({ status: 'queued', jobId: 'job123' });
    
    render(<AuditTab />);
    
    // Ensure API is not polled initially
    vi.advanceTimersByTime(2000);
    expect(seoWorkspaceApi.getAuditStatus).not.toHaveBeenCalled();

    // Click Run New Audit
    const runBtn = await screen.findByRole('button', { name: /Run New Audit/i });
    
    await act(async () => {
      fireEvent.click(runBtn);
    });

    // Wait for the async runAuditorAgent to finish and set state
    await waitFor(() => {
      expect(seoWorkspaceApi.runAuditorAgent).toHaveBeenCalled();
    });

    // Now advance timers to trigger polling
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledTimes(1);
    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledWith('mock-project-id');
  });

  it('should not start polling and display error if audit start fails', async () => {
    seoWorkspaceApi.runAuditorAgent.mockRejectedValue(new Error('Failed to start audit'));
    
    render(<AuditTab />);
    
    const runBtn = await screen.findByRole('button', { name: /Run New Audit/i });
    
    await act(async () => {
      fireEvent.click(runBtn);
    });

    await waitFor(() => {
      expect(seoWorkspaceApi.runAuditorAgent).toHaveBeenCalled();
      // An error message should be displayed (we look for the Alert message)
      expect(screen.getByText('Failed to start audit')).toBeInTheDocument();
    });

    // Advance timers
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // Polling should NOT have started
    expect(seoWorkspaceApi.getAuditStatus).not.toHaveBeenCalled();
  });

  it('should stop polling automatically when audit completes', async () => {
    seoWorkspaceApi.runAuditorAgent.mockResolvedValue({ status: 'queued', jobId: 'job123' });
    
    // First poll returns running, second poll returns completed
    seoWorkspaceApi.getAuditStatus
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'completed' });

    render(<AuditTab />);
    
    const runBtn = await screen.findByRole('button', { name: /Run New Audit/i });
    
    await act(async () => {
      fireEvent.click(runBtn);
    });

    // Advance 2s for first poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledTimes(1);

    // Advance 2s for second poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledTimes(2);

    // Advance 4s to ensure polling has stopped
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledTimes(2); // Should not increase!
  });
  
  it('should stop polling automatically when audit fails', async () => {
    seoWorkspaceApi.runAuditorAgent.mockResolvedValue({ status: 'queued', jobId: 'job123' });
    
    // First poll returns running, second poll returns failed
    seoWorkspaceApi.getAuditStatus
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'failed' });

    render(<AuditTab />);
    
    const runBtn = await screen.findByRole('button', { name: /Run New Audit/i });
    
    await act(async () => {
      fireEvent.click(runBtn);
    });

    // Advance 4s total
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    
    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledTimes(2);

    // Advance more time
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(seoWorkspaceApi.getAuditStatus).toHaveBeenCalledTimes(2); // Should not increase
  });
});
