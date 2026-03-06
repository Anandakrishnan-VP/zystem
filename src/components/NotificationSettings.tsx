import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export const NotificationSettings = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [todoReminders, setTodoReminders] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    // Load saved preferences
    const saved = localStorage.getItem('notification_prefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      setTodoReminders(prefs.todoReminders ?? false);
      setDailyReminder(prefs.dailyReminder ?? false);
    }
  }, []);

  const savePrefs = (todoR: boolean, dailyR: boolean) => {
    localStorage.setItem('notification_prefs', JSON.stringify({
      todoReminders: todoR,
      dailyReminder: dailyR,
    }));
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    if (Notification.permission === 'granted') return true;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'denied') {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
      return false;
    }

    return result === 'granted';
  };

  const handleTodoReminders = async (checked: boolean) => {
    if (checked) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setTodoReminders(checked);
    savePrefs(checked, dailyReminder);

    if (checked) {
      scheduleDeadlineCheck();
      toast({ title: 'Todo reminders enabled', description: 'You\'ll be notified before deadlines.' });
    }
  };

  const handleDailyReminder = async (checked: boolean) => {
    if (checked) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setDailyReminder(checked);
    savePrefs(todoReminders, checked);

    if (checked) {
      scheduleDailyReminder();
      toast({ title: 'Daily reminder enabled', description: 'You\'ll be reminded to log your habits.' });
    }
  };

  return (
    <div className="border border-foreground p-4">
      <div className="flex items-center gap-2 mb-4">
        {permission === 'granted' ? (
          <Bell className="w-4 h-4 text-foreground" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground" />
        )}
        <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
          Notifications
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider">Todo Deadline Reminders</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              Get notified a day before deadlines
            </p>
          </div>
          <Switch
            checked={todoReminders}
            onCheckedChange={handleTodoReminders}
          />
        </div>

        <div className="border-t border-muted-foreground/20" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider">Daily Login Reminder</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              Remind me to log habits every evening
            </p>
          </div>
          <Switch
            checked={dailyReminder}
            onCheckedChange={handleDailyReminder}
          />
        </div>
      </div>
    </div>
  );
};

// Schedule periodic check for upcoming deadlines
function scheduleDeadlineCheck() {
  // Check every hour for upcoming deadlines
  const checkDeadlines = () => {
    const prefs = localStorage.getItem('notification_prefs');
    if (!prefs) return;
    const { todoReminders } = JSON.parse(prefs);
    if (!todoReminders) return;

    const lastCheck = localStorage.getItem('last_deadline_check');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastCheck === today) return; // Already checked today
    localStorage.setItem('last_deadline_check', today);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // We'll trigger a notification reminding about deadlines
    if (Notification.permission === 'granted') {
      new Notification('📋 Deadline Reminder', {
        body: `Check your tasks — you may have deadlines coming up tomorrow (${tomorrowStr})!`,
        icon: '/favicon.ico',
      });
    }
  };

  // Run check now and then every hour
  checkDeadlines();
  setInterval(checkDeadlines, 60 * 60 * 1000);
}

// Schedule daily reminder to log habits
function scheduleDailyReminder() {
  const checkDaily = () => {
    const prefs = localStorage.getItem('notification_prefs');
    if (!prefs) return;
    const { dailyReminder } = JSON.parse(prefs);
    if (!dailyReminder) return;

    const now = new Date();
    const hour = now.getHours();

    // Send reminder at 8 PM (20:00)
    if (hour === 20) {
      const lastReminder = localStorage.getItem('last_daily_reminder');
      const today = now.toISOString().split('T')[0];
      
      if (lastReminder === today) return;
      localStorage.setItem('last_daily_reminder', today);

      if (Notification.permission === 'granted') {
        new Notification('🔥 Don\'t break your streak!', {
          body: 'Time to log your habits for today. Keep the momentum going!',
          icon: '/favicon.ico',
        });
      }
    }
  };

  // Check every 30 minutes
  checkDaily();
  setInterval(checkDaily, 30 * 60 * 1000);
}
