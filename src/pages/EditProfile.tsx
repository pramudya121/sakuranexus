import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Upload, User, ArrowLeft, Twitter, Instagram, MessageCircle, Globe, Camera } from 'lucide-react';

interface UserProfile {
  username: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  twitter_handle: string;
  instagram_handle: string;
  discord_handle: string;
  website_url: string;
}

const EditProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    bio: '',
    avatar_url: '',
    banner_url: '',
    twitter_handle: '',
    instagram_handle: '',
    discord_handle: '',
    website_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const account = await getCurrentAccount();
    if (!account) {
      toast({ title: 'Connect Wallet', description: 'Please connect your wallet first', variant: 'destructive' });
      navigate('/');
      return;
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', account.toLowerCase())
      .single();

    if (data) {
      setProfile({
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        banner_url: data.banner_url || '',
        twitter_handle: data.twitter_handle || '',
        instagram_handle: data.instagram_handle || '',
        discord_handle: data.discord_handle || '',
        website_url: data.website_url || '',
      });
      setAvatarPreview(data.avatar_url || '');
      setBannerPreview(data.banner_url || '');
    }
    setIsLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { error } = await supabase.storage.from('nft-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('nft-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = await getCurrentAccount();
    if (!account) return;

    setIsSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const uploaded = await uploadFile(avatarFile, `avatars/${account}-${Date.now()}.${ext}`);
        if (uploaded) avatarUrl = uploaded;
      }

      let bannerUrl = profile.banner_url;
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const uploaded = await uploadFile(bannerFile, `banners/banner-${account}-${Date.now()}.${ext}`);
        if (uploaded) bannerUrl = uploaded;
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          wallet_address: account.toLowerCase(),
          username: profile.username,
          bio: profile.bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          twitter_handle: profile.twitter_handle,
          instagram_handle: profile.instagram_handle,
          discord_handle: profile.discord_handle,
          website_url: profile.website_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address' });

      if (error) throw error;

      toast({ title: 'Profile Updated!', description: 'Your profile has been saved successfully' });
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Save Failed', description: 'Failed to save profile changes', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--accent) / 0.1) 0%, transparent 50%)',
        }}
      />
      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <Card className="max-w-2xl mx-auto border-border/50 shadow-lg overflow-hidden mx-0 sm:mx-auto">
          {/* Banner Upload */}
          <div className="relative h-28 sm:h-40 bg-muted">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
            )}
            <Label
              htmlFor="banner-upload"
              className="absolute bottom-3 right-3 cursor-pointer px-3 py-1.5 bg-background/80 backdrop-blur-sm hover:bg-background rounded-lg transition-colors flex items-center gap-2 text-sm border border-border/50"
            >
              <Camera className="w-4 h-4" />
              Change Banner
            </Label>
            <Input id="banner-upload" type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 gradient-text">Edit Profile</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-3 sm:gap-5">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-border">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Change Avatar
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG (Max 5MB)</p>
                </div>
                <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b border-border/50 pb-2">Social Links</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-muted-foreground" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="@username"
                    value={profile.twitter_handle}
                    onChange={(e) => setProfile({ ...profile, twitter_handle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="@username"
                    value={profile.instagram_handle}
                    onChange={(e) => setProfile({ ...profile, instagram_handle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    Discord
                  </Label>
                  <Input
                    id="discord"
                    placeholder="username#1234"
                    value={profile.discord_handle}
                    onChange={(e) => setProfile({ ...profile, discord_handle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={profile.website_url}
                    onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full btn-hero h-12 text-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
