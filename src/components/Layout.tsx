import { PropsWithChildren, memo } from 'react';
import Header from './Header';
import Footer from './Footer';
import AdminGearButton from './AdminGearButton';
import BackgroundDecor from './BackgroundDecor';

const StableBackground = memo(BackgroundDecor);

const Layout = ({ children }: PropsWithChildren) => (
  <div className="relative isolate min-h-screen" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary, #0a0a0a)' }}>
    <StableBackground />
    <div className="relative z-10">
      <Header />
      <main className="pb-20 pt-16 lg:pt-20">{children}</main>
      <Footer />
      <AdminGearButton />
    </div>
  </div>
);

export default Layout;
