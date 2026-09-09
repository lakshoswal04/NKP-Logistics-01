import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

/**
 * The navbar is fixed and floats transparently over each page's hero, so it is
 * not part of the flow and adds no offset here. Pages are responsible for
 * clearing it — either with a full-bleed hero that it sits on, or with top
 * padding on a PageHeader.
 *
 * AlertTicker is likewise rendered per page, directly beneath the hero, rather
 * than in this layout: a layout cannot know where a full-bleed hero ends, and
 * putting the strip above one would cut the photograph in half.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
