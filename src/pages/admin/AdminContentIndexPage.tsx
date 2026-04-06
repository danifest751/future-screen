import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Package, Tag, Phone, FolderOpen, Inbox, Palette, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { getAdminContentIndexContent } from '../../content/pages/adminContentIndex';

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  tag: Tag,
  phone: Phone,
  folderOpen: FolderOpen,
  inbox: Inbox,
  palette: Palette,
  fileText: FileText,
};

const AdminContentIndexPage = () => {
  const { adminLocale } = useI18n();
  const adminContentIndexContent = getAdminContentIndexContent(adminLocale);

  return (
    <AdminLayout
      title={adminContentIndexContent.layout.title}
      subtitle={adminContentIndexContent.layout.subtitle}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminContentIndexContent.sections.map((section) => {
          const Icon = iconMap[section.icon];
          return (
            <Link
              key={section.to}
              to={section.to}
              className="group rounded-xl border border-white/10 bg-slate-800 p-5 transition hover:border-brand-500/40 hover:bg-slate-800/80"
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)', border: '1px solid rgba(102,126,234,0.2)' }}
              >
                <Icon size={18} className="text-brand-400" />
              </div>
              <div className="text-lg font-semibold text-white">{section.title}</div>
              <div className="mt-1 text-sm text-slate-400">{section.desc}</div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminContentIndexPage;
