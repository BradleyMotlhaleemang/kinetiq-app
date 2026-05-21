import './globals.css';
import { Manrope, Space_Grotesk } from 'next/font/google';
import ClientShell from './client-shell';
import BottomNav from '@/components/navigation/BottomNav';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <ClientShell>{children}</ClientShell>
        <BottomNav />
      </body>
    </html>
  );
}
