/** Compact wood board preview for pack cards (one node — keeps the 37-pack list light). */
export function MiniBoard() {
  return (
    <div
      className="relative size-16 shrink-0 rounded-[9px] p-[2px] shadow-[0_1px_3px_rgba(28,25,21,.12)]"
      style={{
        background: "linear-gradient(145deg, #8b6342 0%, #6b4a2e 100%)",
      }}
      aria-hidden
    >
      <div
        className="size-full overflow-hidden rounded-[7px]"
        style={{
          background: "repeating-conic-gradient(#edd2a8 0% 25%, #c49a72 0% 50%)",
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
