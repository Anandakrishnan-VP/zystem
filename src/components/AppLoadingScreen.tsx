export const AppLoadingScreen = ({ label = 'Loading Zystem' }: { label?: string }) => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center overflow-hidden">
    <div className="relative flex flex-col items-center gap-8">
      <div className="loading-orbit" aria-hidden="true">
        <span className="loading-cube loading-cube-a" />
        <span className="loading-cube loading-cube-b" />
        <span className="loading-cube loading-cube-c" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest">{label}</p>
        <div className="flex justify-center gap-1" aria-hidden="true">
          <span className="loading-tick" />
          <span className="loading-tick animation-delay-150" />
          <span className="loading-tick animation-delay-300" />
        </div>
      </div>
    </div>
  </div>
);