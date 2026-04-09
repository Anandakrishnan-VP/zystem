import { useMemo } from 'react';
import { Check, Flame } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { type Challenge } from '@/hooks/useFriends';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onCheckin: (challengeId: string) => void;
}

const ChallengeCard = ({ challenge, currentUserId, onCheckin }: ChallengeCardProps) => {
  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isActive = today >= challenge.start_date && today <= challenge.end_date;
  const myParticipant = challenge.participants?.find(p => p.user_id === currentUserId);
  const hasCheckedInToday = myParticipant?.checkins?.includes(today);

  // Generate all dates in range for the graph
  const allDates = useMemo(() => {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    const todayDate = new Date(today);
    while (current <= end && current <= todayDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [challenge.start_date, challenge.end_date, today]);

  // Calculate streaks for each participant
  const participantStats = useMemo(() => {
    return (challenge.participants || []).map(p => {
      const checkinSet = new Set(p.checkins || []);
      const consistency = allDates.length > 0
        ? Math.round((checkinSet.size / allDates.length) * 100)
        : 0;

      // Current streak
      let currentStreak = 0;
      for (let i = allDates.length - 1; i >= 0; i--) {
        if (checkinSet.has(allDates[i])) currentStreak++;
        else break;
      }

      return {
        ...p,
        checkinSet,
        consistency,
        currentStreak,
        totalCheckins: checkinSet.size,
      };
    });
  }, [challenge.participants, allDates]);

  return (
    <div className="border border-foreground p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider">{challenge.title}</h3>
          <p className="font-mono text-xs text-muted-foreground mt-1">{challenge.goal}</p>
          {challenge.description && (
            <p className="font-mono text-xs text-muted-foreground mt-1 italic">{challenge.description}</p>
          )}
        </div>
        {isActive && !hasCheckedInToday && (
          <button
            onClick={() => onCheckin(challenge.id)}
            className="border border-primary bg-primary text-primary-foreground px-4 py-2 font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Check size={14} />
            Check In
          </button>
        )}
        {hasCheckedInToday && (
          <span className="font-mono text-xs text-primary uppercase flex items-center gap-1">
            <Check size={14} /> Done Today
          </span>
        )}
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        {challenge.start_date} → {challenge.end_date} · {totalDays} days
      </p>

      {/* Participant Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {participantStats.map(p => (
          <div key={p.user_id} className={`border p-3 space-y-2 ${p.user_id === currentUserId ? 'border-primary' : 'border-foreground/30'}`}>
            <div className="flex items-center gap-2">
              <UserAvatar avatarUrl={p.avatar_url || null} username={p.username || null} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold truncate">
                  {p.username}{p.user_id === currentUserId ? ' (You)' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 text-primary">
                <Flame size={14} />
                <span className="font-mono text-xs font-bold">{p.currentStreak}</span>
              </div>
            </div>
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>{p.totalCheckins}/{allDates.length} days</span>
              <span>{p.consistency}%</span>
            </div>
            {/* Mini progress bar */}
            <div className="bg-muted h-2 w-full">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${p.consistency}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Consistency Comparison Graph */}
      {allDates.length > 0 && participantStats.length >= 2 && (
        <div className="space-y-2">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider">Consistency Comparison</h4>
          <div className="border border-foreground/20 p-3">
            {/* Day-by-day grid */}
            <div className="space-y-1">
              {participantStats.map(p => (
                <div key={p.user_id} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] w-16 truncate text-muted-foreground">
                    {p.username?.slice(0, 8)}
                  </span>
                  <div className="flex gap-[2px] flex-1 flex-wrap">
                    {allDates.map(date => (
                      <div
                        key={date}
                        title={`${date}: ${p.checkinSet.has(date) ? '✓' : '✗'}`}
                        className={`w-3 h-3 sm:w-4 sm:h-4 border transition-colors ${
                          p.checkinSet.has(date)
                            ? 'bg-primary border-primary'
                            : 'bg-muted border-foreground/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary border border-primary" />
                <span>Checked in</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-muted border border-foreground/10" />
                <span>Missed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Head-to-head summary for 2-person challenges */}
      {participantStats.length === 2 && (
        <div className="border border-foreground/20 p-3">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-2">Head to Head</h4>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold flex-1 text-right truncate">
              {participantStats[0].username}
            </span>
            <div className="flex-[2] h-4 flex bg-muted relative overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${participantStats[0].consistency}%` }}
              />
              <div
                className="h-full bg-accent transition-all absolute right-0"
                style={{ width: `${participantStats[1].consistency}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold flex-1 truncate">
              {participantStats[1].username}
            </span>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1">
            <span>{participantStats[0].consistency}%</span>
            <span>{participantStats[1].consistency}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
