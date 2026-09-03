import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGS = ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_STORAGE_KEY = "opening-lab:lang";

export const LANG_OPTIONS: ReadonlyArray<{
  id: Lang;
  label: string;
  short: string;
}> = [
  { id: "en", label: "English", short: "EN" },
  { id: "es", label: "Spanish", short: "ES" },
  { id: "zh", label: "Chinese (Simplified)", short: "中文" },
  { id: "fr", label: "French", short: "FR" },
  { id: "de", label: "German", short: "DE" },
  { id: "pt", label: "Portuguese", short: "PT" },
  { id: "ru", label: "Russian", short: "RU" },
  { id: "it", label: "Italian", short: "IT" },
  { id: "hi", label: "Hindi", short: "हिंदी" },
  { id: "ja", label: "Japanese", short: "日本語" },
];

type Dict = Record<string, string>;
type Vars = Record<string, string | number>;
export type Translate = (key: string, vars?: Vars) => string;

const GYM_INTRO =
  "Opening Lab is a strict book-move trainer. Practice with the yellow hint. Test with none. Only the book move counts. Then Play on from the setup if you want.\n\nThis way of learning builds a working repertoire of the opening: the main book replies, not a fog of ideas. Finding those moves without the hint makes your early decisions more informed. It is a solid ground to take your study further — books, games, engines — not a shortcut to having the whole opening down.";

const en: Dict = {
  "Train openings the strict way": "Train openings the strict way",
  "How to play": "How to play",
  "Download the app": "Download the app",
  "Continue on the web": "Continue on the web",
  "Tap to practice": "Tap to practice",
  "See 18 lines": "See 18 lines",
  "Free sample": "Free sample",
  Start: "Start",
  Train: "Train",
  "Strict lines · memory training": "Strict lines · memory training",
  "Help and guide": "Help and guide",
  Help: "Help",
  Language: "Language",
  "Opening Lab home": "Opening Lab home",
  Account: "Account",
  Play: "Play",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "Most people dive into opening theory before they know the basics. That is algebra before you can count.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.",
  "More packs": "More packs",
  Free: "Free",
  Unlocked: "Unlocked",
  "Pay as you go": "Pay as you go",
  "{n} lines": "{n} lines",
  "Pay as you go · {price}": "Pay as you go · {price}",
  "{price} · tap to see lines": "{price} · tap to see lines",
  "Tap to hide": "Tap to hide",
  "Free · tap to see lines": "Free · tap to see lines",
  "Tap to see lines": "Tap to see lines",
  Locked: "Locked",
  "Complete — train any time": "Complete — train any time",
  "Test with no mistakes to complete": "Test with no mistakes to complete",
  New: "New",
  "Payment not confirmed yet": "Payment not confirmed yet",
  "Could not confirm payment": "Could not confirm payment",
  "Unlock {packName}": "Unlock {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Three lines stay free. This unlocks the rest of the pack.",
  "One-time purchase. This pack only.": "One-time purchase. This pack only.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "Packs are not for sale in this Play test. The three free Caro lines still train here.",
  "Rest of this pack": "Rest of this pack",
  "This pack": "This pack",
  "Pay as you go. Not for sale in this Play test.":
    "Pay as you go. Not for sale in this Play test.",
  "Unlock the rest of this pack": "Unlock the rest of this pack",
  "Unlock this pack": "Unlock this pack",
  "Yours to keep. Card via Stripe.": "Yours to keep. Card via Stripe.",
  "Opening checkout…": "Opening checkout…",
  "Sign in so this stays on your account.": "Sign in so this stays on your account.",
  "You will pay securely with Stripe.": "You will pay securely with Stripe.",
  "Payments are not live yet.": "Payments are not live yet.",
  Close: "Close",
  "How the gym works": "How the gym works",
  [GYM_INTRO]: GYM_INTRO,
  Continue: "Continue",
  "Don't show again": "Don't show again",
  "Wrong move": "Wrong move",
  "Inaccurate move": "Inaccurate move",
  "The book move is {san}.": "The book move is {san}.",
  "Try again": "Try again",
  "Practice again": "Practice again",
  "Back to practice": "Back to practice",
  "Well done": "Well done",
  "Practice next line": "Practice next line",
  "Test yourself": "Test yourself",
  "Practice done": "Practice done",
  "Line complete": "Line complete",
  "Finished, but you missed a move": "Finished, but you missed a move",
  "← Back": "← Back",
  "User guide": "User guide",
  "What is Opening Lab?": "What is Opening Lab?",
  Board: "Board",
  Book: "Book",
  Paper: "Paper",
  Future: "Future",
  Newspaper: "Newspaper",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.",
  "White & Black / Special packs": "White & Black / Special packs",
  "Each pack trains one opening. You play the book side.":
    "Each pack trains one opening. You play the book side.",
  "Practice mode": "Practice mode",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.",
  "Test mode": "Test mode",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.",
  Reviews: "Reviews",
  "A clean Test turns the line green. You can train it again anytime.":
    "A clean Test turns the line green. You can train it again anytime.",
  "Use the profile icon (top right) to sign in. See":
    "Use the profile icon (top right) to sign in. See",
  "Privacy Policy": "Privacy Policy",
  Terms: "Terms",
  and: "and",
};

