export const metadata = {
  title: "Goals4Arab | نتائج المباريات المباشرة وجدول اليوم",
  description: "نتائج مباشرة ومباريات اليوم والغد والأسبوع القادم",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
