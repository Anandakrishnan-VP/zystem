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

    const [createdChallengesRes, participationsRes] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('creator_id', user.id),
      supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id),
    ]);

    if (createdChallengesRes.error) {
      console.error('Failed to fetch created challenges', createdChallengesRes.error);
    }

    if (participationsRes.error) {
      console.error('Failed to fetch challenge participations', participationsRes.error);
    }

    const challengeIds = [
      ...(createdChallengesRes.data?.map(challenge => challenge.id) || []),
      ...(participationsRes.data?.map(participation => participation.challenge_id) || []),
    ];

    const uniqueChallengeIds = [...new Set(challengeIds)];

    if (!uniqueChallengeIds.length) {
      setChallenges([]);
      return;
    }

    const { data: challengeData, error: challengeDataError } = await supabase
      .from('challenges')
      .select('*')
      .in('id', uniqueChallengeIds);

    if (challengeDataError) {
      console.error('Failed to fetch challenge data', challengeDataError);
      setChallenges([]);
      return;
    }

    if (!challengeData?.length) {
      setChallenges([]);
      return;
    }

    const [participantsRes, checkinsRes] = await Promise.all([
      supabase
        .from('challenge_participants')
        .select('*')
        .in('challenge_id', uniqueChallengeIds),
      supabase
        .from('challenge_checkins')
        .select('*')
        .in('challenge_id', uniqueChallengeIds),
    ]);

    if (participantsRes.error) {
      console.error('Failed to fetch challenge participants', participantsRes.error);
    }

    if (checkinsRes.error) {
      console.error('Failed to fetch challenge checkins', checkinsRes.error);
    }

    const allParticipants = participantsRes.data || [];
    const allCheckins = checkinsRes.data || [];

    const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
    let profiles: Array<{ user_id: string; username: string | null; avatar_url: string | null }> = [];

    if (participantUserIds.length) {
      const { data: profileData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', participantUserIds);

      if (profilesError) {
        console.error('Failed to fetch challenge participant profiles', profilesError);
      }

      profiles = profileData || [];
    }

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

    setChallenges(
      enrichedChallenges.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
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
    if (!user) return { error: 'Not logged in' };

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({ creator_id: user.id, title, description, goal, start_date: startDate, end_date: endDate })
      .select()
      .single();

    if (error || !challenge) {
      return { error: error?.message || 'Could not create challenge' };
    }

    const { error: creatorParticipantError } = await supabase
      .from('challenge_participants')
      .insert({ challenge_id: challenge.id, user_id: user.id });

    if (creatorParticipantError) {
      console.error('Failed to add creator to challenge', creatorParticipantError);
      await fetchChallenges();
      return { error: creatorParticipantError.message };
    }

    for (const friendId of inviteFriendIds) {
      const { error: inviteError } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challenge.id, user_id: friendId });

      if (inviteError) {
        console.error(`Failed to invite user ${friendId} to challenge`, inviteError);
        await fetchChallenges();
        return { error: inviteError.message };
      }
    }

    await fetchChallenges();
    return { error: null, challengeId: challenge.id };
  };

  const checkinChallenge = async (challengeId: string) => {
    if (!user) return { error: 'Not logged in' };
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('challenge_checkins')
      .insert({ challenge_id: challengeId, user_id: user.id, checkin_date: today });

    if (error && !error.message.toLowerCase().includes('duplicate')) {
      console.error('Failed to check in to challenge', error);
      return { error: error.message };
    }

    await fetchChallenges();
    return { error: null };
  };

  const deleteChallenge = async (challengeId: string) => {
    if (!user) return { error: 'Not logged in' };
    // Best-effort cleanup of dependent rows (RLS allows own deletes; creator deletes challenge)
    await supabase.from('challenge_task_completions').delete().eq('challenge_id', challengeId);
    await supabase.from('challenge_tasks').delete().eq('challenge_id', challengeId);
    await supabase.from('challenge_checkins').delete().eq('challenge_id', challengeId);
    await supabase.from('challenge_participants').delete().eq('challenge_id', challengeId);
    const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
    if (error) return { error: error.message };
    await fetchChallenges();
    return { error: null };
  };

  const leaveChallenge = async (challengeId: string) => {
    if (!user) return { error: 'Not logged in' };
    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id);
    if (error) return { error: error.message };
    await fetchChallenges();
    return { error: null };
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
    deleteChallenge,
    leaveChallenge,
    getFriendStreak,
    refetch: fetchAll,
  };
};
