import type { ReactElement, ReactNode } from 'react';

export const createTitle = (title: ReactNode, icon: string): ReactElement => (
  <span className="title">
    {title} <i className={icon}></i>
  </span>
);