const es: Dict = {
  "Train openings the strict way": "Entrena aperturas a rajatabla",
  "How to play": "Cómo jugar",
  "Download the app": "Descargar la app",
  "Continue on the web": "Seguir en la web",
  "Tap to practice": "Toca para practicar",
  "See 18 lines": "Ver 18 líneas",
  "Free sample": "Muestra gratis",
  Start: "Empezar",
  Train: "Entrenar",
  "Strict lines · memory training": "Líneas estrictas · memoria",
  "Help and guide": "Ayuda y guía",
  Help: "Ayuda",
  Language: "Idioma",
  "Opening Lab home": "Inicio de Opening Lab",
  Account: "Cuenta",
  Play: "Jugar",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "La mayoría se lanza a la teoría de aperturas antes de dominar lo básico. Es álgebra antes de saber contar.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "Pagan cursos profundos y aún no pueden jugar la línea. Aquí vamos al grano. Líneas estrictas. Las aprendes, las juegas y reconoces la apertura cuando aparece.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Tres líneas Caro son gratis. Desbloquea el resto de ese pack por £1.99. Los demás packs cuestan £2.99.",
  "More packs": "Más packs",
  Free: "Gratis",
  Unlocked: "Desbloqueado",
  "Pay as you go": "Paga al usar",
  "{n} lines": "{n} líneas",
  "Pay as you go · {price}": "Paga al usar · {price}",
  "{price} · tap to see lines": "{price} · toca para ver líneas",
  "Tap to hide": "Toca para ocultar",
  "Free · tap to see lines": "Gratis · toca para ver líneas",
  "Tap to see lines": "Toca para ver líneas",
  Locked: "Bloqueado",
  "Complete — train any time": "Completada — entrena cuando quieras",
  "Test with no mistakes to complete": "Haz un Test sin errores para completar",
  New: "Nuevo",
  "Payment not confirmed yet": "Pago aún no confirmado",
  "Could not confirm payment": "No se pudo confirmar el pago",
  "Unlock {packName}": "Desbloquear {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Tres líneas siguen gratis. Esto desbloquea el resto del pack.",
  "One-time purchase. This pack only.": "Pago único. Solo este pack.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "Los packs no están a la venta en esta prueba de Play. Las tres líneas Caro gratis se siguen entrenando aquí.",
  "Rest of this pack": "Resto de este pack",
  "This pack": "Este pack",
  "Pay as you go. Not for sale in this Play test.":
    "Paga al usar. No está a la venta en esta prueba de Play.",
  "Unlock the rest of this pack": "Desbloquear el resto de este pack",
  "Unlock this pack": "Desbloquear este pack",
  "Yours to keep. Card via Stripe.": "Tuyo para siempre. Tarjeta con Stripe.",
  "Opening checkout…": "Abriendo el pago…",
  "Sign in so this stays on your account.": "Inicia sesión para guardarlo en tu cuenta.",
  "You will pay securely with Stripe.": "Pagarás de forma segura con Stripe.",
  "Payments are not live yet.": "Los pagos aún no están activos.",
  Close: "Cerrar",
  "How the gym works": "Cómo funciona el gimnasio",
  [GYM_INTRO]:
    "Opening Lab es un entrenador estricto de jugadas de libro. Practica con la pista amarilla. Haz Test sin pistas. Solo cuenta la jugada de libro. Luego Play on desde la posición si quieres.\n\nAsí se construye un repertorio que funciona: las respuestas de libro, no una niebla de ideas. Encontrar esas jugadas sin pista hace más informadas tus decisiones tempranas. Es una base sólida para seguir con libros, partidas y motores, no un atajo para dominar toda la apertura.",
  Continue: "Continuar",
  "Don't show again": "No volver a mostrar",
  "Wrong move": "Jugada incorrecta",
  "Inaccurate move": "Jugada inexacta",
  "The book move is {san}.": "La jugada de libro es {san}.",
  "Try again": "Reintentar",
  "Practice again": "Practicar de nuevo",
  "Back to practice": "Volver a practicar",
  "Well done": "Bien hecho",
  "Practice next line": "Practicar la siguiente línea",
  "Test yourself": "Ponte a prueba",
  "Practice done": "Práctica hecha",
  "Line complete": "Línea completa",
  "Finished, but you missed a move": "Terminaste, pero fallaste una jugada",
  "← Back": "← Atrás",
  "User guide": "Guía",
  "What is Opening Lab?": "¿Qué es Opening Lab?",
  Board: "Tablero",
  Book: "Libro",
  Paper: "Papel",
  Future: "Futuro",
  Newspaper: "Periódico",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Entrenamiento de memoria con líneas estrictas. Solo juegas las jugadas de la apertura elegida; las incorrectas se rechazan para que la línea se quede.",
  "White & Black / Special packs": "White y Black / packs especiales",
  "Each pack trains one opening. You play the book side.":
    "Cada pack entrena una apertura. Juegas el bando de libro.",
  "Practice mode": "Modo Practice",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "Las pistas amarillas muestran la siguiente jugada. El rival responde solo. Sigue la línea exacta. Practice no completa la línea.",
  "Test mode": "Modo Test",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "Sin pistas. Juega solo tu bando. Las casillas incorrectas parpadean en rojo hasta la jugada de libro. Un Test limpio (cero errores) pone la línea en verde. Si crees que una jugada rechazada es de libro, envíala con Wrong move? Si lo confirmamos, un pack es gratis.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Después de Practice o Test, elige 800, 1200 o 1800 y Play on desde la posición. Un Test limpio sigue poniendo la línea en verde. Play on no completa la línea.",
  Reviews: "Repasos",
  "A clean Test turns the line green. You can train it again anytime.":
    "Un Test limpio pone la línea en verde. Puedes entrenarla otra vez cuando quieras.",
  "Use the profile icon (top right) to sign in. See":
    "Usa el icono de perfil (arriba a la derecha) para iniciar sesión. Consulta",
  "Privacy Policy": "Política de privacidad",
  Terms: "Términos",
  and: "y",
};

const zh: Dict = {
  "Train openings the strict way": "严格训练开局",
  "How to play": "玩法",
  "Download the app": "下载应用",
  "Continue on the web": "继续使用网页",
  "Tap to practice": "点按开始练习",
  "See 18 lines": "查看 18 条线路",
  "Free sample": "免费试玩",
  Start: "开始",
  Train: "训练",
  "Strict lines · memory training": "严格线路 · 记忆训练",
  "Help and guide": "帮助与指南",
  Help: "帮助",
  Language: "语言",
  "Opening Lab home": "Opening Lab 首页",
  Account: "账户",
  Play: "开始",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "很多人还没掌握基础就扎进开局理论。那等于还不会数数就学代数。",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "他们买了深度课程，还是下不出这条线路。这里直来直去。严格线路。学会了就能下，局面出现时也能认出来。",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "三条 Caro 线路免费。解锁该棋包其余线路 £1.99。其他棋包 £2.99。",
  "More packs": "更多棋包",
  Free: "免费",
  Unlocked: "已解锁",
  "Pay as you go": "按包购买",
  "{n} lines": "{n} 条线路",
  "Pay as you go · {price}": "按包购买 · {price}",
  "{price} · tap to see lines": "{price} · 点按查看线路",
  "Tap to hide": "点按收起",
  "Free · tap to see lines": "免费 · 点按查看线路",
  "Tap to see lines": "点按查看线路",
  Locked: "未解锁",
  "Complete — train any time": "已完成 — 随时再练",
  "Test with no mistakes to complete": "Test 零失误即可完成",
  New: "新",
  "Payment not confirmed yet": "付款尚未确认",
  "Could not confirm payment": "无法确认付款",
  "Unlock {packName}": "解锁 {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "三条线路保持免费。此项解锁该棋包其余线路。",
  "One-time purchase. This pack only.": "一次性购买。仅此棋包。",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "此 Play 测试中棋包暂不出售。三条免费 Caro 线路仍可在此训练。",
  "Rest of this pack": "该棋包其余线路",
  "This pack": "此棋包",
  "Pay as you go. Not for sale in this Play test.":
    "按包购买。此 Play 测试中暂不出售。",
  "Unlock the rest of this pack": "解锁该棋包其余线路",
  "Unlock this pack": "解锁此棋包",
  "Yours to keep. Card via Stripe.": "买断保留。通过 Stripe 刷卡。",
  "Opening checkout…": "正在打开结账…",
  "Sign in so this stays on your account.": "登录后会保存在你的账户。",
  "You will pay securely with Stripe.": "将通过 Stripe 安全付款。",
  "Payments are not live yet.": "付款尚未开通。",
  Close: "关闭",
  "How the gym works": "训练馆怎么用",
  [GYM_INTRO]:
    "Opening Lab 是严格的书谱着法训练器。Practice 看黄色提示。Test 不给提示。只算书谱着法。然后如需可以从该局面 Play on。\n\n这样练出能用的开局储备：主要书谱应对，而不是一团模糊想法。不看提示找出这些着法，会让你的开局选择更有依据。这是继续读书、对局、用引擎的扎实地基，不是把整个开局一次吃透的捷径。",
  Continue: "继续",
  "Don't show again": "不再显示",
  "Wrong move": "走错了",
  "Inaccurate move": "不准确的着法",
  "The book move is {san}.": "书谱着法是 {san}。",
  "Try again": "再试一次",
  "Practice again": "再练习",
  "Back to practice": "返回练习",
  "Well done": "做得好",
  "Practice next line": "练习下一条线路",
  "Test yourself": "自我测试",
  "Practice done": "练习完成",
  "Line complete": "线路完成",
  "Finished, but you missed a move": "下完了，但漏了一着",
  "← Back": "← 返回",
  "User guide": "使用指南",
  "What is Opening Lab?": "Opening Lab 是什么？",
  Board: "棋盘",
  Book: "书谱",
  Paper: "纸面",
  Future: "未来",
  Newspaper: "报纸",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "严格线路记忆训练。你只下所选开局中的着法；错着会被拒绝，线路才能记住。",
  "White & Black / Special packs": "White 与 Black / 专题棋包",
  "Each pack trains one opening. You play the book side.":
    "每个棋包训练一个开局。你下书谱一方。",
  "Practice mode": "Practice 模式",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "黄色提示显示下一着。对手自动应对。跟上准确线路。Practice 不会完成该线路。",
  "Test mode": "Test 模式",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "没有提示。只下你的一方。错格会闪红，直到走出书谱着法。干净的 Test（零失误）会让线路变绿。若你认为被拒的着法是书谱，用 Wrong move? 发给我们。确认后可获赠一个棋包。",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Practice 或 Test 之后，选择 800、1200 或 1800，从该局面 Play on。干净的 Test 仍会让线路变绿。Play on 不会完成该线路。",
  Reviews: "复习",
  "A clean Test turns the line green. You can train it again anytime.":
    "干净的 Test 会让线路变绿。你可以随时再练。",
  "Use the profile icon (top right) to sign in. See":
    "点右上角头像登录。请阅",
  "Privacy Policy": "隐私政策",
  Terms: "条款",
  and: "与",
};

