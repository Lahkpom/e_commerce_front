import { Outlet } from "react-router-dom";
import Menu from './Menu';
import Footer from './footer/Footer';

import './Layout.scss';

const Layout = () => {
    return (
        <div className="layout">
            <Menu />
            <main className="layout__main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
export default Layout;