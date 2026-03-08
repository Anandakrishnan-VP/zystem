import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AVATARS = [
  { id: 1, url: '/avatars/avatar-1.png', label: 'Fire' },
  { id: 2, url: '/avatars/avatar-2.png', label: 'Water' },
  { id: 3, url: '/avatars/avatar-3.png', label: 'Air' },
  { id: 4, url: '/avatars/avatar-4.png', label: 'Electric' },
];

const ProfileSetup = () => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile, isProfileComplete, loading: profileLoading, hasLoadedProfile } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect away if profile is already complete
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && !profileLoading && hasLoadedProfile && isProfileComplete) {
      navigate('/');
    }
  }, [authLoading, profileLoading, hasLoadedProfile, isProfileComplete, user, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!user || (hasLoadedProfile && isProfileComplete)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedAvatar) {
      toast({
        title: 'Avatar required',
        description: 'Please select an avatar to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await updateProfile(username.trim(), selectedAvatar);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="border border-foreground p-8">
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest mb-2">
            Profile Setup
          </h1>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-8">
            Complete your profile to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider">
                Your Name
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="font-mono text-sm rounded-none border-foreground bg-background"
                maxLength={50}
              />
            </div>

            {/* Avatar Selection */}
            <div className="space-y-4">
              <label className="font-mono text-xs uppercase tracking-wider">
                Choose Avatar
              </label>
              <div className="grid grid-cols-2 gap-4">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`relative aspect-square border-2 transition-all ${
                      selectedAvatar === avatar.url
                        ? 'border-foreground'
                        : 'border-muted-foreground/30 hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
                        <span className="font-mono text-xs uppercase tracking-wider bg-background px-2 py-1">
                          Selected
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !username.trim() || !selectedAvatar}
              className="w-full font-mono text-xs uppercase tracking-wider rounded-none border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
