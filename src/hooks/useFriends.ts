import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FriendCode {
  user_id: string;
  friend_code: number;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_username?: string;
  receiver_username?: string;
}

export interface Friend {
  user_id: string;
  username: string;
  avatar_url: string | null;
  friend_code: number;
  friendship_id: string;
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  goal: string;
  start_date: string;
  end_date: string;
  created_at: string;
  participants?: ChallengeParticipant[];
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  username?: string;
  avatar_url?: string | null;
  checkins?: string[]; // dates checked in
}

export const useFriends = () => {
  const { user } = useAuth();
  const [myCode, setMyCode] = useState<number | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCode = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friend_codes')
      .select('friend_code')
      .eq('user_id', user.id)
      .maybeSingle();
    setMyCode(data?.friend_code ?? null);
  }, [user]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    if (!friendships?.length) {
      setFriends([]);
      return;
    }

    const friendIds = friendships.map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', friendIds);

    const { data: codes } = await supabase
      .from('friend_codes')
      .select('user_id, friend_code')
      .in('user_id', friendIds);

    const friendList: Friend[] = friendIds.map(fid => {
      const profile = profiles?.find(p => p.user_id === fid);
      const code = codes?.find(c => c.user_id === fid);
      const friendship = friendships.find(f =>
        f.user_id_1 === fid || f.user_id_2 === fid
      );
      return {
        user_id: fid,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        friend_code: code?.friend_code || 0,
        friendship_id: friendship?.id || '',
      };
    });

    setFriends(friendList);
  }, [user]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    const { data: incoming } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    // Enrich with sender usernames
    if (incoming?.length) {
      const senderIds = incoming.map(r => r.sender_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', senderIds);
      
      const enriched = incoming.map(r => ({
        ...r,
        sender_username: profiles?.find(p => p.user_id === r.sender_id)?.username || 'Unknown',
      }));
      setPendingRequests(enriched);
    } else {
      setPendingRequests([]);
    }

    const { data: outgoing } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', user.id)
      .eq('status', 'pending');

    if (outgoing?.length) {
      const receiverIds = outgoing.map(r => r.receiver_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', receiverIds);
      
      const enriched = outgoing.map(r => ({
        ...r,
        receiver_username: profiles?.find(p => p.user_id === r.receiver_id)?.username || 'Unknown',
      }));
      setSentRequests(enriched);
    } else {
      setSentRequests([]);
    }
  }, [user]);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;

    const { data: myParticipations } = await supabase
      .from('challenge_participants')
      .select('challenge_id')
      .eq('user_id', user.id);

    if (!myParticipations?.length) {
      setChallenges([]);
      return;
    }

    const challengeIds = myParticipations.map(p => p.challenge_id);
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .in('id', challengeIds);

    if (!challengeData?.length) {
      setChallenges([]);
      return;
    }

    // Get all participants for these challenges
    const { data: allParticipants } = await supabase
      .from('challenge_participants')
      .select('*')
      .in('challenge_id', challengeIds);

    const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', participantUserIds);

    // Get all checkins
    const { data: allCheckins } = await supabase
      .from('challenge_checkins')
      .select('*')
      .in('challenge_id', challengeIds);

    const enrichedChallenges: Challenge[] = challengeData.map(c => ({
      ...c,
      participants: (allParticipants || [])
        .filter(p => p.challenge_id === c.id)
        .map(p => {
          const profile = profiles?.find(pr => pr.user_id === p.user_id);
          const checkins = (allCheckins || [])
            .filter(ch => ch.challenge_id === c.id && ch.user_id === p.user_id)
            .map(ch => ch.checkin_date);
          return {
            ...p,
            username: profile?.username || 'Unknown',
            avatar_url: profile?.avatar_url || null,
            checkins,
          };
        }),
    }));

    setChallenges(enrichedChallenges);
  }, [user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMyCode(), fetchFriends(), fetchRequests(), fetchChallenges()]);
    setLoading(false);
  }, [fetchMyCode, fetchFriends, fetchRequests, fetchChallenges]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sendRequest = async (friendCode: number) => {
    if (!user) return { error: 'Not logged in' };
    
    const { data: codeData } = await supabase
      .from('friend_codes')
      .select('user_id')
      .eq('friend_code', friendCode)
      .maybeSingle();

    if (!codeData) return { error: 'Friend code not found' };
    if (codeData.user_id === user.id) return { error: "You can't add yourself" };

    // Check if already friends
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${codeData.user_id}),and(user_id_1.eq.${codeData.user_id},user_id_2.eq.${user.id})`)
      .maybeSingle();

    if (existing) return { error: 'Already friends' };

    const { error } = await supabase
      .from('friend_requests')
      .insert({ sender_id: user.id, receiver_id: codeData.user_id });

    if (error) {
      if (error.message.includes('duplicate')) return { error: 'Request already sent' };
      return { error: error.message };
    }

    await fetchRequests();
    return { error: null };
  };

  const acceptRequest = async (requestId: string, senderId: string) => {
    if (!user) return;

    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    await supabase
      .from('friendships')
      .insert({ user_id_1: senderId, user_id_2: user.id });

    await Promise.all([fetchFriends(), fetchRequests()]);
  };

  const rejectRequest = async (requestId: string) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    await fetchRequests();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await fetchFriends();
  };

  const createChallenge = async (
    title: string,
    description: string,
    goal: string,
    startDate: string,
    endDate: string,
    inviteFriendIds: string[]
  ) => {
    if (!user) return;

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({ creator_id: user.id, title, description, goal, start_date: startDate, end_date: endDate })
      .select()
      .single();

    if (error || !challenge) return;

    // Add creator as participant
    const participants = [
      { challenge_id: challenge.id, user_id: user.id },
      ...inviteFriendIds.map(fid => ({ challenge_id: challenge.id, user_id: fid })),
    ];

    await supabase.from('challenge_participants').insert(participants);
    await fetchChallenges();
  };

  const checkinChallenge = async (challengeId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('challenge_checkins')
      .insert({ challenge_id: challengeId, user_id: user.id, checkin_date: today });

    await fetchChallenges();
  };

  const getFriendStreak = async (friendUserId: string) => {
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('completion_date')
      .eq('user_id', friendUserId)
      .eq('completed', true)
      .order('completion_date', { ascending: false });

    if (!completions?.length) return 0;

    const uniqueDates = [...new Set(completions.map(c => c.completion_date).filter(Boolean))].sort().reverse();
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      
      if (uniqueDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  return {
    myCode,
    friends,
    pendingRequests,
    sentRequests,
    challenges,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    createChallenge,
    checkinChallenge,
    getFriendStreak,
    refetch: fetchAll,
  };
};
