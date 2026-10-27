import { preconnect } from "react-dom";
import { AnnouncementBar, SetupBanner } from "@/components/site/Banners";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { RouteProgress } from "@/components/site/RouteProgress";
import { MotionProvider } from "@/components/site/MotionProvider";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { supabaseUrl } from "@/lib/env";
import { getSettingsResult } from "@/lib/data";

// Content is read from Supabase and cached; admin edits call revalidatePath("/", "layout").
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, site } = await getSettingsResult();
  // Open the connection to Supabase (data + stored images) before the first request needs it.
  if (supabaseUrl && /^https:\/\//.test(supabaseUrl)) preconnect(new URL(supabaseUrl).origin, { crossOrigin: "anonymous" });
  return (
    <MotionProvider>
      <RouteProgress />
      <SmoothScroll />
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
    </MotionProvider>
  );
}
