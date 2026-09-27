/** UI strings for the website Classic GM sample. Merged into every language dict. */

const KEYS = {
  title: "Classic GM — Fischer vs Sherwin, 1957",
  opening: "King's Indian Attack vs Sicilian",
  fold: "Free · KIA vs Sicilian",
  run: "Run the game",
} as const;

export const CLASSIC_COPY: Record<string, Record<string, string>> = {
  en: {
    [KEYS.title]: "Classic GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "King's Indian Attack vs Sicilian",
    [KEYS.fold]: "Free · KIA vs Sicilian",
    [KEYS.run]: "Run the game",
  },
  es: {
    [KEYS.title]: "Clásico GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "Ataque indio de rey contra la Siciliana",
    [KEYS.fold]: "Gratis · KIA vs Siciliana",
    [KEYS.run]: "Jugar la partida",
  },
  zh: {
    [KEYS.title]: "经典大师 — 菲舍尔 vs 舍尔温，1957",
    [KEYS.opening]: "王翼印度攻击对西西里",
    [KEYS.fold]: "免费 · KIA 对西西里",
    [KEYS.run]: "走完这盘棋",
  },
  fr: {
    [KEYS.title]: "Classique GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "Attaque est-indienne contre la Sicilienne",
    [KEYS.fold]: "Gratuit · AOI vs Sicilienne",
    [KEYS.run]: "Jouer la partie",
  },
  de: {
    [KEYS.title]: "Klassische GM-Partie — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "Königsindischer Angriff gegen Sizilianisch",
    [KEYS.fold]: "Kostenlos · KIA vs Sizilianisch",
    [KEYS.run]: "Partie nachspielen",
  },
  pt: {
    [KEYS.title]: "Clássico GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "Ataque Índio do Rei contra a Siciliana",
    [KEYS.fold]: "Grátis · KIA vs Siciliana",
    [KEYS.run]: "Jogar a partida",
  },
  ru: {
    [KEYS.title]: "Классика гроссмейстеров — Фишер vs Шервин, 1957",
    [KEYS.opening]: "Атака индийской защиты против сицилианской",
    [KEYS.fold]: "Бесплатно · KIA vs Сицилианская",
    [KEYS.run]: "Пройти партию",
  },
  it: {
    [KEYS.title]: "Classico GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "Attacco est-indiano contro la Siciliana",
    [KEYS.fold]: "Gratis · Attacco est-indiano vs Siciliana",
    [KEYS.run]: "Gioca la partita",
  },
  hi: {
    [KEYS.title]: "क्लासिक GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "किंग्स इंडियन अटैक बनाम सिसिलियन",
    [KEYS.fold]: "मुफ़्त · KIA vs सिसिलियन",
    [KEYS.run]: "गेम चलाएँ",
  },
  ja: {
    [KEYS.title]: "クラシックGM — フィッシャー vs シャーウィン、1957",
    [KEYS.opening]: "キングスインディアンアタック対シシリアン",
    [KEYS.fold]: "無料 · KIA 対シシリアン",
    [KEYS.run]: "対局を進める",
  },
  ar: {
    [KEYS.title]: "كلاسيك GM — فيشر ضد شيروين، 1957",
    [KEYS.opening]: "هجوم الهندي الملكي ضد الصقلية",
    [KEYS.fold]: "مجاني · KIA ضد الصقلية",
    [KEYS.run]: "تشغيل المباراة",
  },
  tr: {
    [KEYS.title]: "Klasik GM — Fischer vs Sherwin, 1957",
    [KEYS.opening]: "Kral Hint Atağı vs Sicilya",
    [KEYS.fold]: "Ücretsiz · KIA vs Sicilya",
    [KEYS.run]: "Oyunu oyna",
  },
};
