import { useEffect, useState } from 'react';

const QUOTES = [
  { text: 'DISCIPLINE EQUALS FREEDOM', author: 'JOCKO WILLINK' },
  { text: 'THE PAIN YOU FEEL TODAY WILL BE THE STRENGTH YOU FEEL TOMORROW', author: 'ARNOLD' },
  { text: 'SUFFER THE PAIN OF DISCIPLINE OR SUFFER THE PAIN OF REGRET', author: 'JIM ROHN' },
  { text: 'WE ARE WHAT WE REPEATEDLY DO', author: 'ARISTOTLE' },
  { text: 'THE ONLY WAY OUT IS THROUGH', author: 'ROBERT FROST' },
  { text: 'HARD CHOICES, EASY LIFE. EASY CHOICES, HARD LIFE', author: 'JERZY GREGOREK' },
  { text: 'BECOME SO STRONG THAT NOTHING CAN DISTURB YOUR PEACE', author: 'UNKNOWN' },
  { text: 'THE MAN WHO MOVES A MOUNTAIN BEGINS BY CARRYING AWAY SMALL STONES', author: 'CONFUCIUS' },
];

export const AuthBackground = () => {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Normalized -1..1 from screen center
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMouse({ x, y });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const quote = QUOTES[quoteIdx];
  const px = (mult: number) => `${mouse.x * mult}px`;
  const py = (mult: number) => `${mouse.y * mult}px`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid lines — drift with cursor */}
      <div
        className="absolute -inset-12 opacity-[0.07] transition-transform duration-[600ms] ease-out"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          transform: `translate3d(${px(-14)}, ${py(-14)}, 0)`,
        }}
      />

      {/* Floating 3D planes — parallax */}
      <div
        className="absolute left-[10%] top-[24%] h-40 w-40 border border-foreground/20 bg-background/10 backdrop-blur-sm auth-depth-panel auth-depth-panel-left transition-transform duration-[500ms] ease-out"
        style={{ translate: `${px(28)} ${py(28)}` }}
      />
      <div
        className="absolute right-[12%] bottom-[22%] h-48 w-48 border border-foreground/20 bg-background/10 backdrop-blur-sm auth-depth-panel auth-depth-panel-right transition-transform duration-[500ms] ease-out"
        style={{ translate: `${px(-36)} ${py(-36)}` }}
      />

      {/* Radial glow follows the cursor */}
      <div
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl pointer-events-none transition-transform duration-[700ms] ease-out"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
          transform: `translate3d(calc(-50% + ${px(80)}), calc(-50% + ${py(80)}), 0)`,
        }}
      />

      {/* Crosshair markers in corners */}
      <CornerMark className="top-6 left-6" />
      <CornerMark className="top-6 right-6 rotate-90" />
      <CornerMark className="bottom-6 left-6 -rotate-90" />
      <CornerMark className="bottom-6 right-6 rotate-180" />

      {/* Vertical edge ticks (left) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-px bg-foreground/40"
            style={{ width: i % 4 === 0 ? '24px' : '10px' }}
          />
        ))}
      </div>

      {/* Vertical edge ticks (right) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 items-end">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-px bg-foreground/40"
            style={{ width: i % 4 === 0 ? '24px' : '10px' }}
          />
        ))}
      </div>

      {/* Rotating motivational quote — always above the auth card */}
      <div className="absolute top-6 md:top-8 left-1/2 z-20 -translate-x-1/2 w-full max-w-3xl px-6 text-center">
        <div key={quoteIdx} className="animate-fade-in rounded-sm border border-foreground/15 bg-background/10 px-4 py-3 backdrop-blur-sm shadow-2xl">
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.22em] text-foreground/90 leading-relaxed text-balance">
            "{quote.text}"
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground mt-2">
            — {quote.author}
          </p>
        </div>
      </div>

      {/* Bottom Zyphor footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        A <span className="font-bold text-foreground/80">Zyphor</span> product
      </div>

      {/* Faint coordinate label top-right */}
      <div className="absolute top-6 right-1/2 translate-x-[140px] font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 hidden lg:block">
        N 00°00'00"
      </div>
    </div>
  );
};

const CornerMark = ({ className = '' }: { className?: string }) => (
  <div className={`absolute w-12 h-12 ${className}`}>
    <div className="absolute top-0 left-0 w-full h-px bg-foreground/60" />
    <div className="absolute top-0 left-0 h-full w-px bg-foreground/60" />
    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-foreground/60" />
  </div>
);
