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
import { Loader2, Upload, User, ArrowLeft } from 'lucide-react';

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
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    const { data, error } = await supabase
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
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (walletAddress: string): Promise<string | null> => {
    if (!avatarFile) return profile.avatar_url;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${walletAddress}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('nft-images')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('nft-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload avatar image',
        variant: 'destructive',
      });
      return null;
    }
  };

  const uploadBanner = async (walletAddress: string): Promise<string | null> => {
    if (!bannerFile) return profile.banner_url;

    try {
      const fileExt = bannerFile.name.split('.').pop();
      const fileName = `banner-${walletAddress}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('nft-images')
        .upload(filePath, bannerFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('nft-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload banner image',
        variant: 'destructive',
      });
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
        const uploadedUrl = await uploadAvatar(account);
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }

      let bannerUrl = profile.banner_url;
      if (bannerFile) {
        const uploadedUrl = await uploadBanner(account);
        if (uploadedUrl) bannerUrl = uploadedUrl;
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
        }, {
          onConflict: 'wallet_address'
        });

      if (error) throw error;

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been saved successfully',
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save profile changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

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
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <Card className="max-w-2xl mx-auto p-8 bg-background/95 backdrop-blur-md shadow-elegant border-2 border-primary/20">
          <h1 className="text-3xl font-bold mb-6 gradient-text">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-elegant">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-gradient-sakura text-white text-2xl">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Change Avatar
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="border-2 focus:border-primary"
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
                className="border-2 focus:border-primary min-h-[100px]"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Social Links</h3>
              
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter Handle</Label>
                <Input
                  id="twitter"
                  placeholder="@username"
                  value={profile.twitter_handle}
                  onChange={(e) => setProfile({ ...profile, twitter_handle: e.target.value })}
                  className="border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram Handle</Label>
                <Input
                  id="instagram"
                  placeholder="@username"
                  value={profile.instagram_handle}
                  onChange={(e) => setProfile({ ...profile, instagram_handle: e.target.value })}
                  className="border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord">Discord Handle</Label>
                <Input
                  id="discord"
                  placeholder="username#1234"
                  value={profile.discord_handle}
                  onChange={(e) => setProfile({ ...profile, discord_handle: e.target.value })}
                  className="border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={profile.website_url}
                  onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                  className="border-2 focus:border-primary"
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
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
