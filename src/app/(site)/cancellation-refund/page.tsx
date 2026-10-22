import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> =>
  pageMetadata("cancellation-refund", "/cancellation-refund");

export default function CancellationPage() {
  return <LegalPage slug="cancellation-refund" />;
}
