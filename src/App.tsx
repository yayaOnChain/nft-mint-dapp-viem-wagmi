import { CustomConnectButton } from "./components/CustomConnectButton";
import { NftMinter } from "./components/NftMinter";
import { UserNFTGallery } from "./components/UserNFTGallery";
import { TransactionHistoryTable } from "./components/TransactionHistoryTable";
import { useAccount } from "wagmi";

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">MyProjectNFT</h1>
          <CustomConnectButton />
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-4xl">
        {/* Minting Section */}
        <section className="mb-8">
          {isConnected ? (
            <NftMinter />
          ) : (
            <div className="text-center py-12 text-gray-400">
              Connect your wallet to start minting
            </div>
          )}
        </section>

        {/* User's NFT Gallery - Only show when connected */}
        {isConnected && (
          <>
            <section>
              <UserNFTGallery />
            </section>

            <section>
              <TransactionHistoryTable />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
