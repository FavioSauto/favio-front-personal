import ConnectButton from './shared/ConnectButton';
import SelectTokenSwitch from './shared/SelectTokenSwitch';

export default function Header() {
  return (
    <header className="lg:max-w-[1024px] mx-auto lg:p-4 lg:px-0">
      <nav className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Crypto Actions</h1>

          <SelectTokenSwitch />
        </div>

        <ConnectButton />
      </nav>
    </header>
  );
}
