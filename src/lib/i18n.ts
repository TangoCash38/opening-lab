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

export const LANGS = ["en", "es", "zh", "fr"] as const;
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
  "The book move is {san}.": "The book move is {san}.",
  "Try again": "Try again",
  "Practice again": "Practice again",
  "Well done": "Well done",
  "Practice next line": "Practice next line",
  "Practice done": "Practice done",
  "Line complete": "Line complete",
  "Finished, but you missed a move": "Finished, but you missed a move",
  "← Back": "← Back",
  "User guide": "User guide",
  "What is Opening Lab?": "What is Opening Lab?",
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
  "The book move is {san}.": "La jugada de libro es {san}.",
  "Try again": "Reintentar",
  "Practice again": "Practicar de nuevo",
  "Well done": "Bien hecho",
  "Practice next line": "Practicar la siguiente línea",
  "Practice done": "Práctica hecha",
  "Line complete": "Línea completa",
  "Finished, but you missed a move": "Terminaste, pero fallaste una jugada",
  "← Back": "← Atrás",
  "User guide": "Guía",
  "What is Opening Lab?": "¿Qué es Opening Lab?",
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
  "The book move is {san}.": "书谱着法是 {san}。",
  "Try again": "再试一次",
  "Practice again": "再练习",
  "Well done": "做得好",
  "Practice next line": "练习下一条线路",
  "Practice done": "练习完成",
  "Line complete": "线路完成",
  "Finished, but you missed a move": "下完了，但漏了一着",
  "← Back": "← 返回",
  "User guide": "使用指南",
  "What is Opening Lab?": "Opening Lab 是什么？",
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
  "The book move is {san}.": "Le coup du livre est {san}.",
  "Try again": "Réessayer",
  "Practice again": "Pratiquer encore",
  "Well done": "Bravo",
  "Practice next line": "Practice la ligne suivante",
  "Practice done": "Practice terminé",
  "Line complete": "Ligne terminée",
  "Finished, but you missed a move": "Terminé, mais tu as manqué un coup",
  "← Back": "← Retour",
  "User guide": "Guide",
  "What is Opening Lab?": "Qu'est-ce qu'Opening Lab ?",
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

export const DICTS: Record<Lang, Dict> = { en, es, zh, fr };

export function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "es" || value === "zh" || value === "fr";
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
