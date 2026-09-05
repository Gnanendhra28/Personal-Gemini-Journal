import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Gemini Journal: Reflect. Act. Grow.',
  description: 'A private, intelligent reflection companion powered by Gemini 3.8 Flash with the Reflect → Act → Grow Engine and user-isolated Cloud Firestore storage.',
  openGraph: {
    title: 'Personal Gemini Journal: Reflect. Act. Grow.',
    description: 'A private, intelligent reflection companion powered by Gemini 3.8 Flash with the Reflect → Act → Grow Engine and user-isolated Cloud Firestore storage.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Gemini Journal: Reflect. Act. Grow.',
    description: 'A private, intelligent reflection companion powered by Gemini 3.8 Flash with the Reflect → Act → Grow Engine and user-isolated Cloud Firestore storage.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
