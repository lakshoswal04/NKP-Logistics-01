import { AlertTicker } from "@/components/site/AlertTicker";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <AlertTicker />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
