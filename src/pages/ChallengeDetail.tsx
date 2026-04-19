import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2, Flame, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFriends } from '@/hooks/useFriends';

interface Participant {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface ChallengeTask {
  id: string;
  name: string;
  created_by: string;
}

interface TaskCompletion {
  task_id: string;
  user_id: string;
  completion_date: string;
}

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  goal: string;
  start_date: string;
  end_date: string;
  creator_id: string;
}

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteChallenge, leaveChallenge } = useFriends();

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tasks, setTasks] = useState<ChallengeTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);

    const [challengeRes, participantsRes, tasksRes, completionsRes] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase.from('challenge_participants').select('user_id').eq('challenge_id', id),
      supabase.from('challenge_tasks').select('*').eq('challenge_id', id).order('created_at'),
      supabase.from('challenge_task_completions').select('task_id, user_id, completion_date').eq('challenge_id', id),
    ]);

    if (challengeRes.data) setChallenge(challengeRes.data);

    if (participantsRes.data?.length) {
      const userIds = participantsRes.data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      setParticipants(
        userIds.map(uid => {
          const profile = profiles?.find(p => p.user_id === uid);
          return {
            user_id: uid,
            username: profile?.username || 'Unknown',
            avatar_url: profile?.avatar_url || null,
          };
        })
      );
    }

    setTasks(tasksRes.data || []);
    setCompletions(completionsRes.data || []);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTask = async () => {
    if (!newTaskName.trim() || !id || !user) return;
    const { error } = await supabase
      .from('challenge_tasks')
      .insert({ challenge_id: id, created_by: user.id, name: newTaskName.trim() });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewTaskName('');
      await fetchData();
    }
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('challenge_tasks').delete().eq('id', taskId);
    await fetchData();
  };

  const toggleCompletion = async (taskId: string) => {
    if (!user || !id) return;
    const existing = completions.find(
      c => c.task_id === taskId && c.user_id === user.id && c.completion_date === today
    );
    if (existing) {
      await supabase
        .from('challenge_task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('completion_date', today);
    } else {
      await supabase
        .from('challenge_task_completions')
        .insert({ task_id: taskId, challenge_id: id, user_id: user.id, completion_date: today });
    }
    await fetchData();
  };

  // Generate date range up to today
  const allDates = useMemo(() => {
    if (!challenge) return [];
    const dates: string[] = [];
    const current = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const todayDate = new Date(today);
    while (current <= end && current <= todayDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [challenge, today]);

  // Per-participant stats
  const participantStats = useMemo(() => {
    if (!tasks.length || !allDates.length) return [];
    const totalPossible = tasks.length * allDates.length;

    return participants.map(p => {
      const myCompletions = completions.filter(c => c.user_id === p.user_id);
      const completionSet = new Set(myCompletions.map(c => `${c.task_id}|${c.completion_date}`));
      const totalDone = myCompletions.length;
      const consistency = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

      // Per-date completion rate
      const dailyRates = allDates.map(date => {
        const doneCount = tasks.filter(t => completionSet.has(`${t.id}|${date}`)).length;
        return { date, rate: Math.round((doneCount / tasks.length) * 100) };
      });

      // Current streak (days where all tasks completed)
      let streak = 0;
      for (let i = dailyRates.length - 1; i >= 0; i--) {
        if (dailyRates[i].rate === 100) streak++;
        else break;
      }

      return { ...p, totalDone, consistency, dailyRates, streak };
    });
  }, [participants, completions, tasks, allDates]);

  const isActive = challenge && today >= challenge.start_date && today <= challenge.end_date;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm">Challenge not found</p>
      </div>
    );
  }

  const isCreator = challenge.creator_id === user?.id;

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this challenge for everyone? This cannot be undone.')) return;
    const res = await deleteChallenge(id);
    if (res.error) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Challenge deleted' });
      navigate('/friends');
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    if (!confirm('Leave this challenge? Your progress here will be hidden.')) return;
    const res = await leaveChallenge(id);
    if (res.error) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Left challenge' });
      navigate('/friends');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground">
        <div className="container max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <button onClick={() => navigate('/friends')} className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors">
            <ArrowLeft size={16} />
          </button>
          <Trophy size={20} />
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest truncate flex-1">{challenge.title}</h1>
          {isCreator ? (
            <button
              onClick={handleDelete}
              className="border border-destructive text-destructive p-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              title="Delete challenge"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
              title="Leave challenge"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Challenge Info */}
        <section className="border border-foreground p-5 space-y-2">
          <p className="font-mono text-xs text-muted-foreground">{challenge.goal}</p>
          {challenge.description && (
            <p className="font-mono text-xs text-muted-foreground italic">{challenge.description}</p>
          )}
          <p className="font-mono text-xs text-muted-foreground">
            {challenge.start_date} → {challenge.end_date}
          </p>
          <div className="flex gap-2 pt-2">
            {participants.map(p => (
              <div key={p.user_id} className="flex items-center gap-1">
                <UserAvatar avatarUrl={p.avatar_url} username={p.username} size="sm" />
                <span className="font-mono text-xs">{p.username}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Add Task */}
        {isActive && (
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-3">Add Something to Track</h2>
            <div className="flex gap-3">
              <input
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="e.g. Read 30 min, No sugar, Workout..."
                className="flex-1 bg-background border border-foreground px-4 py-3 font-mono text-sm"
              />
              <button
                onClick={addTask}
                disabled={!newTaskName.trim()}
                className="border border-foreground px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </section>
        )}

        {/* Today's Tasks */}
        {tasks.length > 0 && isActive && (
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-3">Today's Tasks</h2>
            <div className="space-y-2">
              {tasks.map(task => {
                const isDone = completions.some(
                  c => c.task_id === task.id && c.user_id === user?.id && c.completion_date === today
                );
                return (
                  <div key={task.id} className="border border-foreground p-3 flex items-center justify-between">
                    <button
                      onClick={() => toggleCompletion(task.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                        isDone ? 'bg-primary border-primary' : 'border-foreground'
                      }`}>
                        {isDone && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <span className={`font-mono text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                        {task.name}
                      </span>
                    </button>
                    {task.created_by === user?.id && (
                      <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tasks.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground text-center py-8">
            No tasks added yet. Add something both of you want to track!
          </p>
        )}

        {/* Participant Overview Cards */}
        {participantStats.length > 0 && tasks.length > 0 && (
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-3">Progress Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participantStats.map(p => (
                <div key={p.user_id} className={`border p-4 space-y-2 ${p.user_id === user?.id ? 'border-primary' : 'border-foreground/30'}`}>
                  <div className="flex items-center gap-2">
                    <UserAvatar avatarUrl={p.avatar_url} username={p.username} size="sm" />
                    <span className="font-mono text-xs font-bold truncate">
                      {p.username}{p.user_id === user?.id ? ' (You)' : ''}
                    </span>
                    <div className="ml-auto flex items-center gap-1 text-primary">
                      <Flame size={14} />
                      <span className="font-mono text-xs font-bold">{p.streak}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>{p.totalDone}/{tasks.length * allDates.length} completions</span>
                    <span>{p.consistency}%</span>
                  </div>
                  <div className="bg-muted h-2 w-full">
                    <div className="h-full bg-primary transition-all" style={{ width: `${p.consistency}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Consistency Comparison Graph */}
        {participantStats.length >= 2 && allDates.length > 0 && tasks.length > 0 && (
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest mb-3">Consistency Comparison</h2>
            <div className="border border-foreground p-4 space-y-4">
              {/* Line-style bar chart per day */}
              <div className="space-y-1">
                {participantStats.map((p, idx) => (
                  <div key={p.user_id} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] w-16 truncate text-muted-foreground">
                      {p.username?.slice(0, 8)}
                    </span>
                    <div className="flex gap-[2px] flex-1 flex-wrap">
                      {p.dailyRates.map(d => (
                        <div
                          key={d.date}
                          title={`${d.date}: ${d.rate}%`}
                          className={`w-3 h-3 sm:w-4 sm:h-4 border transition-colors ${
                            d.rate === 100
                              ? 'bg-primary border-primary'
                              : d.rate > 0
                                ? 'bg-primary/40 border-primary/40'
                                : 'bg-muted border-foreground/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary border border-primary" />
                  <span>All done</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary/40 border border-primary/40" />
                  <span>Partial</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-muted border border-foreground/10" />
                  <span>Missed</span>
                </div>
              </div>

              {/* Head to Head */}
              {participantStats.length === 2 && (
                <div className="border-t border-foreground/20 pt-3">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-2">Head to Head</h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold flex-1 text-right truncate">
                      {participantStats[0].username}
                    </span>
                    <div className="flex-[2] h-4 flex bg-muted relative overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${participantStats[0].consistency}%` }} />
                      <div className="h-full bg-accent transition-all absolute right-0" style={{ width: `${participantStats[1].consistency}%` }} />
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

              {/* Per-task breakdown */}
              <div className="border-t border-foreground/20 pt-3">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-2">Per Task Breakdown</h4>
                <div className="space-y-2">
                  {tasks.map(task => {
                    const stats = participantStats.map(p => {
                      const taskCompletions = completions.filter(
                        c => c.task_id === task.id && c.user_id === p.user_id
                      );
                      const rate = allDates.length > 0
                        ? Math.round((taskCompletions.length / allDates.length) * 100)
                        : 0;
                      return { ...p, rate, count: taskCompletions.length };
                    });

                    return (
                      <div key={task.id} className="space-y-1">
                        <p className="font-mono text-xs font-bold">{task.name}</p>
                        {stats.map(s => (
                          <div key={s.user_id} className="flex items-center gap-2">
                            <span className="font-mono text-[10px] w-16 truncate text-muted-foreground">
                              {s.username?.slice(0, 8)}
                            </span>
                            <div className="flex-1 bg-muted h-3">
                              <div
                                className={`h-full transition-all ${s.user_id === user?.id ? 'bg-primary' : 'bg-accent'}`}
                                style={{ width: `${s.rate}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] w-8 text-right">{s.rate}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ChallengeDetail;
