import { AnnouncementBar, SetupBanner } from "@/components/site/Banners";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSettingsResult } from "@/lib/data";

// Content is read from Supabase and cached; admin edits call revalidatePath("/", "layout").
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, site } = await getSettingsResult();
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-maroon px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SetupBanner site={site} />
      <AnnouncementBar settings={settings} />
      <Header brandName={settings.brand_name} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
