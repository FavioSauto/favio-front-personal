import TransactionHistoryTable from '@/components/TransactionHistoryTable';
import BalancesCards from '@/components/BalancesCards';
import ActionButtonsCard from '@/components/ActionButtonsCard';

const TokenDashboard = () => {
  return (
    <div className="w-full py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-y-4 col-span-1 items-start">
        <BalancesCards />

        <ActionButtonsCard />
      </div>

      <TransactionHistoryTable />
    </div>
  );
};

export default TokenDashboard;
