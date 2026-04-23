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

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[quoteIdx];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow following theme accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
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

      {/* Top status bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hidden md:block">
        ZYSTEM // SECURE.NODE.01 // {new Date().getUTCFullYear()}
      </div>

      {/* Bottom rotating motivational quote */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 text-center">
        <div key={quoteIdx} className="animate-fade-in">
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.25em] text-foreground/80 leading-relaxed">
            "{quote.text}"
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground mt-3">
            — {quote.author}
          </p>
        </div>
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
