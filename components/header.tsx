import ConnectButton from './reusable/connect-button';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <nav>
        <ConnectButton />
      </nav>
    </header>
  );
}
