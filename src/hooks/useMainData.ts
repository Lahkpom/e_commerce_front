import { useContext } from 'react';
import { MainDataContext } from '../contexts/MainDataContext.tsx';
import type { MainDataContextValue } from '../contexts/MainDataContext.tsx';

const useMainData = (): MainDataContextValue => {
  const context = useContext(MainDataContext);

  if (!context) throw new Error('useMainData must be used within an AuthProvider');

  return context;
};

export default useMainData;
