import { useState, useMemo } from 'react';

const usePagination = (options = {}) => {
  const [current, setCurrent] = useState(options.defaultCurrent || 1);
  const [pageSize, setPageSize] = useState(options.defaultPageSize || 10);
  const [search, setSearch] = useState('');

  const pagination = {
    current,
    pageSize,
    onChange: (p, s) => { setCurrent(p); setPageSize(s); },
    total: 0,
  };

  const queryParams = useMemo(() => ({
    page: current,
    limit: pageSize,
    search,
  }), [current, pageSize, search]);

  const handleTableChange = (newPagination) => {
    setCurrent(newPagination.current);
    setPageSize(newPagination.pageSize);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrent(1);
  };

  const setPagination = (setter) => {
    const val = typeof setter === 'function' ? setter(pagination) : setter;
    if (val.current) setCurrent(val.current);
    if (val.pageSize) setPageSize(val.pageSize);
  };

  return { pagination, queryParams, handleTableChange, handleSearchChange, setPagination };
};

export default usePagination;
