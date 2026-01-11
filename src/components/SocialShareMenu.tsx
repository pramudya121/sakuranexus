import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Twitter, 
  MessageCircle, 
  Link2, 
  Check,
  ExternalLink,
  Mail
} from 'lucide-react';

interface SocialShareMenuProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  type: 'nft' | 'auction' | 'collection';
  price?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const SocialShareMenu = memo(({
  title,
  description,
  url,
  image,
  type,
  price,
  className,
  variant = 'outline',
  size = 'sm',
}: SocialShareMenuProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Get current URL if not provided
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Build share text based on type
  const getShareText = () => {
    const priceText = price ? ` for ${price} NEX` : '';
    switch (type) {
      case 'nft':
        return `🌸 Check out this NFT: "${title}"${priceText} on NexuSakura!\n\n`;
      case 'auction':
        return `🔥 Live Auction: "${title}"${priceText} on NexuSakura!\n\nBid now before it ends!\n\n`;
      case 'collection':
        return `✨ Explore the "${title}" collection on NexuSakura!\n\n`;
      default:
        return `Check out "${title}" on NexuSakura!\n\n`;
    }
  };

  const shareText = getShareText();
  const hashtags = 'NexuSakura,NFT,Web3,Crypto';

  // Twitter/X Share
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  // Discord Share (copy formatted message for Discord)
  const shareToDiscord = () => {
    const discordText = `${shareText}${shareUrl}`;
    navigator.clipboard.writeText(discordText);
    toast({
      title: 'Copied for Discord!',
      description: 'Message copied. Paste it in your Discord channel.',
    });
  };

  // Copy Link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link Copied!',
        description: 'Share link has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually.',
        variant: 'destructive',
      });
    }
  };

  // Email Share
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out ${title} on NexuSakura`);
    const body = encodeURIComponent(`${shareText}${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Native Share (if supported)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== 'AbortError') {
          copyLink(); // Fallback to copy
        }
      }
    } else {
      copyLink(); // Fallback for browsers without native share
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4" />
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
        {/* Twitter/X */}
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer gap-3">
          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
          <span>Share on X</span>
          <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>

        {/* Discord */}
        <DropdownMenuItem onClick={shareToDiscord} className="cursor-pointer gap-3">
          <MessageCircle className="w-4 h-4 text-[#5865F2]" />
          <span>Copy for Discord</span>
        </DropdownMenuItem>

        {/* Email */}
        <DropdownMenuItem onClick={shareViaEmail} className="cursor-pointer gap-3">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span>Share via Email</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Copy Link */}
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer gap-3">
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Link Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </DropdownMenuItem>

        {/* Native Share (mobile) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={nativeShare} className="cursor-pointer gap-3">
              <Share2 className="w-4 h-4 text-primary" />
              <span>More Options...</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SocialShareMenu.displayName = 'SocialShareMenu';

export default SocialShareMenu;
