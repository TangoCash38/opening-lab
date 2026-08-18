import { PLAY_STORE_NOTICE } from "@/lib/play-app";

type Props = {
  className?: string;
};

export function PlayStoreNotice({ className }: Props) {
  return (
    <p
      className={
        className ??
        "m-0 rounded-xl bg-bg-subtle px-4 py-3 text-center text-[0.85rem] leading-relaxed text-fg-muted"
      }
      role="status"
    >
      {PLAY_STORE_NOTICE}
    </p>
  );
}
