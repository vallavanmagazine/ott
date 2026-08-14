import { SubPageHeader } from '@/components/ScreenShell';
import { DownloadAppCard } from '@/components/GetApp';

/**
 * Web has no dashboards (FIX 2). Any dashboard/management link on web lands
 * here and points the user to the mobile app.
 */
export function DownloadAppScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Get the App" onBack={onBack} />
      <div className="px-4 mt-8 max-w-[560px] mx-auto w-full">
        <DownloadAppCard
          title="Available in the app"
          subtitle="Sponsor and Freelancer dashboards — campaigns, wallet, AI Studio, tasks, earnings and analytics — live in the Vallavan mobile app. Download it to continue."
        />
      </div>
    </div>
  );
}