const fr: Dict = {
  "Train openings the strict way": "Entraîne les ouvertures à la stricte",
  "How to play": "Comment jouer",
  "Download the app": "Télécharger l'appli",
  "Continue on the web": "Continuer sur le web",
  "Tap to practice": "Touche pour t'entraîner",
  "See 18 lines": "Voir 18 lignes",
  "Free sample": "Extrait gratuit",
  Start: "Commencer",
  Train: "Entraîner",
  "Strict lines · memory training": "Lignes strictes · mémoire",
  "Help and guide": "Aide et guide",
  Help: "Aide",
  Language: "Langue",
  "Opening Lab home": "Accueil Opening Lab",
  Account: "Compte",
  Play: "Jouer",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "La plupart plongent dans la théorie des ouvertures avant les bases. C'est l'algèbre avant de savoir compter.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "Ils paient des cours poussés et ne savent toujours pas jouer la ligne. Ici, on va droit au but. Lignes strictes. Tu les apprends, tu les joues, et tu reconnais l'ouverture quand elle apparaît.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Trois lignes Caro sont gratuites. Débloque le reste de ce pack pour £1.99. Les autres packs sont à £2.99.",
  "More packs": "Plus de packs",
  Free: "Gratuit",
  Unlocked: "Débloqué",
  "Pay as you go": "À l'unité",
  "{n} lines": "{n} lignes",
  "Pay as you go · {price}": "À l'unité · {price}",
  "{price} · tap to see lines": "{price} · touche pour voir les lignes",
  "Tap to hide": "Touche pour masquer",
  "Free · tap to see lines": "Gratuit · touche pour voir les lignes",
  "Tap to see lines": "Touche pour voir les lignes",
  Locked: "Verrouillé",
  "Complete — train any time": "Terminée — entraîne-toi quand tu veux",
  "Test with no mistakes to complete": "Réussis un Test sans faute pour terminer",
  New: "Nouveau",
  "Payment not confirmed yet": "Paiement pas encore confirmé",
  "Could not confirm payment": "Impossible de confirmer le paiement",
  "Unlock {packName}": "Débloquer {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Trois lignes restent gratuites. Ceci débloque le reste du pack.",
  "One-time purchase. This pack only.": "Achat unique. Ce pack seulement.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "Les packs ne sont pas en vente dans ce test Play. Les trois lignes Caro gratuites s'entraînent toujours ici.",
  "Rest of this pack": "Reste de ce pack",
  "This pack": "Ce pack",
  "Pay as you go. Not for sale in this Play test.":
    "À l'unité. Pas en vente dans ce test Play.",
  "Unlock the rest of this pack": "Débloquer le reste de ce pack",
  "Unlock this pack": "Débloquer ce pack",
  "Yours to keep. Card via Stripe.": "À toi pour de bon. Carte via Stripe.",
  "Opening checkout…": "Ouverture du paiement…",
  "Sign in so this stays on your account.": "Connecte-toi pour le garder sur ton compte.",
  "You will pay securely with Stripe.": "Tu paieras en toute sécurité avec Stripe.",
  "Payments are not live yet.": "Les paiements ne sont pas encore actifs.",
  Close: "Fermer",
  "How the gym works": "Comment marche la salle",
  [GYM_INTRO]:
    "Opening Lab est un entraîneur strict de coups du livre. Practice avec l'indice jaune. Test sans indice. Seul le coup du livre compte. Puis Play on depuis la position si tu veux.\n\nCette façon d'apprendre construit un répertoire qui marche : les réponses du livre, pas un brouillard d'idées. Trouver ces coups sans indice rend tes décisions d'ouverture plus informées. C'est une base solide pour aller plus loin — livres, parties, moteurs — pas un raccourci vers toute l'ouverture.",
  Continue: "Continuer",
  "Don't show again": "Ne plus afficher",
  "Wrong move": "Mauvais coup",
  "Inaccurate move": "Coup imprécis",
  "The book move is {san}.": "Le coup du livre est {san}.",
  "Try again": "Réessayer",
  "Practice again": "Pratiquer encore",
  "Back to practice": "Retour à Practice",
  "Well done": "Bravo",
  "Practice next line": "Practice la ligne suivante",
  "Test yourself": "Teste-toi",
  "Practice done": "Practice terminé",
  "Line complete": "Ligne terminée",
  "Finished, but you missed a move": "Terminé, mais tu as manqué un coup",
  "← Back": "← Retour",
  "User guide": "Guide",
  "What is Opening Lab?": "Qu'est-ce qu'Opening Lab ?",
  Board: "Échiquier",
  Book: "Livre",
  Paper: "Papier",
  Future: "Futur",
  Newspaper: "Journal",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Entraînement mémoire en lignes strictes. Tu ne joues que les coups de l'ouverture choisie ; les mauvais coups sont refusés pour que la ligne tienne.",
  "White & Black / Special packs": "White et Black / packs spéciaux",
  "Each pack trains one opening. You play the book side.":
    "Chaque pack entraîne une ouverture. Tu joues le camp du livre.",
  "Practice mode": "Mode Practice",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "Les indices jaunes montrent le coup suivant. L'adversaire répond tout seul. Suis la ligne exacte. Practice ne termine pas la ligne.",
  "Test mode": "Mode Test",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "Pas d'indices. Joue seulement ton camp. Les cases fausses clignotent en rouge jusqu'au coup du livre. Un Test propre (zéro faute) met la ligne en vert. Si tu penses qu'un coup refusé est du livre, envoie-le avec Wrong move ? Si on le confirme, un pack est offert.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Après Practice ou Test, choisis 800, 1200 ou 1800 et Play on depuis la position. Un Test propre met toujours la ligne en vert. Play on ne termine pas la ligne.",
  Reviews: "Révisions",
  "A clean Test turns the line green. You can train it again anytime.":
    "Un Test propre met la ligne en vert. Tu peux la réentraîner quand tu veux.",
  "Use the profile icon (top right) to sign in. See":
    "Utilise l'icône de profil (en haut à droite) pour te connecter. Voir",
  "Privacy Policy": "Politique de confidentialité",
  Terms: "Conditions",
  and: "et",
};

