import React, { useState } from 'react';
import { Input, Dropdown, Spin, Typography, Empty } from 'antd';
import { Search as SearchIcon } from 'lucide-react';
import useWorkspaceSearch from './hooks/useWorkspaceSearch';

const { Text } = Typography;

const GlobalSearchBar = ({ onSelectProject, onSelectStrategy, onSelectTask }) => {
  const { results, loading, search, clear } = useWorkspaceSearch();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      clear();
      setOpen(false);
      return;
    }
    setOpen(true);
    search(value);
  };

  const renderResults = () => {
    if (loading) {
      return <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>;
    }
    if (!results) return null;
    const { projects = [], strategies = [], tasks = [] } = results;
    if (projects.length === 0 && strategies.length === 0 && tasks.length === 0) {
      return <div style={{ padding: 16 }}><Empty description="No matches" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>;
    }
    return (
      <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8, minWidth: 320 }}>
        {projects.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, paddingLeft: 8 }}>PROJECTS</Text>
            {projects.map(p => (
              <div key={p._id} className="seo-search-result-item" onClick={() => { onSelectProject?.(p); setOpen(false); }}>
                <Text strong>{p.name}</Text> <Text type="secondary">{p.domain}</Text>
              </div>
            ))}
          </div>
        )}
        {strategies.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, paddingLeft: 8 }}>STRATEGIES</Text>
            {strategies.map(s => (
              <div key={s._id} className="seo-search-result-item" onClick={() => { onSelectStrategy?.(s); setOpen(false); }}>
                <Text strong>{s.title}</Text> <Text type="secondary">{s.status}</Text>
              </div>
            ))}
          </div>
        )}
        {tasks.length > 0 && (
          <div>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, paddingLeft: 8 }}>TASKS</Text>
            {tasks.map(t => (
              <div key={t._id} className="seo-search-result-item" onClick={() => { onSelectTask?.(t); setOpen(false); }}>
                <Text strong>{t.taskType}</Text> <Text type="secondary">{t.pageUrl}</Text>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dropdown
      open={open && !!query.trim()}
      onOpenChange={setOpen}
      trigger={[]}
      popupRender={renderResults}
      placement="bottomLeft"
    >
      <Input
        prefix={<SearchIcon size={14} style={{ opacity: 0.6 }} />}
        placeholder="Search projects, strategies, tasks..."
        value={query}
        onChange={handleChange}
        onFocus={() => query.trim() && setOpen(true)}
        style={{ maxWidth: 320, borderRadius: 8 }}
        allowClear
        onClear={() => { setQuery(''); clear(); setOpen(false); }}
      />
    </Dropdown>
  );
};

export default GlobalSearchBar;
