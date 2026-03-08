import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
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
import { useHabitData } from '@/hooks/useHabitData';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';


const Index = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, isProfileComplete, hasLoadedProfile } = useProfile();
  const navigate = useNavigate();
  
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
        <div className="container max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest">
            Habit Tracker
          </h1>
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
              onClick={() => navigate('/settings')}
              className="border border-foreground p-2 hover:bg-foreground hover:text-background transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-7xl mx-auto px-6 py-12">
        <RealTimeClock />
        
        <YearSelector year={year} onYearChange={setYear} />
        
        {/* Dashboard Grid: Left content + Right radar chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
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

        <DailyHabits
          habitCompletions={data.habitCompletions}
          habitList={data.habitList}
          onToggle={toggleHabitCompletion}
          onAddHabit={addHabit}
          onEditHabit={editHabit}
          onDeleteHabit={deleteHabit}
        />

        <div className="section-divider" />

        <TodoList
          todos={data.todos}
          onAdd={addTodo}
          onToggle={toggleTodo}
          onRemove={removeTodo}
        />

        <div className="section-divider" />

        <BucketList
          year={year}
          items={data.bucketList}
          onAdd={addBucketItem}
          onToggle={toggleBucketItem}
          onRemove={removeBucketItem}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground mt-24">
        <div className="container max-w-6xl mx-auto px-6 py-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Built for discipline
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
