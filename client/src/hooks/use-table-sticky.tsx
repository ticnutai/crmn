import { useState, useEffect } from 'react';

export const useTableSticky = () => {
  const [stickyHeaders, setStickyHeaders] = useState(() => {
    const saved = localStorage.getItem('table-sticky-headers');
    return saved ? JSON.parse(saved) : true;
  });

  const [stickyFirstColumn, setStickyFirstColumn] = useState(() => {
    const saved = localStorage.getItem('table-sticky-first-column');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('table-sticky-headers', JSON.stringify(stickyHeaders));
  }, [stickyHeaders]);

  useEffect(() => {
    localStorage.setItem('table-sticky-first-column', JSON.stringify(stickyFirstColumn));
  }, [stickyFirstColumn]);

  return {
    stickyHeaders,
    stickyFirstColumn,
    setStickyHeaders,
    setStickyFirstColumn
  };
};