const de: Dict = {
  "Train openings the strict way": "Eröffnungen strikt trainieren",
  "How to play": "So geht's",
  "Download the app": "App herunterladen",
  "Continue on the web": "Im Web weiter",
  "Tap to practice": "Tippen zum Üben",
  "See 18 lines": "18 Linien ansehen",
  "Free sample": "Gratisprobe",
  Start: "Starten",
  Train: "Trainieren",
  "Strict lines · memory training": "Strikte Linien · Gedächtnis",
  "Help and guide": "Hilfe und Anleitung",
  Help: "Hilfe",
  Language: "Sprache",
  "Opening Lab home": "Opening Lab Startseite",
  Account: "Konto",
  Play: "Spielen",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "Die meisten stürzen sich in die Eröffnungstheorie, bevor die Grundlagen sitzen. Das ist Algebra, bevor man zählen kann.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "Sie zahlen für tiefe Kurse und können die Linie trotzdem nicht spielen. Hier bleibt's klar. Strikte Linien. Du lernst sie, du spielst sie, und du erkennst die Eröffnung, wenn sie kommt.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Drei Caro-Linien sind kostenlos. Schalte den Rest des Packs für £1.99 frei. Andere Packs kosten £2.99.",
  "More packs": "Mehr Packs",
  Free: "Kostenlos",
  Unlocked: "Freigeschaltet",
  "Pay as you go": "Einzeln",
  "{n} lines": "{n} Linien",
  "Pay as you go · {price}": "Einzeln · {price}",
  "{price} · tap to see lines": "{price} · tippen für Linien",
  "Tap to hide": "Tippen zum Ausblenden",
  "Free · tap to see lines": "Kostenlos · tippen für Linien",
  "Tap to see lines": "Tippen für Linien",
  Locked: "Gesperrt",
  "Complete — train any time": "Fertig — trainiere jederzeit",
  "Test with no mistakes to complete": "Bestehe einen Test ohne Fehler",
  New: "Neu",
  "Payment not confirmed yet": "Zahlung noch nicht bestätigt",
  "Could not confirm payment": "Zahlung konnte nicht bestätigt werden",
  "Unlock {packName}": "{packName} freischalten",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Drei Linien bleiben kostenlos. Damit schaltest du den Rest des Packs frei.",
  "One-time purchase. This pack only.": "Einmalkauf. Nur dieses Pack.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "Packs sind in diesem Play-Test nicht zu kaufen. Die drei kostenlosen Caro-Linien trainierst du hier trotzdem.",
  "Rest of this pack": "Rest dieses Packs",
  "This pack": "Dieses Pack",
  "Pay as you go. Not for sale in this Play test.":
    "Einzeln. In diesem Play-Test nicht zu kaufen.",
  "Unlock the rest of this pack": "Rest dieses Packs freischalten",
  "Unlock this pack": "Dieses Pack freischalten",
  "Yours to keep. Card via Stripe.": "Dein für immer. Karte über Stripe.",
  "Opening checkout…": "Zahlung wird geöffnet…",
  "Sign in so this stays on your account.": "Melde dich an, damit es auf deinem Konto bleibt.",
  "You will pay securely with Stripe.": "Du zahlst sicher mit Stripe.",
  "Payments are not live yet.": "Zahlungen sind noch nicht aktiv.",
  Close: "Schließen",
  "How the gym works": "So funktioniert das Training",
  [GYM_INTRO]:
    "Opening Lab ist ein strikter Buchzug-Trainer. Practice mit dem gelben Hinweis. Test ohne Hinweis. Nur der Buchzug zählt. Dann Play on von der Stellung, wenn du willst.\n\nSo entsteht ein Repertoire, das sitzt: die Buchantworten, kein Nebel aus Ideen. Diese Züge ohne Hinweis zu finden macht deine frühen Entscheidungen klarer. Eine solide Basis für Bücher, Partien, Engines — kein Abkürzungsweg zur ganzen Eröffnung.",
  Continue: "Weiter",
  "Don't show again": "Nicht mehr zeigen",
  "Wrong move": "Falscher Zug",
  "Inaccurate move": "Ungenauer Zug",
  "The book move is {san}.": "Der Buchzug ist {san}.",
  "Try again": "Nochmal",
  "Practice again": "Nochmal üben",
  "Back to practice": "Zurück zum Üben",
  "Well done": "Gut gemacht",
  "Practice next line": "Nächste Linie üben",
  "Test yourself": "Teste dich",
  "Practice done": "Übung fertig",
  "Line complete": "Linie fertig",
  "Finished, but you missed a move": "Fertig, aber ein Zug hat gefehlt",
  "← Back": "← Zurück",
  "User guide": "Anleitung",
  "What is Opening Lab?": "Was ist Opening Lab?",
  Board: "Brett",
  Book: "Buch",
  Paper: "Papier",
  Future: "Zukunft",
  Newspaper: "Zeitung",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Gedächtnistraining mit strikten Linien. Du spielst nur die Züge der gewählten Eröffnung; falsche Züge werden abgelehnt, damit die Linie sitzt.",
  "White & Black / Special packs": "White und Black / Spezial-Packs",
  "Each pack trains one opening. You play the book side.":
    "Jedes Pack trainiert eine Eröffnung. Du spielst die Buchseite.",
  "Practice mode": "Modus Practice",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "Gelbe Hinweise zeigen den nächsten Zug. Der Gegner antwortet automatisch. Folge der exakten Linie. Practice schließt die Linie nicht ab.",
  "Test mode": "Modus Test",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "Keine Hinweise. Spiele nur deine Seite. Falsche Felder blinken rot, bis du den Buchzug findest. Ein sauberer Test (null Fehler) macht die Linie grün. Wenn du denkst, ein abgelehnter Zug ist Buch, schick ihn mit Wrong move? Bestätigen wir ihn, gibt's ein Pack kostenlos.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Nach Practice oder Test wählst du 800, 1200 oder 1800 und Play on von der Stellung. Ein sauberer Test macht die Linie trotzdem grün. Play on schließt die Linie nicht ab.",
  Reviews: "Wiederholungen",
  "A clean Test turns the line green. You can train it again anytime.":
    "Ein sauberer Test macht die Linie grün. Du kannst sie jederzeit wieder trainieren.",
  "Use the profile icon (top right) to sign in. See":
    "Nutze das Profilsymbol (oben rechts) zum Anmelden. Siehe",
  "Privacy Policy": "Datenschutz",
  Terms: "Nutzungsbedingungen",
  and: "und",
};

