import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, UserPlus, Check, X, Users, Trophy, Flame, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFriends, Friend } from '@/hooks/useFriends';
import { UserAvatar } from '@/components/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import ChallengeCard from '@/components/ChallengeCard';

const Friends = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    myCode, friends, pendingRequests, sentRequests, challenges,
    loading, sendRequest, acceptRequest, rejectRequest, removeFriend,
    createChallenge, checkinChallenge, getFriendStreak,
  } = useFriends();

  const [friendCode, setFriendCode] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [friendStreaks, setFriendStreaks] = useState<Record<string, number>>({});
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: '', description: '', goal: '', startDate: '', endDate: '', invitees: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Fetch streaks for friends
  useEffect(() => {
    if (friends.length === 0) return;
    friends.forEach(async (f) => {
      const streak = await getFriendStreak(f.user_id);
      setFriendStreaks(prev => ({ ...prev, [f.user_id]: streak }));
    });
  }, [friends, getFriendStreak]);

  const handleCopyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(String(myCode));
      toast({ title: 'Copied!', description: 'Friend code copied to clipboard' });
    }
  };

  const handleSendRequest = async () => {
    if (!friendCode.trim()) return;
    setSendingRequest(true);
    const result = await sendRequest(Number(friendCode));
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Request Sent!', description: 'Friend request sent successfully' });
      setFriendCode('');
    }
    setSendingRequest(false);
  };

  const handleCreateChallenge = async () => {
    if (!challengeForm.title || !challengeForm.goal || !challengeForm.startDate || !challengeForm.endDate) {
      toast({ title: 'Error', description: 'Fill all required fields', variant: 'destructive' });
      return;
    }

    const result = await createChallenge(
      challengeForm.title, challengeForm.description, challengeForm.goal,
      challengeForm.startDate, challengeForm.endDate, challengeForm.invitees
    );

    if (result?.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      return;
    }

    setShowCreateChallenge(false);
    setChallengeForm({ title: '', description: '', goal: '', startDate: '', endDate: '', invitees: [] });
    toast({ title: 'Challenge Created!' });

    if (result?.challengeId) {
      navigate(`/challenge/${result.challengeId}`);
    }
  };

  const toggleInvitee = (userId: string) => {
    setChallengeForm(prev => ({
      ...prev,
      invitees: prev.invitees.includes(userId)
        ? prev.invitees.filter(id => id !== userId)
        : [...prev.invitees, userId],
    }));
  };

  const today = new Date().toISOString().split('T')[0];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-foreground">
        <div className="container max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors">
            <ArrowLeft size={16} />
          </button>
          <Users size={20} />
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest">Friends</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* My Friend Code */}
        <section>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-4">Your Friend Code</h2>
          <div className="border border-foreground p-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-3xl font-bold tracking-[0.3em]">#{myCode || '------'}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">Share this code with friends</p>
            </div>
            <button onClick={handleCopyCode} className="border border-foreground p-3 hover:bg-foreground hover:text-background transition-colors" title="Copy">
              <Copy size={18} />
            </button>
          </div>
        </section>

        {/* Add Friend */}
        <section>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-4">Add Friend</h2>
          <div className="flex gap-3">
            <input
              type="number"
              value={friendCode}
              onChange={e => setFriendCode(e.target.value)}
              placeholder="Enter friend code"
              className="flex-1 bg-background border border-foreground px-4 py-3 font-mono text-sm"
            />
            <button
              onClick={handleSendRequest}
              disabled={sendingRequest || !friendCode.trim()}
              className="border border-foreground px-6 py-3 font-mono text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus size={16} />
              Send
            </button>
          </div>
        </section>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-4">
              Friend Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div key={req.id} className="border border-foreground p-4 flex items-center justify-between">
                  <span className="font-mono text-sm">{req.sender_username} wants to be friends</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id, req.sender_id)}
                      className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="border border-foreground p-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-4">Sent Requests</h2>
            <div className="space-y-3">
              {sentRequests.map(req => (
                <div key={req.id} className="border border-muted-foreground/30 p-4 flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">
                    Pending: {req.receiver_username}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground uppercase">Waiting</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-4">
            Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">No friends yet. Share your code to connect!</p>
          ) : (
            <div className="space-y-3">
              {friends.map(f => (
                <div key={f.user_id} className="border border-foreground p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar avatarUrl={f.avatar_url} username={f.username} size="sm" />
                    <div>
                      <p className="font-mono text-sm font-bold">{f.username}</p>
                      <p className="font-mono text-xs text-muted-foreground">#{f.friend_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-primary">
                      <Flame size={16} />
                      <span className="font-mono text-sm font-bold">{friendStreaks[f.user_id] ?? '...'}</span>
                    </div>
                    <button
                      onClick={() => removeFriend(f.friendship_id)}
                      className="font-mono text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Grow Together - Challenges */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Trophy size={16} /> Grow Together
            </h2>
            <button
              onClick={() => setShowCreateChallenge(!showCreateChallenge)}
              className="border border-foreground px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors flex items-center gap-2"
            >
              <Plus size={14} />
              New Challenge
            </button>
          </div>

          {/* Create Challenge Form */}
          {showCreateChallenge && (
            <div className="border border-foreground p-6 mb-6 space-y-4">
              <input
                value={challengeForm.title}
                onChange={e => setChallengeForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Challenge title *"
                className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
              />
              <input
                value={challengeForm.goal}
                onChange={e => setChallengeForm(p => ({ ...p, goal: e.target.value }))}
                placeholder="Goal (e.g. 'Drink 8 bottles daily') *"
                className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
              />
              <textarea
                value={challengeForm.description}
                onChange={e => setChallengeForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm min-h-[60px]"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider block mb-1">Start *</label>
                  <input
                    type="date"
                    value={challengeForm.startDate}
                    onChange={e => setChallengeForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider block mb-1">End *</label>
                  <input
                    type="date"
                    value={challengeForm.endDate}
                    onChange={e => setChallengeForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-background border border-foreground px-3 py-2 font-mono text-sm"
                  />
                </div>
              </div>

              {friends.length > 0 && (
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider block mb-2">Invite Friends</label>
                  <div className="flex flex-wrap gap-2">
                    {friends.map(f => (
                      <button
                        key={f.user_id}
                        onClick={() => toggleInvitee(f.user_id)}
                        className={`border px-3 py-1 font-mono text-xs transition-colors ${
                          challengeForm.invitees.includes(f.user_id)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-foreground hover:bg-muted'
                        }`}
                      >
                        {f.username}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCreateChallenge}
                  className="border border-foreground bg-foreground text-background px-6 py-2 font-mono text-xs uppercase tracking-wider hover:bg-background hover:text-foreground transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateChallenge(false)}
                  className="border border-foreground px-6 py-2 font-mono text-xs uppercase tracking-wider hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Challenge Cards */}
          {challenges.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              No challenges yet. Create one and invite friends to grow together!
            </p>
          ) : (
            <div className="space-y-4">
              {challenges.map(c => (
                <div key={c.id} onClick={() => navigate(`/challenge/${c.id}`)} className="cursor-pointer">
                  <ChallengeCard
                    challenge={c}
                    currentUserId={user?.id || ''}
                    onCheckin={(cid) => { /* prevent nav */ checkinChallenge(cid); }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Friends;
