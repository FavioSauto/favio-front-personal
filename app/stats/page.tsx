import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityChart } from '@/components/reusable/activity-chart';

export default function StatsPage() {
  const sampleData = [
    { date: '2024-01', value: 100 },
    { date: '2024-02', value: 150 },
    { date: '2024-03', value: 200 },
    { date: '2024-04', value: 180 },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Statistics & Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-sm text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$45,678</p>
            <p className="text-sm text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityChart data={sampleData} title="Monthly Transaction Volume" />
        </CardContent>
      </Card>
    </div>
  );
}