const pt: Dict = {
  "Train openings the strict way": "Treine aberturas do jeito estrito",
  "How to play": "Como jogar",
  "Download the app": "Baixar o app",
  "Continue on the web": "Continuar na web",
  "Tap to practice": "Toque para treinar",
  "See 18 lines": "Ver 18 linhas",
  "Free sample": "Amostra grátis",
  Start: "Começar",
  Train: "Treinar",
  "Strict lines · memory training": "Linhas estritas · memória",
  "Help and guide": "Ajuda e guia",
  Help: "Ajuda",
  Language: "Idioma",
  "Opening Lab home": "Início do Opening Lab",
  Account: "Conta",
  Play: "Jogar",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "A maioria mergulha na teoria de aberturas antes do básico. É álgebra antes de saber contar.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "Pagam cursos profundos e ainda não jogam a linha. Aqui é direto. Linhas estritas. Você aprende, joga e reconhece a abertura quando ela aparece.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Três linhas Caro são grátis. Desbloqueie o resto desse pack por £1.99. Os outros packs custam £2.99.",
  "More packs": "Mais packs",
  Free: "Grátis",
  Unlocked: "Desbloqueado",
  "Pay as you go": "Pague ao usar",
  "{n} lines": "{n} linhas",
  "Pay as you go · {price}": "Pague ao usar · {price}",
  "{price} · tap to see lines": "{price} · toque para ver linhas",
  "Tap to hide": "Toque para ocultar",
  "Free · tap to see lines": "Grátis · toque para ver linhas",
  "Tap to see lines": "Toque para ver linhas",
  Locked: "Bloqueado",
  "Complete — train any time": "Completa — treine quando quiser",
  "Test with no mistakes to complete": "Faça um Test sem erros para completar",
  New: "Novo",
  "Payment not confirmed yet": "Pagamento ainda não confirmado",
  "Could not confirm payment": "Não foi possível confirmar o pagamento",
  "Unlock {packName}": "Desbloquear {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Três linhas continuam grátis. Isso desbloqueia o resto do pack.",
  "One-time purchase. This pack only.": "Compra única. Só este pack.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "Packs não estão à venda neste teste Play. As três linhas Caro grátis ainda treinam aqui.",
  "Rest of this pack": "Resto deste pack",
  "This pack": "Este pack",
  "Pay as you go. Not for sale in this Play test.":
    "Pague ao usar. Não está à venda neste teste Play.",
  "Unlock the rest of this pack": "Desbloquear o resto deste pack",
  "Unlock this pack": "Desbloquear este pack",
  "Yours to keep. Card via Stripe.": "Seu para sempre. Cartão via Stripe.",
  "Opening checkout…": "Abrindo o pagamento…",
  "Sign in so this stays on your account.": "Entre para guardar na sua conta.",
  "You will pay securely with Stripe.": "Você paga com segurança pelo Stripe.",
  "Payments are not live yet.": "Os pagamentos ainda não estão ativos.",
  Close: "Fechar",
  "How the gym works": "Como funciona o treino",
  [GYM_INTRO]:
    "Opening Lab é um treinador estrito de lances de livro. Practice com a dica amarela. Test sem dica. Só conta o lance de livro. Depois Play on da posição, se quiser.\n\nAssim se monta um repertório que funciona: as respostas de livro, não uma névoa de ideias. Achar esses lances sem dica deixa suas decisões iniciais mais informadas. É uma base sólida para ir além — livros, partidas, engines — não um atalho para a abertura inteira.",
  Continue: "Continuar",
  "Don't show again": "Não mostrar de novo",
  "Wrong move": "Lance errado",
  "Inaccurate move": "Lance impreciso",
  "The book move is {san}.": "O lance de livro é {san}.",
  "Try again": "Tentar de novo",
  "Practice again": "Treinar de novo",
  "Back to practice": "Voltar ao treino",
  "Well done": "Muito bem",
  "Practice next line": "Treinar a próxima linha",
  "Test yourself": "Teste-se",
  "Practice done": "Treino feito",
  "Line complete": "Linha completa",
  "Finished, but you missed a move": "Terminou, mas errou um lance",
  "← Back": "← Voltar",
  "User guide": "Guia",
  "What is Opening Lab?": "O que é Opening Lab?",
  Board: "Tabuleiro",
  Book: "Livro",
  Paper: "Papel",
  Future: "Futuro",
  Newspaper: "Jornal",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Treino de memória com linhas estritas. Você só joga os lances da abertura escolhida; os errados são recusados para a linha grudar.",
  "White & Black / Special packs": "White e Black / packs especiais",
  "Each pack trains one opening. You play the book side.":
    "Cada pack treina uma abertura. Você joga o lado de livro.",
  "Practice mode": "Modo Practice",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "As dicas amarelas mostram o próximo lance. O adversário responde sozinho. Siga a linha exata. Practice não completa a linha.",
  "Test mode": "Modo Test",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "Sem dicas. Jogue só o seu lado. Casas erradas piscam em vermelho até o lance de livro. Um Test limpo (zero erros) deixa a linha verde. Se achar que um lance recusado é de livro, envie com Wrong move? Se confirmarmos, um pack é grátis.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Depois de Practice ou Test, escolha 800, 1200 ou 1800 e Play on da posição. Um Test limpo ainda deixa a linha verde. Play on não completa a linha.",
  Reviews: "Revisões",
  "A clean Test turns the line green. You can train it again anytime.":
    "Um Test limpo deixa a linha verde. Você pode treinar de novo quando quiser.",
  "Use the profile icon (top right) to sign in. See":
    "Use o ícone de perfil (canto superior direito) para entrar. Veja",
  "Privacy Policy": "Política de privacidade",
  Terms: "Termos",
  and: "e",
};

const ru: Dict = {
  "Train openings the strict way": "Тренируй дебюты строго",
  "How to play": "Как играть",
  "Download the app": "Скачать приложение",
  "Continue on the web": "Продолжить в браузере",
  "Tap to practice": "Нажми, чтобы тренировать",
  "See 18 lines": "Смотреть 18 линий",
  "Free sample": "Бесплатный образец",
  Start: "Начать",
  Train: "Тренировать",
  "Strict lines · memory training": "Строгие линии · память",
  "Help and guide": "Справка и гайд",
  Help: "Справка",
  Language: "Язык",
  "Opening Lab home": "Главная Opening Lab",
  Account: "Аккаунт",
  Play: "Играть",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "Большинство лезут в дебютную теорию без базы. Это алгебра до того, как научился считать.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "Платят за глубокие курсы и всё равно не играют линию. Здесь по делу. Строгие линии. Выучишь — сыграешь, и узнаешь дебют, когда он появится.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Три линии Caro бесплатны. Открой остаток пака за £1.99. Остальные паки — £2.99.",
  "More packs": "Ещё паки",
  Free: "Бесплатно",
  Unlocked: "Открыто",
  "Pay as you go": "По одному",
  "{n} lines": "{n} линий",
  "Pay as you go · {price}": "По одному · {price}",
  "{price} · tap to see lines": "{price} · нажми, чтобы увидеть линии",
  "Tap to hide": "Нажми, чтобы скрыть",
  "Free · tap to see lines": "Бесплатно · нажми, чтобы увидеть линии",
  "Tap to see lines": "Нажми, чтобы увидеть линии",
  Locked: "Закрыто",
  "Complete — train any time": "Готово — тренируй когда угодно",
  "Test with no mistakes to complete": "Пройди Test без ошибок",
  New: "Новое",
  "Payment not confirmed yet": "Оплата ещё не подтверждена",
  "Could not confirm payment": "Не удалось подтвердить оплату",
  "Unlock {packName}": "Открыть {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Три линии остаются бесплатными. Это открывает остаток пака.",
  "One-time purchase. This pack only.": "Разовая покупка. Только этот пак.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "Паки не продаются в этом тесте Play. Три бесплатные линии Caro здесь всё равно тренируются.",
  "Rest of this pack": "Остаток этого пака",
  "This pack": "Этот пак",
  "Pay as you go. Not for sale in this Play test.": "По одному. Не продаётся в этом тесте Play.",
  "Unlock the rest of this pack": "Открыть остаток этого пака",
  "Unlock this pack": "Открыть этот пак",
  "Yours to keep. Card via Stripe.": "Твоё навсегда. Карта через Stripe.",
  "Opening checkout…": "Открываем оплату…",
  "Sign in so this stays on your account.": "Войди, чтобы сохранить на аккаунте.",
  "You will pay securely with Stripe.": "Оплата пройдёт безопасно через Stripe.",
  "Payments are not live yet.": "Оплата ещё не включена.",
  Close: "Закрыть",
  "How the gym works": "Как устроен зал",
  [GYM_INTRO]:
    "Opening Lab — строгий тренажёр книжных ходов. Practice с жёлтой подсказкой. Test без подсказки. Считается только книжный ход. Потом Play on с позиции, если хочешь.\n\nТак собирается рабочий репертуар: главные книжные ответы, а не туман идей. Находить эти ходы без подсказки делает ранние решения осознаннее. Это прочная база для книг, партий и движков — не короткий путь ко всему дебюту.",
  Continue: "Далее",
  "Don't show again": "Больше не показывать",
  "Wrong move": "Неверный ход",
  "Inaccurate move": "Неточный ход",
  "The book move is {san}.": "Книжный ход — {san}.",
  "Try again": "Ещё раз",
  "Practice again": "Тренировать снова",
  "Back to practice": "Назад к тренировке",
  "Well done": "Отлично",
  "Practice next line": "Тренировать следующую линию",
  "Test yourself": "Проверь себя",
  "Practice done": "Тренировка готова",
  "Line complete": "Линия пройдена",
  "Finished, but you missed a move": "Готово, но ход был пропущен",
  "← Back": "← Назад",
  "User guide": "Гайд",
  "What is Opening Lab?": "Что такое Opening Lab?",
  Board: "Доска",
  Book: "Книга",
  Paper: "Бумага",
  Future: "Будущее",
  Newspaper: "Газета",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Тренировка памяти по строгим линиям. Играешь только ходы выбранного дебюта; неверные ходы отклоняются, чтобы линия засела.",
  "White & Black / Special packs": "White и Black / спецпаки",
  "Each pack trains one opening. You play the book side.":
    "Каждый пак тренирует один дебют. Ты играешь книжную сторону.",
  "Practice mode": "Режим Practice",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "Жёлтые подсказки показывают следующий ход. Соперник отвечает сам. Следуй точной линии. Practice не завершает линию.",
  "Test mode": "Режим Test",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "Без подсказок. Играй только свою сторону. Неверные поля вспыхивают красным, пока не найдёшь книжный ход. Чистый Test (ноль ошибок) делает линию зелёной. Если думаешь, что отклонённый ход книжный, пришли его через Wrong move? Подтвердим — пак в подарок.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "После Practice или Test выбери 800, 1200 или 1800 и Play on с позиции. Чистый Test всё равно делает линию зелёной. Play on не завершает линию.",
  Reviews: "Повторения",
  "A clean Test turns the line green. You can train it again anytime.":
    "Чистый Test делает линию зелёной. Можешь тренировать снова когда угодно.",
  "Use the profile icon (top right) to sign in. See":
    "Войди через значок профиля (справа сверху). См.",
  "Privacy Policy": "Политика конфиденциальности",
  Terms: "Условия",
  and: "и",
};

