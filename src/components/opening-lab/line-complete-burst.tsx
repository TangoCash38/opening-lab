import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChessPiece } from "./chess-pieces";

const FULL_MS = 2400;
const REDUCED_MS = 900;
const SHARD_COUNT = 10;
const THUMB_COUNT = 20;

type Props = {
  pieceCode: string;
  onFinished: () => void;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function polarPct(angleRad: number, radius: number) {
  return {
    x: 50 + Math.cos(angleRad) * radius,
    y: 50 + Math.sin(angleRad) * radius,
  };
}

function shardClip(index: number, count: number) {
  const step = (Math.PI * 2) / count;
  const mid = index * step - Math.PI / 2;
  const a0 = mid - step / 2 - 0.1;
  const a1 = mid + step / 2 + 0.1;
  const p0 = polarPct(a0, 80);
  const p1 = polarPct(a1, 80);
  return `polygon(50% 50%, ${p0.x.toFixed(1)}% ${p0.y.toFixed(1)}%, ${p1.x.toFixed(1)}% ${p1.y.toFixed(1)}%)`;
}

function buildShards(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dist = 92 + (i % 3) * 14;
    return {
      clip: shardClip(i, count),
      x: `${(Math.cos(angle) * dist).toFixed(1)}%`,
      y: `${(Math.sin(angle) * dist).toFixed(1)}%`,
      rot: `${(((i * 47) % 70) - 35).toFixed(0)}deg`,
      stagger: `${(i % 4) * 18}ms`,
    };
  });
}

function buildThumbs(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const base = (i / count) * Math.PI * 2 - Math.PI / 2;
    const jitter = (((i * 17) % 11) - 5) * 0.045;
    const angle = base + jitter;
    const dist = 34 + ((i * 13) % 20);
    return {
      x: `${(Math.cos(angle) * dist).toFixed(1)}%`,
      y: `${(Math.sin(angle) * dist - 6).toFixed(1)}%`,
      delay: `${480 + (i % 7) * 32}ms`,
      spin: `${(((i * 41) % 90) - 45).toFixed(0)}deg`,
      size: (0.82 + ((i * 3) % 5) * 0.09).toFixed(2),
      tint: i % 3 === 0 ? "green" : "gold",
    };
  });
}

export function LineCompleteBurst({ pieceCode, onFinished }: Props) {
  const reduced = usePrefersReducedMotion();
  const shards = useMemo(() => buildShards(SHARD_COUNT), []);
  const thumbs = useMemo(() => buildThumbs(THUMB_COUNT), []);

  useEffect(() => {
    const t = window.setTimeout(onFinished, reduced ? REDUCED_MS : FULL_MS);
    return () => window.clearTimeout(t);
  }, [onFinished, reduced]);

  return (
    <div className="line-complete-burst" aria-hidden>
      <div className="lcb-flash" />
      <div className={reduced ? "lcb-king lcb-king--reduced" : "lcb-king"}>
        <ChessPiece code={pieceCode} />
      </div>
      {reduced
        ? null
        : shards.map((s, i) => (
            <div
              key={`shard-${i}`}
              className="lcb-shard"
              style={
                {
                  clipPath: s.clip,
                  "--x": s.x,
                  "--y": s.y,
                  "--rot": s.rot,
                  "--stagger": s.stagger,
                } as CSSProperties
              }
            >
              <ChessPiece code={pieceCode} />
            </div>
          ))}
      {reduced
        ? null
        : thumbs.map((t, i) => (
            <span
              key={`thumb-${i}`}
              className={`lcb-thumb lcb-thumb--${t.tint}`}
              style={
                {
                  "--x": t.x,
                  "--y": t.y,
                  "--delay": t.delay,
                  "--spin": t.spin,
                  "--size": t.size,
                } as CSSProperties
              }
            >
              👍
            </span>
          ))}
    </div>
  );
}
