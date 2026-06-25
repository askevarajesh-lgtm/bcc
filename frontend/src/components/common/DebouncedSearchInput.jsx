import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const DebouncedSearchInput = ({ 
  placeholder = "Search...", 
  onChange, 
  debounceDelay = 500,
  style = {},
  ...rest
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) {
        onChange(searchTerm);
      }
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onChange, debounceDelay]);

  return (
    <Input
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      allowClear
      style={{ width: "100%", ...style }}
      {...rest}
    />
  );
};

export default DebouncedSearchInput;
