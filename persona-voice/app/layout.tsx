import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PersonaVoice — Voice-First Multi-Persona Assistant',
  description: 'One voice engine, any persona — speak in Indian languages and it already knows your world. Powered by Gnani AI, Gemini, and Supabase pgvector.',
  keywords: ['Gnani AI', 'Voice AI', 'Prisma STT', 'Timbre TTS', 'Gemini', 'RAG', 'Supabase pgvector', 'Indian languages'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
