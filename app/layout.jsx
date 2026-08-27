import "./globals.css";
import { Poppins } from "next/font/google";
import MobileViewportFix from "@/components/admin/mobile-viewport-fix";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins"
});

export const metadata = {
  title: "iTrustLD Admin",
  description: "iTrustLD Admin Portal",
  icons: {
    icon: [{ url: "/assets/img/logos/favicon.svg", type: "image/svg+xml" }],
    apple: "/assets/img/logos/favicon.svg"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins antialiased">
        <MobileViewportFix />
        {children}
      </body>
    </html>
  );
}
