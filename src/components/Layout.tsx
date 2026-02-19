import { PropsWithChildren } from 'react';
import Header from './Header';
import Footer from './Footer';
import AdminGearButton from './AdminGearButton';
import BackgroundDecor from './BackgroundDecor';

const Layout = ({ children }: PropsWithChildren) => (
  <div className="relative min-h-screen" style={{ color: 'var(--text-primary)' }}>
    <BackgroundDecor />
    <Header />
    <main className="pb-20 pt-16 md:pt-20">{children}</main>
    <Footer />
    <AdminGearButton />
  </div>
);

export default Layout;
