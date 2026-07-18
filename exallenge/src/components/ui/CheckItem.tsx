type CheckItemProps = {
  children: string;
  positive?: boolean;
};

export function CheckItem({ children, positive = true }: CheckItemProps) {
  return (
    <li className="flex items-start gap-3 text-sm sm:text-[15px]">
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
          positive
            ? "bg-success/15 text-success"
            : "bg-danger/15 text-danger"
        }`}
      >
        {positive ? "✓" : "✕"}
      </span>
      <span className={positive ? "text-foreground/90" : "text-muted"}>
        {children}
      </span>
    </li>
  );
}
