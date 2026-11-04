import AdminShell from '@/components/admin/shell';

export const metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
