import { Geist, Geist_Mono, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { FeedbackProvider } from '@/components/feedback';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  // Só usada no código Pix: não precisa ser pré-carregada em todas as páginas
  preload: false,
  subsets: ['latin'],
});

const display = Barlow_Condensed({
  variable: '--font-display-face',
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
});

export const viewport = {
  themeColor: '#0f172a',
};

// Metadados e marca são definidos por empresa em [empresa]/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
