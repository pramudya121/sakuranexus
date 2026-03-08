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
import { Upload, Loader2, CheckCircle2, Sparkles, Wand2, Tag, Image, FileText, Zap } from 'lucide-react';
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
    <div className="min-h-screen relative bg-background">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--accent) / 0.15) 0%, transparent 50%)',
        }}
      />
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Create NFT
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Mint Your NFT</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your digital art into a unique NFT on NEXUSLABS Testnet
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xl">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Artwork
                  </div>
                  <AIArtGenerator onImageGenerated={handleAIImageGenerated} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!preview ? (
                  <label className="flex flex-col items-center justify-center h-80 sm:h-96 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-lg font-medium mb-1">Click to upload</span>
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
                      <Badge className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-80 sm:h-96 object-cover rounded-2xl border border-border/50"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        setIsAIGenerated(false);
                        setAiGeneratedUrl(null);
                      }}
                      className="absolute top-3 right-3 px-4 py-2 bg-destructive text-destructive-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all font-medium text-sm hover:scale-105"
                    >
                      Change Image
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Section */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xl">
                    <FileText className="w-5 h-5 text-primary" />
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
              <CardContent className="space-y-5">
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
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* AI Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      AI Suggested Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedTags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mintSuccess && tokenId && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Minted Successfully!</div>
                      <div className="text-sm text-muted-foreground">Token ID: #{tokenId}</div>
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

          {/* How It Works */}
          <Card className="mt-8 border-border/50">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-2xl font-bold mb-6 gradient-text">How Minting Works</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { icon: Image, title: 'Upload Image', desc: 'Your image is securely uploaded to decentralized storage', step: 1 },
                  { icon: FileText, title: 'Create Metadata', desc: 'NFT metadata is generated with your name and description', step: 2 },
                  { icon: Zap, title: 'Mint to Blockchain', desc: 'Your NFT is minted on NEXUSLABS and saved to your wallet', step: 3 },
                ].map(({ icon: Icon, title, desc, step }) => (
                  <div key={step} className="flex flex-col items-start">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {step}
                      </div>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-1">{title}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Mint;
