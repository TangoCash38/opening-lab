/**
 * Accessible name for the gold maker mark on pack cards.
 * The visible maker name is not translated. Only this label is.
 * The name placeholder stays the proper name.
 */
export const MAKER_BADGE_LABEL = "Made by {name}";

export const MAKER_BADGE_COPY: Record<string, Record<string, string>> = {
  en: { [MAKER_BADGE_LABEL]: "Made by {name}" },
  es: { [MAKER_BADGE_LABEL]: "Hecho por {name}" },
  zh: { [MAKER_BADGE_LABEL]: "由{name}制作" },
  fr: { [MAKER_BADGE_LABEL]: "Créé par {name}" },
  de: { [MAKER_BADGE_LABEL]: "Von {name}" },
  pt: { [MAKER_BADGE_LABEL]: "Feito por {name}" },
  ru: { [MAKER_BADGE_LABEL]: "Сделано {name}" },
  it: { [MAKER_BADGE_LABEL]: "Fatto da {name}" },
  hi: { [MAKER_BADGE_LABEL]: "{name} द्वारा निर्मित" },
  ja: { [MAKER_BADGE_LABEL]: "{name}制作" },
  ar: { [MAKER_BADGE_LABEL]: "من صنع {name}" },
  tr: { [MAKER_BADGE_LABEL]: "{name} tarafından" },
};
