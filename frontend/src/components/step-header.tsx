"use client";

type Props = {
  title: string;
  sub?: string;
};

export default function StepHeader({ title, sub }: Props) {
  return (
    <div className="text-center">
      <span
        className="relative inline-block px-1 leading-tight z-0
        after:content-[''] after:absolute after:right-0 after:bottom-[0.08em]
        after:h-[0.45em] after:w-[100%] after:bg-primary/20 after:rounded after:-z-10"
      >
        {title}
      </span>
      {sub ? <p className="text-xs text-muted-foreground mt-1">{sub}</p> : null}
    </div>
  );
}
