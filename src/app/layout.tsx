export const metadata = {
  title: "Goals4Arab | نتائج مباشرة ومباريات اليوم",
  description: "نتائج مباشرة ومباريات اليوم بواجهة بسيطة وسريعة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
