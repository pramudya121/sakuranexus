import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Search, Image, Upload, RefreshCw, Palette, Eye } from 'lucide-react';

interface AIVisualSearchProps {
  onSearchResults?: (results: any) => void;
}

const AIVisualSearch = ({ onSearchResults }: AIVisualSearchProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { visualSearch } = useAIFeatures();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewImage(dataUrl);
        setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const performSearch = async () => {
    if (!imageUrl) return;
    
    setIsSearching(true);
    const result = await visualSearch(imageUrl, 'similar');
    if (result) {
      setSearchResults(result);
      onSearchResults?.(result);
    }
    setIsSearching(false);
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          AI Visual Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Area */}
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL..."
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewImage(null);
              }}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Preview */}
          {(previewImage || imageUrl) && (
            <div className="relative aspect-square max-h-48 overflow-hidden rounded-lg bg-muted">
              <img
                src={previewImage || imageUrl}
                alt="Search preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={performSearch}
            disabled={!imageUrl || isSearching}
            className="w-full gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Similar NFTs
              </>
            )}
          </Button>

          {/* Results */}
          {searchResults && (
            <div className="space-y-4 pt-4 border-t">
              {/* Visual Features */}
              {searchResults.visualFeatures && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Visual Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Style: </span>
                      <span>{searchResults.visualFeatures.artStyle}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mood: </span>
                      <span>{searchResults.visualFeatures.mood}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Complexity: </span>
                      <span>{searchResults.visualFeatures.complexity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Technique: </span>
                      <span>{searchResults.visualFeatures.technique}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Colors */}
              {searchResults.visualFeatures?.dominantColors && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Dominant Colors</h4>
                  <div className="flex gap-2">
                    {searchResults.visualFeatures.dominantColors.slice(0, 6).map((color: string, i: number) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Search Terms */}
              {searchResults.searchTerms && searchResults.searchTerms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Search Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {searchResults.searchTerms.map((term: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {searchResults.tags && searchResults.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Visual Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {searchResults.tags.slice(0, 12).map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              {searchResults.category && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Detected Category</span>
                  <Badge>{searchResults.category}</Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIVisualSearch;