const it: Dict = {
  "Train openings the strict way": "Allena le aperture alla lettera",
  "How to play": "Come si gioca",
  "Download the app": "Scarica l'app",
  "Continue on the web": "Continua sul web",
  "Tap to practice": "Tocca per allenarti",
  "See 18 lines": "Vedi 18 linee",
  "Free sample": "Prova gratuita",
  Start: "Inizia",
  Train: "Allena",
  "Strict lines · memory training": "Linee rigorose · memoria",
  "Help and guide": "Aiuto e guida",
  Help: "Aiuto",
  Language: "Lingua",
  "Opening Lab home": "Home Opening Lab",
  Account: "Account",
  Play: "Gioca",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "La maggior parte si butta sulla teoria delle aperture prima delle basi. È algebra prima di saper contare.",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "Pagano corsi approfonditi e ancora non sanno giocare la linea. Qui andiamo dritti. Linee rigorose. Le impari, le giochi e riconosci l'apertura quando compare.",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Tre linee Caro sono gratis. Sblocca il resto di quel pack per £1.99. Gli altri pack costano £2.99.",
  "More packs": "Altri pack",
  Free: "Gratis",
  Unlocked: "Sbloccato",
  "Pay as you go": "Paga all'uso",
  "{n} lines": "{n} linee",
  "Pay as you go · {price}": "Paga all'uso · {price}",
  "{price} · tap to see lines": "{price} · tocca per vedere le linee",
  "Tap to hide": "Tocca per nascondere",
  "Free · tap to see lines": "Gratis · tocca per vedere le linee",
  "Tap to see lines": "Tocca per vedere le linee",
  Locked: "Bloccato",
  "Complete — train any time": "Completata — allena quando vuoi",
  "Test with no mistakes to complete": "Fai un Test senza errori per completare",
  New: "Nuovo",
  "Payment not confirmed yet": "Pagamento non ancora confermato",
  "Could not confirm payment": "Impossibile confermare il pagamento",
  "Unlock {packName}": "Sblocca {packName}",
  "Three lines stay free. This unlocks the rest of the pack.":
    "Tre linee restano gratis. Questo sblocca il resto del pack.",
  "One-time purchase. This pack only.": "Acquisto unico. Solo questo pack.",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "I pack non sono in vendita in questo test Play. Le tre linee Caro gratis si allenano comunque qui.",
  "Rest of this pack": "Resto di questo pack",
  "This pack": "Questo pack",
  "Pay as you go. Not for sale in this Play test.":
    "Paga all'uso. Non in vendita in questo test Play.",
  "Unlock the rest of this pack": "Sblocca il resto di questo pack",
  "Unlock this pack": "Sblocca questo pack",
  "Yours to keep. Card via Stripe.": "Tuo per sempre. Carta tramite Stripe.",
  "Opening checkout…": "Apertura del pagamento…",
  "Sign in so this stays on your account.": "Accedi per tenerlo sul tuo account.",
  "You will pay securely with Stripe.": "Pagherai in sicurezza con Stripe.",
  "Payments are not live yet.": "I pagamenti non sono ancora attivi.",
  Close: "Chiudi",
  "How the gym works": "Come funziona la palestra",
  [GYM_INTRO]:
    "Opening Lab è un allenatore rigoroso di mosse di libro. Practice con il suggerimento giallo. Test senza suggerimenti. Conta solo la mossa di libro. Poi Play on dalla posizione, se vuoi.\n\nCosì si costruisce un repertorio che funziona: le risposte di libro, non una nebbia di idee. Trovare quelle mosse senza suggerimento rende più informate le tue decisioni iniziali. È una base solida per andare oltre — libri, partite, motori — non una scorciatoia per tutta l'apertura.",
  Continue: "Continua",
  "Don't show again": "Non mostrare più",
  "Wrong move": "Mossa sbagliata",
  "Inaccurate move": "Mossa imprecisa",
  "The book move is {san}.": "La mossa di libro è {san}.",
  "Try again": "Riprova",
  "Practice again": "Allena di nuovo",
  "Back to practice": "Torna ad allenarti",
  "Well done": "Ben fatto",
  "Practice next line": "Allena la linea successiva",
  "Test yourself": "Metti alla prova",
  "Practice done": "Allenamento fatto",
  "Line complete": "Linea completata",
  "Finished, but you missed a move": "Finito, ma hai sbagliato una mossa",
  "← Back": "← Indietro",
  "User guide": "Guida",
  "What is Opening Lab?": "Cos'è Opening Lab?",
  Board: "Scacchiera",
  Book: "Libro",
  Paper: "Carta",
  Future: "Futuro",
  Newspaper: "Giornale",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "Allenamento di memoria a linee rigorose. Giochi solo le mosse dell'apertura scelta; quelle sbagliate vengono rifiutate perché la linea resti.",
  "White & Black / Special packs": "White e Black / pack speciali",
  "Each pack trains one opening. You play the book side.":
    "Ogni pack allena un'apertura. Giochi il lato di libro.",
  "Practice mode": "Modalità Practice",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "I suggerimenti gialli mostrano la mossa successiva. L'avversario risponde da solo. Segui la linea esatta. Practice non completa la linea.",
  "Test mode": "Modalità Test",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "Niente suggerimenti. Giochi solo il tuo lato. Le case sbagliate lampeggiano in rosso fino alla mossa di libro. Un Test pulito (zero errori) mette la linea in verde. Se pensi che una mossa rifiutata sia di libro, inviala con Wrong move? Se confermiamo, un pack è gratis.",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Dopo Practice o Test, scegli 800, 1200 o 1800 e Play on dalla posizione. Un Test pulito mette comunque la linea in verde. Play on non completa la linea.",
  Reviews: "Ripassi",
  "A clean Test turns the line green. You can train it again anytime.":
    "Un Test pulito mette la linea in verde. Puoi allenarla di nuovo quando vuoi.",
  "Use the profile icon (top right) to sign in. See":
    "Usa l'icona del profilo (in alto a destra) per accedere. Vedi",
  "Privacy Policy": "Informativa sulla privacy",
  Terms: "Termini",
  and: "e",
};

