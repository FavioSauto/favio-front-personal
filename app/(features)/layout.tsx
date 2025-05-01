import Header from '@/components/header';
import { BottomNav } from '@/components/shared/BottomNav';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relativ overflow-hidden">
        <div className="h-full pb-20 flex flex-col gap-6 overflow-y-auto lg:max-w-[1024px] lg:mx-auto">{children}</div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </footer>
    </>
  );
}

export default AppLayout;
