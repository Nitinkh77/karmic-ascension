import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => pageMetadata("terms", "/terms");

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
