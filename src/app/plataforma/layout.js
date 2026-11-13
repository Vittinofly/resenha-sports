import ShellPlataforma from './shell-plataforma';

export const metadata = {
  title: 'Plataforma',
  robots: { index: false, follow: false },
};

export default function PlataformaLayout({ children }) {
  return <ShellPlataforma>{children}</ShellPlataforma>;
}
