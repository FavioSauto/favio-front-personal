import ConnectButton from './reusable/connect-button';

export default function Header() {
  return (
    <header className="p-4">
      <nav className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Crypto Actions</h1>
        <ConnectButton />
      </nav>
    </header>
  );
}
