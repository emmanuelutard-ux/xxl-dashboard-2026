import { MOCK_PROGRAMS } from '@/data/mockData';
import ProgramDashboard from '@/components/dashboard/ProgramDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <div className="max-w-[1600px] mx-auto p-6">
      <ProgramDashboard programs={MOCK_PROGRAMS} />
    </div>
  );
}
