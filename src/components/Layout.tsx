import { PropsWithChildren } from 'react';
import Header from './Header';
import Footer from './Footer';
import AdminGearButton from './AdminGearButton';
import EditToolbar from './admin/EditToolbar';

const Layout = ({ children }: PropsWithChildren) => (
  <div className="relative isolate min-h-screen" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary, #0a0a0a)' }}>
    <div className="relative z-10">
      <Header />
      <main className="pb-20 pt-16 lg:pt-20">{children}</main>
      <Footer />
      <AdminGearButton />
      <EditToolbar />
    </div>
  </div>
);

export default Layout;
