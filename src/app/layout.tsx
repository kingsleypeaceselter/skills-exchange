import NavBar from "../components/NavBar";

import './globals.css';
import Script from 'next/script'; // Import Next.js Script component

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Load Cloudinary upload widget script globally */}
        <Script 
          src="https://upload-widget.cloudinary.com/global/all.js" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}