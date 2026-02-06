import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Wand2, Download, RefreshCw } from 'lucide-react';

interface AIArtGeneratorProps {
  onImageGenerated?: (imageUrl: string, metadata: any) => void;
}

const artStyles = [
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'anime', label: 'Anime/Manga' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'surrealism', label: 'Surrealism' },
  { value: 'pop-art', label: 'Pop Art' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: '3d-render', label: '3D Render' },
];

const AIArtGenerator = ({ onImageGenerated }: AIArtGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('digital-art');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const { generateArt, isLoading } = useAIFeatures();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for your artwork',
        variant: 'destructive',
      });
      return;
    }

    const result = await generateArt(prompt, style);
    
    if (result?.imageUrl) {
      setGeneratedImage(result.imageUrl);
      setDescription(result.description || '');
      toast({
        title: 'Art Generated! 🎨',
        description: 'Your AI artwork has been created',
      });
    } else {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate artwork. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUseImage = () => {
    if (generatedImage && onImageGenerated) {
      onImageGenerated(generatedImage, {
        prompt,
        style,
        description,
        isAIGenerated: true,
      });
      setOpen(false);
      toast({
        title: 'Image Selected',
        description: 'AI artwork will be used for your NFT',
      });
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `ai-art-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
          <Wand2 className="w-4 h-4" />
          AI Art Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI NFT Art Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>Describe Your Artwork</Label>
            <Textarea
              placeholder="A mystical dragon flying over a crystal castle during sunset, with aurora borealis in the sky..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Art Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {artStyles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full btn-hero gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Magic...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Art
              </>
            )}
          </Button>

          {/* Generated Image Preview */}
          {generatedImage && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={generatedImage}
                    alt="Generated AI Art"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={handleDownload}
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                {description && (
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Use Image Button */}
          {generatedImage && onImageGenerated && (
            <Button onClick={handleUseImage} className="w-full" variant="default">
              Use This Image for NFT
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIArtGenerator;
