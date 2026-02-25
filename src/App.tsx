import { CustomConnectButton } from "./components/CustomConnectButton";
import { NftMinter } from "./components/NftMinter";
import { useAccount } from "wagmi";

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Connect Button */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">NFT Mint DApp</h1>
          <CustomConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto mt-10 p-4">
        {/* Only show Minter if connected, or show prompt */}
        {isConnected ? (
          <NftMinter />
        ) : (
          <div className="text-center text-gray-400 mt-20">
            <p>Please connect your wallet to start minting.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
