import { useState } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { mintNFT } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Mint = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleMint = async () => {
    if (!file || !name) {
      toast({
        title: 'Missing Information',
        description: 'Please provide an image and name for your NFT',
        variant: 'destructive',
      });
      return;
    }

    const account = await getCurrentAccount();
    if (!account) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to mint NFTs',
        variant: 'destructive',
      });
      return;
    }

    setIsMinting(true);
    try {
      const result = await mintNFT(file, name, description, account);
      
      if (result.success) {
        setMintSuccess(true);
        setTokenId(result.tokenId || null);
        toast({
          title: 'NFT Minted Successfully! 🎉',
          description: `Your NFT #${result.tokenId} has been created`,
        });
        
        // Reset form
        setTimeout(() => {
          setFile(null);
          setPreview('');
          setName('');
          setDescription('');
          setMintSuccess(false);
          setTokenId(null);
        }, 3000);
      } else {
        toast({
          title: 'Minting Failed',
          description: result.error || 'Failed to mint NFT',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during minting',
        variant: 'destructive',
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-text">Mint Your NFT</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform your digital art into a unique NFT on NEXUSLABS
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Your Artwork
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!preview ? (
                  <label className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors bg-gradient-sakura-soft">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <span className="text-lg font-medium mb-2">Click to upload</span>
                    <span className="text-sm text-muted-foreground">PNG, JPG, GIF (Max 10MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                ) : (
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-80 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                      }}
                      className="absolute top-3 right-3 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Change Image
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Section */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  NFT Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter NFT name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Tell the story behind your artwork..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {mintSuccess && tokenId && (
                  <div className="p-4 rounded-lg bg-gradient-sakura text-white flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <div>
                      <div className="font-semibold">Minted Successfully!</div>
                      <div className="text-sm opacity-90">Token ID: #{tokenId}</div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleMint}
                  disabled={!file || !name || isMinting}
                  className="w-full btn-hero py-6 text-lg"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Minting... This may take a moment
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Mint NFT
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your NFT will be minted on NEXUSLABS Testnet. Make sure you have enough NEX for gas fees.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="mt-8 bg-gradient-sakura-soft border-none">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">How Minting Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold mb-3">
                    1
                  </div>
                  <h4 className="font-semibold mb-2">Upload Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Your image is securely uploaded to decentralized storage
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold mb-3">
                    2
                  </div>
                  <h4 className="font-semibold mb-2">Create Metadata</h4>
                  <p className="text-sm text-muted-foreground">
                    NFT metadata is generated with your name and description
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold mb-3">
                    3
                  </div>
                  <h4 className="font-semibold mb-2">Mint to Blockchain</h4>
                  <p className="text-sm text-muted-foreground">
                    Your NFT is minted on NEXUSLABS and saved to your wallet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Mint;
