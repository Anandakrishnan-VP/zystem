import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationSettings } from '@/components/NotificationSettings';
import { UserAvatar } from '@/components/UserAvatar';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAvatarTheme } from '@/hooks/useTheme';

const AVATARS = [
  { id: 1, url: '/avatars/avatar-1.png', label: 'Fire' },
  { id: 2, url: '/avatars/avatar-2.png', label: 'Water' },
  { id: 3, url: '/avatars/avatar-3.png', label: 'Air' },
  { id: 4, url: '/avatars/avatar-4.png', label: 'Electric' },
];

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  useAvatarTheme();

  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setSelectedAvatar(profile.avatar_url || null);
    }
  }, [profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const hasChanges =
    username.trim() !== (profile?.username || '') ||
    selectedAvatar !== (profile?.avatar_url || null);

  const handleSaveProfile = async () => {
    if (!username.trim() || !selectedAvatar) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const { error } = await updateProfile(username.trim(), selectedAvatar);
    setIsSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-foreground">
        <div className="container max-w-6xl mx-auto px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest">
            Settings
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-6 py-12 space-y-12">
        {/* Profile Section */}
        <section>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-6 border-b border-foreground pb-2">
            Edit Profile
          </h2>

          <div className="space-y-6">
            {/* Current avatar preview */}
            <div className="flex items-center gap-4">
              <UserAvatar avatarUrl={selectedAvatar} username={username || null} size="lg" />
              <div>
                <p className="font-mono text-sm font-bold">{username || 'No name set'}</p>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider">Your Name</label>
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
            <div className="space-y-3">
              <label className="font-mono text-xs uppercase tracking-wider">Choose Avatar</label>
              <div className="grid grid-cols-4 gap-3">
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
                    <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
                        <span className="font-mono text-[10px] uppercase tracking-wider bg-background px-1.5 py-0.5">
                          Selected
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || !hasChanges || !username.trim() || !selectedAvatar}
              className="font-mono text-xs uppercase tracking-wider rounded-none border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-6 border-b border-foreground pb-2">
            Notifications
          </h2>
          <NotificationSettings />
        </section>

        {/* Sign Out */}
        <section className="border-t border-muted-foreground/30 pt-8">
          <Button
            onClick={signOut}
            variant="outline"
            className="font-mono text-xs uppercase tracking-wider rounded-none border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Sign Out
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Settings;
