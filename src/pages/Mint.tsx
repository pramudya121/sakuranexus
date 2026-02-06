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
import { Upload, Loader2, CheckCircle2, Sparkles, Wand2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AIArtGenerator } from '@/components/ai';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Badge } from '@/components/ui/badge';
const Mint = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const { toast } = useToast();
  const { generateMetadata } = useAIFeatures();
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
      setIsAIGenerated(false);
      setAiGeneratedUrl(null);
    }
  };

  const handleAIImageGenerated = (imageUrl: string, metadata: any) => {
    setAiGeneratedUrl(imageUrl);
    setPreview(imageUrl);
    setIsAIGenerated(true);
    if (metadata.description) {
      setDescription(metadata.description);
    }
    // Convert base64 to File for minting
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `ai-art-${Date.now()}.png`, { type: 'image/png' });
        setFile(file);
      });
  };

  const handleAutoGenerateMetadata = async () => {
    if (!preview) {
      toast({
        title: 'No Image',
        description: 'Please upload an image first',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingMetadata(true);
    const result = await generateMetadata(preview, { suggestedName: name, notes: description });
    
    if (result) {
      if (result.name && !name) setName(result.name);
      if (result.description) setDescription(result.description);
      if (result.tags) setSuggestedTags(result.tags);
      toast({
        title: 'Metadata Generated! ✨',
        description: 'AI has suggested name, description, and tags',
      });
    }
    setIsGeneratingMetadata(false);
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
          description: 'Redirecting to your profile...',
        });
        
        // Redirect to profile after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
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
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(328 85% 55% / 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(320 90% 60% / 0.15) 0%, transparent 50%)',
        }}
      />
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header with enhanced styling */}
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-2 rounded-full bg-gradient-sakura text-white font-medium shadow-elegant mb-4">
              <Sparkles className="inline-block mr-2 h-4 w-4" />
              Create NFT
            </div>
            <h1 className="text-6xl font-bold mb-4">
              <span className="gradient-text">Mint Your NFT</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your digital art into a unique NFT on NEXUSLABS Testnet
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section with enhanced styling */}
            <Card className="card-hover shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-2xl">
                    <Upload className="w-6 h-6" />
                    Upload Your Artwork
                  </div>
                  <AIArtGenerator onImageGenerated={handleAIImageGenerated} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!preview ? (
                  <label className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary hover:bg-gradient-sakura-soft transition-all bg-gradient-card shadow-card group">
                    <div className="w-20 h-20 rounded-full bg-gradient-sakura flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-glow">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-xl font-medium mb-2 gradient-text">Click to upload</span>
                    <span className="text-sm text-muted-foreground">PNG, JPG, GIF (Max 10MB)</span>
                    <span className="text-xs text-muted-foreground mt-2">or use AI Art Generator →</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                ) : (
                  <div className="relative group">
                    {isAIGenerated && (
                      <Badge className="absolute top-2 left-2 z-10 bg-gradient-sakura text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-96 object-cover rounded-2xl shadow-elegant"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        setIsAIGenerated(false);
                        setAiGeneratedUrl(null);
                      }}
                      className="absolute top-4 right-4 px-6 py-3 bg-destructive text-destructive-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all font-medium shadow-elegant hover:scale-105"
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    NFT Details
                  </div>
                  {preview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoGenerateMetadata}
                      disabled={isGeneratingMetadata}
                      className="gap-2"
                    >
                      {isGeneratingMetadata ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      Auto-Generate
                    </Button>
                  )}
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

                {/* AI Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      AI Suggested Tags
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {suggestedTags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
