import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Calendar, CheckSquare, ListTodo, Target, Activity, StickyNote, FolderOpen } from 'lucide-react';
import { YearCalendar } from '@/components/YearCalendar';
import { DailyHabits } from '@/components/DailyHabits';
import { BucketList } from '@/components/BucketList';
import { TodoList } from '@/components/TodoList';
import { YearSelector } from '@/components/YearSelector';
import { RealTimeClock } from '@/components/RealTimeClock';
import { HabitRadarChart } from '@/components/HabitRadarChart';
import { StreakCounter } from '@/components/StreakCounter';
import { DeadlineReminder } from '@/components/DeadlineReminder';
import { UserAvatar } from '@/components/UserAvatar';
import { BodyMetricsPanel } from '@/components/BodyMetrics';
import { MuscleTracker } from '@/components/MuscleTracker';
import { useHabitData } from '@/hooks/useHabitData';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAvatarTheme } from '@/hooks/useTheme';


const Index = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, isProfileComplete, hasLoadedProfile } = useProfile();
  const navigate = useNavigate();
  useAvatarTheme();
  
  const {
    data,
    loading: dataLoading,
    toggleHabitCompletion,
    addHabit,
    editHabit,
    deleteHabit,
    addBucketItem,
    toggleBucketItem,
    removeBucketItem,
    addTodo,
    toggleTodo,
    removeTodo
  } = useHabitData();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !profileLoading && hasLoadedProfile && user && !isProfileComplete) {
      navigate('/profile-setup');
    }
  }, [user, authLoading, profileLoading, hasLoadedProfile, isProfileComplete, navigate]);

  if (authLoading || profileLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-wider">Loading...</p>
      </div>
    );
  }

  if (!user || (hasLoadedProfile && !isProfileComplete)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-foreground">
        <div className="container max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Zystem" className="w-8 h-8" />
            <h1 className="font-mono text-lg font-bold uppercase tracking-widest">
              Zystem
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar 
                avatarUrl={profile?.avatar_url || null} 
                username={profile?.username || null}
                size="sm"
              />
              <span className="font-mono text-xs uppercase tracking-wider hidden sm:block">
                {profile?.username}
              </span>
            </div>
            <button
              onClick={() => navigate('/notes')}
              className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
              title="Notes"
            >
              <StickyNote size={16} />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-muted-foreground/20">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Calendar },
              { id: 'body-metrics', label: 'Body', icon: Activity },
              { id: 'habits', label: 'Habits', icon: CheckSquare },
              { id: 'todos', label: 'Todos', icon: ListTodo },
              { id: 'bucket-list', label: 'Bucket List', icon: Target },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container max-w-7xl mx-auto px-6 py-12">
        <RealTimeClock />
        
        <YearSelector year={year} onYearChange={setYear} />
        
        {/* Dashboard Grid: Left content + Right radar chart */}
        <div id="dashboard" className="scroll-mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left side - Main content */}
          <div className="lg:col-span-2">
            <YearCalendar
              year={year}
              habitCompletions={data.habitCompletions}
              habitList={data.habitList}
            />
            
            {/* Deadline Reminders - below calendar */}
            <DeadlineReminder todos={data.todos} />
          </div>
          
          {/* Right side - Streak Counter + Radar Chart */}
          
          {/* Right side - Streak Counter + Radar Chart */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <StreakCounter
              habitCompletions={data.habitCompletions}
              habitList={data.habitList}
            />
            <div className="flex-1 min-h-0">
              <HabitRadarChart
                habitCompletions={data.habitCompletions}
                habitList={data.habitList}
                year={year}
              />
            </div>
          </div>
        </div>

        <div className="section-divider" />

        <div id="body-metrics" className="scroll-mt-16 mb-12">
          <h2 className="section-title">Body Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BodyMetricsPanel />
          </div>
          <MuscleTracker />
        </div>

        <div className="section-divider" />

        <div id="habits" className="scroll-mt-16">
        <DailyHabits
          habitCompletions={data.habitCompletions}
          habitList={data.habitList}
          onToggle={toggleHabitCompletion}
          onAddHabit={addHabit}
          onEditHabit={editHabit}
          onDeleteHabit={deleteHabit}
        />
        </div>

        <div className="section-divider" />

        <div id="todos" className="scroll-mt-16">
        <TodoList
          todos={data.todos}
          onAdd={addTodo}
          onToggle={toggleTodo}
          onRemove={removeTodo}
        />
        </div>

        <div className="section-divider" />

        <div id="bucket-list" className="scroll-mt-16">
        <BucketList
          year={year}
          items={data.bucketList}
          onAdd={addBucketItem}
          onToggle={toggleBucketItem}
          onRemove={removeBucketItem}
        />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground mt-24">
        <div className="container max-w-6xl mx-auto px-6 py-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            A Zyphor Product
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
