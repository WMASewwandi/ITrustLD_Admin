import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins"
});

export const metadata = {
  title: "iTrustLD Admin",
  description: "iTrustLD Admin Portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins antialiased">{children}</body>
    </html>
  );
}
