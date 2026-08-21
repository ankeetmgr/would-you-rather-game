import "./globals.css";

export const metadata = {
  title: "Would You Rather?",
  description: "A fun would-you-rather game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
