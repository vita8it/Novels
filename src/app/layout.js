import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata = {
  title: "Novel",
  description: "Novel is a simple Roblox automation hub built for faster, stability, and ease of use.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${prompt.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
