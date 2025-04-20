import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenCard } from '@/components/reusable/token-card';
import { QuickActionButton } from '@/components/reusable/quick-action-button';
import { Plus, Send, Check } from 'lucide-react';

interface TokenDetailsPageProps {
  params: {
    id: string;
  };
}

export default function TokenDetailsPage({ params }: TokenDetailsPageProps) {
  const tokenId = params.id;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Token Details</h1>
        <div className="flex gap-2">
          <QuickActionButton icon={Plus} label="Mint" onClick={() => {}} variant="outline" />
          <QuickActionButton icon={Send} label="Transfer" onClick={() => {}} variant="outline" />
          <QuickActionButton icon={Check} label="Approve" onClick={() => {}} variant="outline" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenCard token="DAI" balance="1,000" value="1,000" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for transaction list */}
              <div className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium">Transfer</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <p className="font-medium">+100 SMPL</p>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium">Mint</p>
                  <p className="text-sm text-muted-foreground">1 day ago</p>
                </div>
                <p className="font-medium">+500 SMPL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Contract Address</p>
              <p className="font-mono">0x1234...5678</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Supply</p>
              <p>1,000,000 SMPL</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Decimals</p>
              <p>18</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>Jan 1, 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