const hi: Dict = {
  "Train openings the strict way": "ओपनिंग सख्ती से ट्रेन करें",
  "How to play": "कैसे खेलें",
  "Download the app": "ऐप डाउनलोड करें",
  "Continue on the web": "वेब पर जारी रखें",
  "Tap to practice": "ट्रेन करने के लिए टैप करें",
  "See 18 lines": "18 लाइनें देखें",
  "Free sample": "मुफ़्त सैंपल",
  Start: "शुरू",
  Train: "ट्रेनिंग",
  "Strict lines · memory training": "सख्त लाइनें · याद",
  "Help and guide": "मदद और गाइड",
  Help: "मदद",
  Language: "भाषा",
  "Opening Lab home": "Opening Lab होम",
  Account: "खाता",
  Play: "खेलें",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "ज़्यादातर लोग बुनियाद से पहले ओपनिंग थ्योरी में कूद पड़ते हैं। गिनती आए बिना बीजगणित जैसा।",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "गहरे कोर्स खरीदते हैं, फिर भी लाइन नहीं चल पाते। यहाँ बात साफ़ है। सख्त लाइनें। सीखो, चलो, और ओपनिंग आए तो पहचानो।",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "तीन Caro लाइनें मुफ़्त हैं। उस पैक की बाकी लाइनें £1.99 में खोलें। बाकी पैक £2.99।",
  "More packs": "और पैक",
  Free: "मुफ़्त",
  Unlocked: "खुला",
  "Pay as you go": "ज़रूरत पर खरीदें",
  "{n} lines": "{n} लाइनें",
  "Pay as you go · {price}": "ज़रूरत पर खरीदें · {price}",
  "{price} · tap to see lines": "{price} · लाइनें देखने के लिए टैप करें",
  "Tap to hide": "छिपाने के लिए टैप करें",
  "Free · tap to see lines": "मुफ़्त · लाइनें देखने के लिए टैप करें",
  "Tap to see lines": "लाइनें देखने के लिए टैप करें",
  Locked: "बंद",
  "Complete — train any time": "पूरी — कभी भी ट्रेन करें",
  "Test with no mistakes to complete": "बिना गलती Test करके पूरी करें",
  New: "नया",
  "Payment not confirmed yet": "भुगतान की पुष्टि अभी नहीं हुई",
  "Could not confirm payment": "भुगतान की पुष्टि नहीं हो सकी",
  "Unlock {packName}": "{packName} खोलें",
  "Three lines stay free. This unlocks the rest of the pack.":
    "तीन लाइनें मुफ़्त रहती हैं। इससे पैक की बाकी लाइनें खुलती हैं।",
  "One-time purchase. This pack only.": "एक बार की खरीद। केवल यही पैक।",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "इस Play टेस्ट में पैक बिक्री पर नहीं हैं। तीन मुफ़्त Caro लाइनें यहाँ ट्रेन होती रहेंगी।",
  "Rest of this pack": "इस पैक की बाकी लाइनें",
  "This pack": "यह पैक",
  "Pay as you go. Not for sale in this Play test.":
    "ज़रूरत पर खरीदें। इस Play टेस्ट में बिक्री पर नहीं।",
  "Unlock the rest of this pack": "इस पैक की बाकी लाइनें खोलें",
  "Unlock this pack": "यह पैक खोलें",
  "Yours to keep. Card via Stripe.": "आपका रहेगा। कार्ड Stripe से।",
  "Opening checkout…": "भुगतान खुल रहा है…",
  "Sign in so this stays on your account.": "खाते में रखने के लिए साइन इन करें।",
  "You will pay securely with Stripe.": "आप Stripe से सुरक्षित भुगतान करेंगे।",
  "Payments are not live yet.": "भुगतान अभी चालू नहीं हैं।",
  Close: "बंद करें",
  "How the gym works": "जिम कैसे चलता है",
  [GYM_INTRO]:
    "Opening Lab सख्त बुक-चाल ट्रेनर है। Practice पीले संकेत के साथ। Test बिना संकेत। केवल बुक चाल गिनी जाती है। फिर चाहें तो सेटअप से Play on।\n\nइस तरह काम का रेपर्टोयर बनता है: मुख्य बुक जवाब, विचारों का कोहरा नहीं। बिना संकेत वे चालें ढूँढना शुरुआती फैसलों को बेहतर बनाता है। किताबों, खेलों, इंजनों तक जाने की ठोस ज़मीन है — पूरी ओपनिंग हथियाने का शॉर्टकट नहीं।",
  Continue: "जारी रखें",
  "Don't show again": "फिर न दिखाएँ",
  "Wrong move": "गलत चाल",
  "Inaccurate move": "अशुद्ध चाल",
  "The book move is {san}.": "बुक चाल {san} है।",
  "Try again": "फिर कोशिश करें",
  "Practice again": "फिर ट्रेन करें",
  "Back to practice": "ट्रेन पर वापस",
  "Well done": "शाबाश",
  "Practice next line": "अगली लाइन ट्रेन करें",
  "Test yourself": "खुद को जाँचें",
  "Practice done": "ट्रेन हो गई",
  "Line complete": "लाइन पूरी",
  "Finished, but you missed a move": "पूरी हुई, लेकिन एक चाल छूट गई",
  "← Back": "← वापस",
  "User guide": "गाइड",
  "What is Opening Lab?": "Opening Lab क्या है?",
  Board: "बोर्ड",
  Book: "किताब",
  Paper: "कागज़",
  Future: "भविष्य",
  Newspaper: "अखबार",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "सख्त लाइन की याददाश्त ट्रेनिंग। चुनी ओपनिंग की चालें ही चलें; गलत चालें रद्द होती हैं ताकि लाइन बैठ जाए।",
  "White & Black / Special packs": "White और Black / खास पैक",
  "Each pack trains one opening. You play the book side.":
    "हर पैक एक ओपनिंग ट्रेन करता है। आप बुक पक्ष चलते हैं।",
  "Practice mode": "Practice मोड",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "पीले संकेत अगली चाल दिखाते हैं। विरोधी अपने आप जवाब देता है। सटीक लाइन चलें। Practice लाइन पूरी नहीं करता।",
  "Test mode": "Test मोड",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "कोई संकेत नहीं। केवल अपना पक्ष चलें। गलत घर लाल चमकते हैं जब तक बुक चाल न मिले। साफ़ Test (शून्य गलती) लाइन हरी कर देता है। अगर रद्द चाल बुक लगे तो Wrong move? से भेजें। पुष्टि हुई तो एक पैक मुफ़्त।",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Practice या Test के बाद 800, 1200 या 1800 चुनें और सेटअप से Play on। साफ़ Test लाइन को हरा ही करता है। Play on लाइन पूरी नहीं करता।",
  Reviews: "दोहराव",
  "A clean Test turns the line green. You can train it again anytime.":
    "साफ़ Test लाइन को हरा कर देता है। आप इसे कभी भी फिर ट्रेन कर सकते हैं।",
  "Use the profile icon (top right) to sign in. See":
    "साइन इन के लिए ऊपर दाएँ प्रोफ़ाइल आइकन इस्तेमाल करें। देखें",
  "Privacy Policy": "गोपनीयता नीति",
  Terms: "नियम",
  and: "और",
};

