import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface MenuNavLinkProps {
  name: ReactNode;
  path: string;
  collapseMenu: () => void;
  icon?: ReactNode;
  className?: string;
}

const MenuNavLink = ({ name, path, collapseMenu, icon = null, className = 'nav-link' }: MenuNavLinkProps) => {
  return (
    <li className='nav-item'>
      <NavLink className={className} to={path} onClick={collapseMenu}>{icon}{name}</NavLink>
    </li>
  );
};
export default MenuNavLink;