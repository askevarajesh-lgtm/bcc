import { useState } from 'react';
const useBulkSelection = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  return { selectedRowKeys, setSelectedRowKeys, onSelectChange: setSelectedRowKeys };
};
export default useBulkSelection;
