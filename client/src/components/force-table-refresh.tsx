import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function ForceTableRefresh() {
  const clearTableStorage = () => {
    localStorage.removeItem('clients-table');
    
    window.location.reload();
  };

  return (
    <Button 
      onClick={clearTableStorage}
      variant="outline" 
      size="sm"
      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
    >
      🔄 רענן עמודות טבלה
    </Button>
  );
}