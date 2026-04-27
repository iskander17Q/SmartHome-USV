import type {Metadata} from 'next';
import './globals.css'; 
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'E Home - Smart Home',
  description: 'Manage your smart home devices easily',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="py-6 text-center text-xs flex flex-col items-center justify-center space-y-1 text-gray-500 dark:text-gray-400">
            <span>Приложение создано на трезвую голову</span>
            <span>Сегодня, была хреновая погода</span>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
