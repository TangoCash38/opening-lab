/** Compact wood board preview for pack cards (no full piece set — keeps home light). */
export function MiniBoard() {
  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const light = (r + c) % 2 === 0;
      cells.push(
        <div
          key={`${r}-${c}`}
          className={light ? "mini-sq-light" : "mini-sq-dark"}
        />,
      );
    }
  }
  return (
    <div
      className="relative shrink-0 rounded-[9px] p-[2px] shadow-[0_1px_3px_rgba(28,25,21,.12)]"
      style={{
        background: "linear-gradient(145deg, #8b6342 0%, #6b4a2e 100%)",
      }}
      aria-hidden
    >
      <div
        className="grid size-16 overflow-hidden rounded-[7px]"
        style={{
          gridTemplateColumns: "repeat(8,1fr)",
          gridTemplateRows: "repeat(8,1fr)",
        }}
      >
        {cells}
      </div>
      {/* tiny decorative king mark */}
      <span
        className="pointer-events-none absolute inset-0 grid place-items-center text-[1.15rem] leading-none opacity-[0.22]"
        style={{ color: "#1c1814", textShadow: "0 0 1px #fffdf8" }}
      >
        ♔
      </span>
    </div>
  );
}
