import type { ReactNode } from 'react';
import { createContext } from 'react';

export interface MainDataContextValue {
  globalInfo: {
    name: string;
    phoneNumber: string;
    email: string;
    web: string;
  };
  PLACEHOLDER_IMG: string;
  LOGO: string;
}

const MainDataContext = createContext<MainDataContextValue | null>(null);

const MainDataProvider = ({ children }: { children: ReactNode }) => {
  const globalInfo = {
    name: 'Calwill & Fiorella',
    phoneNumber: '+54 9 11-5959-0586',
    email: 'calwillyfiorella@gmail.com',
    web: 'https://calwillyfiorella.com',
  };

  const imagesPath = '/assets/images/';
  const PLACEHOLDER_IMG = `${imagesPath}placeholder.png`;
  const LOGO = `${imagesPath}logo.jpg`;

  const value: MainDataContextValue = {
    globalInfo,
    PLACEHOLDER_IMG,
    LOGO,
  };

  return <MainDataContext.Provider value={value}>{children}</MainDataContext.Provider>;
};

export { MainDataContext, MainDataProvider };