const ja: Dict = {
  "Train openings the strict way": "オープニングを厳密に鍛える",
  "How to play": "遊び方",
  "Download the app": "アプリをダウンロード",
  "Continue on the web": "ウェブで続ける",
  "Tap to practice": "タップして練習",
  "See 18 lines": "18ラインを見る",
  "Free sample": "無料サンプル",
  Start: "開始",
  Train: "トレーニング",
  "Strict lines · memory training": "厳密ライン · 記憶",
  "Help and guide": "ヘルプとガイド",
  Help: "ヘルプ",
  Language: "言語",
  "Opening Lab home": "Opening Lab ホーム",
  Account: "アカウント",
  Play: "対局",
  "Most people dive into opening theory before they know the basics. That is algebra before you can count.":
    "多くの人は基礎の前にオープニング理論へ飛び込む。数を数えられずに代数をやるようなものだ。",
  "They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.":
    "深い講座を買ってもラインを指せない。ここでは単刀直入。厳密なライン。覚えれば指せるし、そのオープニングが出たら分かる。",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.":
    "Caro の3ラインは無料。そのパックの残りは £1.99 で解除。他のパックは £2.99。",
  "More packs": "他のパック",
  Free: "無料",
  Unlocked: "解除済み",
  "Pay as you go": "都度購入",
  "{n} lines": "{n} ライン",
  "Pay as you go · {price}": "都度購入 · {price}",
  "{price} · tap to see lines": "{price} · タップしてラインを見る",
  "Tap to hide": "タップして隠す",
  "Free · tap to see lines": "無料 · タップしてラインを見る",
  "Tap to see lines": "タップしてラインを見る",
  Locked: "未解除",
  "Complete — train any time": "完了 — いつでも再トレーニング",
  "Test with no mistakes to complete": "ミスなしの Test で完了",
  New: "新着",
  "Payment not confirmed yet": "支払い未確認",
  "Could not confirm payment": "支払いを確認できません",
  "Unlock {packName}": "{packName} を解除",
  "Three lines stay free. This unlocks the rest of the pack.": "3ラインは無料のまま。これでパックの残りを解除します。",
  "One-time purchase. This pack only.": "買い切り。このパックのみ。",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.":
    "この Play テストではパックは販売していません。無料の Caro 3ラインはここでトレーニングできます。",
  "Rest of this pack": "このパックの残り",
  "This pack": "このパック",
  "Pay as you go. Not for sale in this Play test.": "都度購入。この Play テストでは販売していません。",
  "Unlock the rest of this pack": "このパックの残りを解除",
  "Unlock this pack": "このパックを解除",
  "Yours to keep. Card via Stripe.": "買い切り。カードは Stripe。",
  "Opening checkout…": "決済を開いています…",
  "Sign in so this stays on your account.": "アカウントに残すにはサインインしてください。",
  "You will pay securely with Stripe.": "Stripe で安全に支払います。",
  "Payments are not live yet.": "支払いはまだ開始していません。",
  Close: "閉じる",
  "How the gym works": "ジムの使い方",
  [GYM_INTRO]:
    "Opening Lab は厳密な定跡トレーナーです。Practice は黄色いヒント付き。Test はヒントなし。定跡の手だけが正解。そのあと必要ならその局面から Play on。\n\nこうして使えるレパートリーができます。主な定跡の応じ手であり、ぼんやりした着想ではない。ヒントなしでその手を見つけると、序盤の判断に根拠がつく。本・対局・エンジンへ進むための土台であり、オープニング全体を一気に身につける近道ではない。",
  Continue: "続ける",
  "Don't show again": "今後表示しない",
  "Wrong move": "違う手",
  "Inaccurate move": "不正確な手",
  "The book move is {san}.": "定跡の手は {san} です。",
  "Try again": "やり直す",
  "Practice again": "もう一度練習",
  "Back to practice": "練習に戻る",
  "Well done": "よくできました",
  "Practice next line": "次のラインを練習",
  "Test yourself": "自分を試す",
  "Practice done": "練習完了",
  "Line complete": "ライン完了",
  "Finished, but you missed a move": "終わりましたが、一手ミスがありました",
  "← Back": "← 戻る",
  "User guide": "ガイド",
  "What is Opening Lab?": "Opening Lab とは？",
  Board: "盤",
  Book: "本",
  Paper: "紙",
  Future: "未来",
  Newspaper: "新聞",
  "Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.":
    "厳密ラインの記憶トレーニング。選んだオープニングの手だけを指します。違う手は拒否され、ラインが定着します。",
  "White & Black / Special packs": "White と Black / 特別パック",
  "Each pack trains one opening. You play the book side.": "各パックは1つのオープニングを鍛えます。定跡側を指します。",
  "Practice mode": "Practice モード",
  "Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.":
    "黄色いヒントが次の手を示します。相手は自動で応じます。正確なラインに従ってください。Practice ではラインは完了しません。",
  "Test mode": "Test モード",
  "No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.":
    "ヒントなし。自分の手番だけ指します。違うマスは定跡の手が見つかるまで赤く点滅します。ミスなしの Test でラインが緑になります。拒否された手が定跡だと思う場合は Wrong move? で送ってください。確認できればパックを1つ進呈します。",
  "Play on": "Play on",
  "After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.":
    "Practice または Test のあと、800・1200・1800 を選んでその局面から Play on。ミスなしの Test はラインを緑にします。Play on ではラインは完了しません。",
  Reviews: "復習",
  "A clean Test turns the line green. You can train it again anytime.":
    "ミスなしの Test でラインが緑になります。いつでも再トレーニングできます。",
  "Use the profile icon (top right) to sign in. See": "右上のプロフィールアイコンからサインイン。参照",
  "Privacy Policy": "プライバシーポリシー",
  Terms: "利用規約",
  and: "と",
};

export const DICTS: Record<Lang, Dict> = { en, es, zh, fr, de, pt, ru, it, hi, ja };

export function isLang(value: string | null | undefined): value is Lang {
  return (
    value === "en" ||
    value === "es" ||
    value === "zh" ||
    value === "fr" ||
    value === "de" ||
    value === "pt" ||
    value === "ru" ||
    value === "it" ||
    value === "hi" ||
    value === "ja"
  );
}

export function readStoredLang(): Lang {
  if (typeof localStorage === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : "en";
  } catch {
    return "en";
  }
}

export function writeStoredLang(lang: Lang): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore quota / private mode */
  }
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  let out = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeStoredLang(next);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
  }, [lang]);

  const t = useCallback<Translate>(
    (key, vars) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n needs I18nProvider");
  }
  return ctx;
}

export function useT(): Translate {
  return useI18n().t;
}
