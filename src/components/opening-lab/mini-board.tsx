/** Compact wood board preview for pack cards (one node — keeps the 37-pack list light). */
export function MiniBoard() {
  return (
    <div
      className="relative size-16 shrink-0 rounded-[5px] p-[2px] shadow-[0_1px_2px_rgba(28,25,21,.1)]"
      style={{
        background: "linear-gradient(180deg, #6a4b32 0%, #553c28 100%)",
      }}
      aria-hidden
    >
      <div
        className="size-full overflow-hidden rounded-[3px]"
        style={{
          background: "repeating-conic-gradient(#f3e5c8 0% 25%, #a97850 0% 50%)",
          backgroundSize: "25% 25%",
        }}
      />
      <span
        className="pointer-events-none absolute inset-0 grid place-items-center text-[1.15rem] leading-none opacity-[0.22]"
        style={{ color: "#1c1814", textShadow: "0 0 1px #fffdf8" }}
      >
        ♔
      </span>
    </div>
  );
}
