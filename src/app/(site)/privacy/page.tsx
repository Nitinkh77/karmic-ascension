import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("privacy", "/privacy");

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
