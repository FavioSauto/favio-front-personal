import Charts from '@/components/shared/Charts';

export default function StatsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Token Event Statistics</h1>

      <Charts />
    </div>
  );
}
