"""Line-specific coach sentences for non-Scotch packs.

No square tokens, no eval talk, no dashes. Two angles on each line so a
pair of moves does not repeat the same second sentence.
"""

from __future__ import annotations

# Full sentences. Sentence A is the plan, sentence B is the move-order point.
PLANS: dict[str, tuple[str, str]] = {
    "ot1": (
        "Legal's Mate uses the queen as bait, then the knight finishes it.",
        "Get the bishop and both knights out before anyone looks at the queen.",
    ),
    "ot2": (
        "The Fishing Pole offers a knight so the file in front of the white king opens.",
        "Leave that knight hanging: taking it is the mistake this trap is built on.",
    ),
    "ot3": (
        "The Elephant Trap hangs a queen, then pins the piece that captured it.",
        "The king takes the bishop at the end, and the queen stays pinned.",
    ),
    "ot4": (
        "The Lasker Trap punishes the bishop capture with an underpromotion.",
        "The queen is lost once the pawn promotes to a knight with check.",
    ),
    "ot5": (
        "The Blackburne Shilling trap invites a second greedy knight capture.",
        "The queen then picks up a pawn and hits the bishop.",
    ),
    "ot6": (
        "The Stafford trap offers the queen, and taking it walks into mate.",
        "The bishop check and the bishop mate are the point, not the material.",
    ),
    "ot7": (
        "The Englund trap turns a bishop capture into a raid on the queen.",
        "The queen ends on the rook's square with an extra piece.",
    ),
    "ot8": (
        "This Queen's Gambit trap hangs the rook once the b-pawn is taken.",
        "The queen on the diagonal collects the rook after the common pawn push.",
    ),
    "ot9": (
        "The Damiano trap is a chain of checks after the knight is taken.",
        "The king is dragged up the board, so do not grab that knight.",
    ),
    "ot10": (
        "The Kieninger trap is mate once the pawn takes the bishop.",
        "That pawn capture looks natural and loses.",
    ),
    "ckb1": (
        "In this Advance Caro the light-squared bishop comes out before the e-pawn, then Black chips at the centre.",
        "Swap off White's good bishop and park a knight where it presses the centre.",
    ),
    "ckb2": (
        "In the Classical Caro the light-squared bishop drops back as the h-pawn advances, then the dark bishop finishes the shell.",
        "The bishop is traded on the light squares, and the king stays flexible.",
    ),
    "ckb3": (
        "In this Exchange Caro Black pins the knight, covers the b-pawn, and trades the dark-squared bishops.",
        "The queen stands in front of the b-pawn so the pin is safe.",
    ),
    "ckb4": (
        "In this Panov Black recaptures with the knight and blockades the isolated pawn.",
        "Castle, then keep the centre pawn firmly in Black's hands.",
    ),
    "ckb5": (
        "In this Two Knights Caro Black gives up the bishop for the knight and builds a solid pawn centre.",
        "Trade knights once the centre pawn arrives, then castle.",
    ),
    "ckb6": (
        "The Karpov Caro develops the knight to the queen's side, then the dark-squared bishop, and the queen recaptures.",
        "Ask the knight with the h-pawn before you take it.",
    ),
    "ckb7": (
        "The Fantasy Caro is a queen trap: the pin on the knight wins the queen if White grabs the pawn.",
        "Do not fear the early pawn push, because the bishop pin is the whole idea.",
    ),
    "ckb8": (
        "In this Classical Caro Black recaptures with the pawn, puts the dark bishop on its best diagonal, and brings a rook to the open file.",
        "The solid recapture keeps the king safe to castle.",
    ),
    "ckb9": (
        "This Advance Caro hits the pawn chain at once, with the knight and a bishop pin.",
        "Challenge the chain before you close the centre with the e-pawn.",
    ),
    "ckb10": (
        "This Panov fianchettoes the dark-squared bishop, castles, and then the knight asks the light-squared bishop.",
        "The long diagonal is the piece, and the knight on the queenside is the question.",
    ),
    "lon1": (
        "The classical London keeps the dark-squared bishop outside the pawn chain and builds a pyramid.",
        "Meet the opposing dark bishop by dropping yours, then plant a knight and push the f-pawn.",
    ),
    "lon2": (
        "This London opens the centre with a pawn recapture, then the light-squared bishop faces the dark bishop.",
        "Develop the king's knight before you decide the bishop trade.",
    ),
    "lon3": (
        "Black hits the centre at once, and the London still builds the same solid pyramid.",
        "Develop, castle, and keep the dark-squared bishop outside.",
    ),
    "lon4": (
        "Against the fianchetto the London stays classical, and the dark bishop drops back when the centre pawn advances.",
        "The h-pawn takes away a pin before both sides castle.",
    ),
    "lon5": (
        "This Indian move order still reaches the London pyramid, with the dark bishop outside.",
        "Castle short on both sides and keep the centre solid.",
    ),
    "lon6": (
        "The Jobava London develops the queen's knight early, and the queen recaptures if the bishop is traded.",
        "Let the centre open, then the queen stands on the long diagonal.",
    ),
    "lon7": (
        "This London meets the light-squared bishop with queen's pawn tension, and the queens face each other.",
        "The c-pawn then gains space.",
    ),
    "lon8": (
        "When the queen comes to the queenside, the London meets it with its own queen and keeps developing.",
        "The pawn push is met by stepping the queen back, not by changing the plan.",
    ),
    "lon9": (
        "Against the kingside fianchetto the London takes on the flank and keeps the dark-squared bishop.",
        "Do not give that bishop away for a knight on the rim.",
    ),
    "lon10": (
        "This London develops the knight before any flank pawn hit, and the light-squared bishop stays on the board.",
        "Drop the dark bishop when the opposing bishop stares at it, then finish the knights.",
    ),
    "it1": (
        "The Giuoco Pianissimo keeps the centre closed and trusts the bishop on its diagonal.",
        "Develop and castle before you decide when to touch the centre pawn.",
    ),
    "it2": (
        "The Two Knights attacks the king's pawn, and the sound reply is the knight move rather than a material grab.",
        "White gives the pawn back and reaches a healthy knight in the centre.",
    ),
    "it3": (
        "The Hungarian keeps the dark bishop modest, so White opens the centre and develops quietly.",
        "Trade in the centre, castle, and bring the dark-squared bishop out.",
    ),
    "it4": (
        "This quiet Italian puts the queen on the diagonal against the weak pawns.",
        "After the knight develops to the rim, taking it damages the kingside pawns.",
    ),
    "it5": (
        "Against the fianchetto the Italian probes the dark bishop, then finishes simple development.",
        "The knight jump is a probe, not a sacrifice to keep.",
    ),
    "it6": (
        "This quiet Two Knights retreats the bishop and lets a knight trade open the a-file.",
        "Castle first, then meet the knight on the rim.",
    ),
    "it7": (
        "The Greco trap punishes the greedy bishop capture with a direct attack.",
        "The pawn recapture looks free and is not.",
    ),
    "it8": (
        "In this Two Knights the pawn hits the bishop, the bishop drops home, and White takes only after the queen moves.",
        "Do not grab the pawn while the queen is still in the way.",
    ),
    "it9": (
        "This centre-attack Italian opens the middle, and the dark-squared bishop settles on the long diagonal.",
        "The pawn pushes come in order: support, then the centre strike.",
    ),
    "it10": (
        "This Two Knights opens the centre early, trades on the knight, and castles into the main shape.",
        "The bishop trade doubles Black's pawns before either king commits.",
    ),
    "qg1": (
        "The Orthodox Queen's Gambit pins the knight, castles, and puts a rook on the half-open file.",
        "Meet the pawn release by taking with the bishop, then look for the knight trade.",
    ),
    "qg2": (
        "In the Queen's Gambit Accepted White wins the pawn back with the light-squared bishop and tucks it away.",
        "Castle and meet the flank hits with calm development.",
    ),
    "qg3": (
        "In this Slav the a-pawn stops the queenside expansion, then the light-squared bishop wins the pawn back.",
        "Meet the pin and the light bishop, then gain space with the e-pawn.",
    ),
    "qg4": (
        "In the Meran White retreats the light-squared bishop and breaks with the e-pawn against the queenside pawns.",
        "Let Black expand, then strike in the centre.",
    ),
    "qg5": (
        "Against the Chigorin White takes on the centre and accepts doubled pawns for development.",
        "Once the bishops are traded, the centre opens and the queen keeps Black coordinated.",
    ),
    "qg6": (
        "In the Tartakower the knights trade and the light-squared bishop develops against the isolated pawn.",
        "The h-pawn asks the dark bishop before the queenside fianchetto.",
    ),
    "qg7": (
        "The Tarrasch gives Black a centre pawn, and White fianchettos against it.",
        "The light-squared bishop supports that pawn, so treat it as a target rather than a disaster.",
    ),
    "qg8": (
        "The Cambridge Springs pins the queen's knight with the queen and the dark-squared bishop.",
        "Castle once the pin is in place.",
    ),
    "qg9": (
        "Against the Albin White fianchettos, castles, and trades the extra knight.",
        "Do not cling to the gambit pawn, and develop the bishop on the long diagonal.",
    ),
    "qg10": (
        "The Moscow variation trades the dark-squared bishop for the knight, then Black fianchettos.",
        "The queen recapture is the idea, and White takes the pawn back afterwards.",
    ),
    "frb1": (
        "The Winawer trades on the queen's knight, then breaks with the c-pawn and the f-pawn while castling long.",
        "The queen joins the pin before those breaks.",
    ),
    "frb2": (
        "This Advance French hits the centre pawn with the queen and plants a knight on the light squares.",
        "Take the bishop with the pawn if it lands on the knight, then finish the light-squared bishop.",
    ),
    "frb3": (
        "This Advance French develops the light bishop and reroutes the knight while White pushes the h-pawn.",
        "Take in the centre once the knight has stepped aside.",
    ),
    "frb4": (
        "The open Tarrasch recaptures with the pawn and plays a free piece game against the isolated pawn.",
        "Develop the knight and the dark bishop, and do not fear the pin on the knight.",
    ),
    "frb5": (
        "The closed Tarrasch drops the knight back, breaks with the f-pawn, and later plants a knight.",
        "Trade White's dark-squared bishop before that knight lands.",
    ),
    "frb6": (
        "The Classical French meets the pin with the dark bishop, recaptures with the queen, and fianchettos.",
        "The flank pawn and the knight support the bishop on the long diagonal.",
    ),
    "frb7": (
        "The Steinitz French drops the knight, hits the centre, and develops the queen and the dark bishop.",
        "The queen pressures the centre pawn while the bishop stays solid.",
    ),
    "frb8": (
        "The Exchange French is simple development: knights, dark bishop, a pin, then castle.",
        "When the h-pawn asks the bishop, drop it and trade.",
    ),
    "frb9": (
        "The Rubinstein takes on the e-pawn, develops both knights, and hits the centre before castling.",
        "Meet the pin with the h-pawn and swing the queen.",
    ),
    "frb10": (
        "Against the King's Indian Attack Black castles, expands on the queenside, and then pushes on the kingside.",
        "The bishop drops, and the breaks follow the pawn storm.",
    ),
    "rlw1": (
        "The Breyer re-routes the knight via the home rank, drops the light bishop back, and brings the other knight across.",
        "The h-pawn comes first so the pin does not annoy the king's knight.",
    ),
    "rlw2": (
        "The Arkhangelsk fianchettos the light bishop, and White keeps a solid centre with the bishop tucked away.",
        "Meet the early queenside expansion with the a-pawn and simple development.",
    ),
    "rlw3": (
        "The Berlin takes the queens off and develops against the king that stays in the centre.",
        "Use the rook and the knights, with no attack to rush.",
    ),
    "rlw4": (
        "The Open Spanish answers the knight capture with a centre pawn, then the light bishop drops back and the queen recaptures.",
        "Win the piece back on your terms, after the bishop has moved twice.",
    ),
    "rlw5": (
        "The Exchange Spanish trades queens, lifts a rook, and parks a knight where it hits the centre.",
        "The bishop pin is met by trading queens, not by clinging to the pawn structure.",
    ),
    "rlw6": (
        "The Schliemann is a gambit on the f-pawn, so White trades and castles after the bishop trade.",
        "Take the pawn back and castle before you look for more.",
    ),
    "rlw7": (
        "The Classical Spanish meets the dark bishop with a centre break and a queen hit on the knight.",
        "Retreat the queen once the knight has been displaced, and keep the centre stable.",
    ),
    "rlw8": (
        "The Old Steinitz holds the centre modestly, so White opens it, puts a rook on the file, and regroups.",
        "The bishop drops home and the knight returns once the centre pawns are traded.",
    ),
    "rlw9": (
        "The Bird Defence jumps the knight in early, so White takes it, castles, and puts the bishop on the Italian diagonal.",
        "Meet the pawn challenge with a quiet centre pawn.",
    ),
    "rlw10": (
        "The Marshall offers a pawn for an attack, and White takes it and meets the queen with care.",
        "This is the critical book: keep the king safe and give the piece back only on your terms.",
    ),
    "sib1": (
        "The Najdorf English Attack castles short and meets long castling with a queenside pawn advance.",
        "The pawn on the a-file and the centre pawn come before that advance.",
    ),
    "sib2": (
        "The Dragon castles opposite and breaks in the centre, with exchanges into a heavy-piece ending.",
        "The long diagonal and the centre break are the counterplay.",
    ),
    "sib3": (
        "The Richter-Rauzer castles opposite, trades in the centre, and plants the queen with a rook behind it.",
        "The e-pawn keeps the centre solid until that trade.",
    ),
    "sib4": (
        "The Sveshnikov drives the knight with the centre pawn, then activates the dark-squared bishop.",
        "Take on the king's knight with the bishop and let the dark bishop loose.",
    ),
    "sib5": (
        "This Four Knights Sicilian trades knights, swings the queen, and uses the f-pawn against the uncastled king.",
        "The bishop check comes before that pawn break.",
    ),
    "sib6": (
        "In the Alapin the queen comes out early, then Black develops and tucks the queen away from the knight jump.",
        "Knights and the e-pawn first, queen second.",
    ),
    "sib7": (
        "The Smith-Morra gives the pawn back in development time and finishes with the dark bishop.",
        "Knights, the d-pawn, and the e-pawn matter more than clinging to the pawn.",
    ),
    "sib8": (
        "Against the Grand Prix Black meets the bishop with a knight jump, then breaks in the centre.",
        "Recapture with the knight so the centre stays occupied.",
    ),
    "sib9": (
        "The Rossolimo recaptures towards the centre, builds a pawn centre, and castles short.",
        "The other bishop fianchettos once the knight has developed.",
    ),
    "sib10": (
        "The Closed Sicilian fianchettos, parks a knight in the centre, castles, and then breaks.",
        "The centre break is the point of all that quiet development.",
    ),
    "qgdb1": (
        "The Orthodox for Black supports the centre, develops both knights, and castles before touching the tension.",
        "The rook comes to the e-file and the c-pawn keeps the centre solid.",
    ),
    "qgdb2": (
        "Here Black makes the light-squared bishop move twice, then the knight challenges the centre.",
        "Release the tension only once that bishop has committed.",
    ),
    "qgdb3": (
        "This early Exchange recaptures with the e-pawn and meets queenside pawn play with solid development.",
        "The knight belongs on the queen's side, and the h-pawn is just a useful pause.",
    ),
    "qgdb4": (
        "In this Exchange the rook belongs on the e-file, aiming at a prepared centre break.",
        "Do not settle for endless pawn defence.",
    ),
    "qgdb5": (
        "White's knight on the e-file side frees the f-pawn, so watch the centre and not only the queenside.",
        "Develop, castle, and be ready for a central push.",
    ),
    "qgdb6": (
        "This is the same Orthodox shape reached with the king's knight first.",
        "Recognise the rook on the c-file and the solid c-pawn, because the move order is the lesson.",
    ),
    "qgdb7": (
        "Without the pin, Black can hit the centre and develop the knight to the natural square.",
        "The light-squared bishop stays on its diagonal, and the knight does not hide on the queen's side.",
    ),
    "qgdb8": (
        "The Ragozin pins the knight, recaptures on the king's knight with the queen, and opens the centre after castling.",
        "The h-pawn asks the bishop before that opening of the centre.",
    ),
    "qgdb9": (
        "The Lasker Defence asks the bishop, breaks the pin with the knight, and trades to damage the pawns.",
        "The knight jump is the freeing move, so do not stay pinned.",
    ),
    "qgdb10": (
        "The Tartakower develops the light-squared bishop by fianchetto, then brings the last knight out.",
        "Ask the dark bishop with the h-pawn before that fianchetto.",
    ),
    "sd1": (
        "The classical Slav develops the light-squared bishop, and the a-pawn stops the queenside expansion.",
        "The pawn on the c-file is a temporary extra, so castle before you fall in love with it.",
    ),
    "sd2": (
        "This classical Slav develops the bishop, gives the pawn back, pins the knight, and castles both sides.",
        "King safety comes before any further pawn hunt.",
    ),
    "sd3": (
        "In the Czech Slav White takes the bishop pair, and Black recaptures with the pawn to build a solid wall.",
        "The e-pawn supports that recapture, and the wall is the idea.",
    ),
    "sd4": (
        "When White omits the a-pawn, Black expands on the queenside and keeps the extra pawn's pressure.",
        "The a-pawn is what normally stops this expansion, and here it never came.",
    ),
    "sd5": (
        "The Slow Slav develops the light-squared bishop before the e-pawn, then the dark bishop and castling.",
        "White's bishop stares at yours, so finish development anyway.",
    ),
    "sd6": (
        "This Slow Slav drops the light bishop back, trades it, and completes the shell with the dark bishop.",
        "The knight on the queen's side and the dark bishop are the shape to remember.",
    ),
    "sd7": (
        "The Exchange Slav is symmetrical, so develop both bishops to active squares and play with a plan.",
        "Do not shuffle, because the bishops are the activity.",
    ),
    "sd8": (
        "In this Exchange the queen hits the b-pawn, and Black meets it with the queen, calmly.",
        "There is no need to panic or to weaken the queenside.",
    ),
    "sd9": (
        "The Chebanenko plays the a-pawn, meets the space gain, and asks the dark bishop with a knight.",
        "The light-squared bishop still comes out before the centre is closed.",
    ),
    "sd10": (
        "This Slav develops the bishop and the knight, then breaks in the centre.",
        "The queen supports the break, and a solid Slav can still open the game.",
    ),
    "nib1": (
        "This Rubinstein Nimzo pins the knight, then challenges the centre with both central pawns.",
        "Finish with the queen's knight and keep the tension until a capture does something useful.",
    ),
    "nib2": (
        "Here Black takes twice and leaves White with an isolated pawn to play against.",
        "Develop the remaining knight and the light-squared bishop, and keep that pawn as a target.",
    ),
    "nib3": (
        "The Huebner trades bishop for knight, then closes the centre.",
        "The doubled pawns stay, and the pawn chain decides the play.",
    ),
    "nib4": (
        "White will recapture on the queen's knight with a knight, so Black retreats the bishop.",
        "Do not hand over the bishop pair once the knight can recapture cleanly.",
    ),
    "nib5": (
        "In the Classical Nimzo the queen recaptures, White keeps the bishop pair, and Black develops the queenside.",
        "The queen move costs White time, so use it to fianchetto.",
    ),
    "nib6": (
        "This Classical Nimzo hits the centre at once against the early queen.",
        "Ask the pinning bishop, then strike before White is developed.",
    ),
    "nib7": (
        "The Saemisch accepts doubled pawns for the bishop pair, so Black develops and presses the doubled pawn.",
        "Castle and keep the centre modest while that pawn is the target.",
    ),
    "nib8": (
        "The Kmoch supports a future centre push but delays development, so Black hits the centre at once.",
        "Trade the bishop for the knight and strike before White consolidates.",
    ),
    "nib9": (
        "The Leningrad answers Black's pin with a pin, so ask the bishop and hit the centre.",
        "The centre pawn push is the reply to that counter-pin.",
    ),
    "nib10": (
        "This move order becomes a Ragozin, and the king's side pawn thrust breaks the pin.",
        "Develop the knight into the centre once the bishops have stared at each other.",
    ),
    "kidb1": (
        "The Mar del Plata castles, strikes in the centre, and meets the space gain by rerouting a knight and pushing the f-pawn.",
        "The knight goes via the queen's side so the f-pawn can move, and that is the plan.",
    ),
    "kidb2": (
        "Against the Bayonet, Black takes on the a-file with the rook and still gets the f-pawn in.",
        "The queenside space is normal, and the kingside pawn is still the counterplay.",
    ),
    "kidb3": (
        "In the Petrosian system Black restrains the queenside, then asks the dark bishop with kingside pawns.",
        "The knight on the rim is how that bishop is questioned.",
    ),
    "kidb4": (
        "This Classical King's Indian trades in the centre and puts a rook on the open file.",
        "The c-pawn then hits the knight that recaptured.",
    ),
    "kidb5": (
        "The Samisch prepares a queenside pawn advance before White castles long.",
        "The knight, the a-pawn, and the rook are the preparation, so do not rush.",
    ),
    "kidb6": (
        "Against the Four Pawns Black hits the big centre with the c-pawn and the e-pawn, then takes.",
        "Open the centre before that pawn wall rolls.",
    ),
    "kidb7": (
        "This fianchetto King's Indian develops the knight to the queen's side, strikes in the centre, and trades.",
        "The rook belongs on the e-file before that trade.",
    ),
    "kidb8": (
        "The Averbakh pin is met by a flank hit and an e-pawn against the centre.",
        "Ask the bishop, then undermine the advanced pawn.",
    ),
    "kidb9": (
        "In the exchange King's Indian Black recaptures on the queen with the rook and develops simply.",
        "The knight and the c-pawn complete a calm centre.",
    ),
    "kidb10": (
        "This Classical King's Indian develops the knight to the queen's side, restrains with the a-pawn, and then trades in the centre.",
        "The rook comes to the e-file before the trade, and White recaptures with the bishop.",
    ),
}

LABELS: dict[str, str] = {
    "ot1": "Legal's Mate",
    "ot2": "Fishing Pole",
    "ot3": "Elephant Trap",
    "ot4": "Lasker Trap",
    "ot5": "Blackburne Shilling",
    "ot6": "Stafford trap",
    "ot7": "Englund trap",
    "ot8": "Queen's Gambit trap",
    "ot9": "Damiano trap",
    "ot10": "Kieninger trap",
    "ckb1": "Advance Caro",
    "ckb2": "Classical Caro",
    "ckb3": "Exchange Caro",
    "ckb4": "Panov",
    "ckb5": "Two Knights Caro",
    "ckb6": "Karpov Caro",
    "ckb7": "Fantasy Caro",
    "ckb8": "Classical Caro with the knight recapture",
    "ckb9": "Advance Caro with the early flank hit",
    "ckb10": "Panov fianchetto",
    "lon1": "classical London",
    "lon2": "open London",
    "lon3": "London with the early flank hit",
    "lon4": "London against the fianchetto",
    "lon5": "London Indian move order",
    "lon6": "Jobava London",
    "lon7": "London with queen tension",
    "lon8": "London against the queenside queen",
    "lon9": "London against the kingside fianchetto",
    "lon10": "London with the knight first",
    "it1": "Giuoco Pianissimo",
    "it2": "Two Knights",
    "it3": "Hungarian Defence",
    "it4": "quiet Italian",
    "it5": "Italian against the fianchetto",
    "it6": "quiet Two Knights",
    "it7": "Greco trap",
    "it8": "Two Knights with the pawn hit",
    "it9": "centre-attack Italian",
    "it10": "open Two Knights",
    "qg1": "Orthodox Queen's Gambit",
    "qg2": "Queen's Gambit Accepted",
    "qg3": "Slav for White",
    "qg4": "Meran",
    "qg5": "Chigorin",
    "qg6": "Tartakower for White",
    "qg7": "Tarrasch",
    "qg8": "Cambridge Springs for White",
    "qg9": "Albin",
    "qg10": "Moscow variation",
    "frb1": "Winawer",
    "frb2": "Advance French",
    "frb3": "Advance French with the light bishop",
    "frb4": "open Tarrasch French",
    "frb5": "closed Tarrasch French",
    "frb6": "Classical French",
    "frb7": "Steinitz French",
    "frb8": "Exchange French",
    "frb9": "Rubinstein French",
    "frb10": "King's Indian Attack",
    "rlw1": "Breyer",
    "rlw2": "Arkhangelsk",
    "rlw3": "Berlin",
    "rlw4": "Open Spanish",
    "rlw5": "Exchange Spanish",
    "rlw6": "Schliemann",
    "rlw7": "Classical Spanish",
    "rlw8": "Old Steinitz",
    "rlw9": "Bird Defence",
    "rlw10": "Marshall",
    "sib1": "Najdorf",
    "sib2": "Dragon",
    "sib3": "Richter-Rauzer",
    "sib4": "Sveshnikov",
    "sib5": "Four Knights Sicilian",
    "sib6": "Alapin",
    "sib7": "Smith-Morra",
    "sib8": "Grand Prix",
    "sib9": "Rossolimo",
    "sib10": "Closed Sicilian",
    "qgdb1": "Orthodox for Black",
    "qgdb2": "freeing Queen's Gambit",
    "qgdb3": "early Exchange",
    "qgdb4": "Exchange with the rook",
    "qgdb5": "Exchange with the knight beside the king",
    "qgdb6": "knight-first Orthodox",
    "qgdb7": "quiet Queen's Gambit",
    "qgdb8": "Ragozin",
    "qgdb9": "Lasker Defence",
    "qgdb10": "Tartakower",
    "sd1": "classical Slav",
    "sd2": "castled classical Slav",
    "sd3": "Czech Slav",
    "sd4": "Slav without the a-pawn stop",
    "sd5": "Slow Slav",
    "sd6": "Slow Slav with the bishop retreat",
    "sd7": "Exchange Slav",
    "sd8": "Exchange Slav with the queens",
    "sd9": "Chebanenko",
    "sd10": "Slav with the centre break",
    "nib1": "Rubinstein Nimzo",
    "nib2": "isolated-pawn Nimzo",
    "nib3": "Huebner",
    "nib4": "Rubinstein with the knight recapture",
    "nib5": "Classical Nimzo",
    "nib6": "Classical Nimzo with the centre hit",
    "nib7": "Saemisch",
    "nib8": "Kmoch",
    "nib9": "Leningrad Nimzo",
    "nib10": "Ragozin move order",
    "kidb1": "Mar del Plata",
    "kidb2": "Bayonet",
    "kidb3": "Petrosian system",
    "kidb4": "classical centre trade",
    "kidb5": "Samisch",
    "kidb6": "Four Pawns",
    "kidb7": "fianchetto King's Indian",
    "kidb8": "Averbakh",
    "kidb9": "exchange King's Indian",
    "kidb10": "classical King's Indian with the queen's knight",
}

OPENERS: dict[tuple[str, str], str] = {
    ("opening-traps", "e4"): "e4 claims a share of the centre and frees the light-squared bishop. A short trap grows from this open start.",
    ("opening-traps", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop. A short trap grows from this queen's pawn start.",
    ("caro-kann-black", "e4"): "e4 claims a share of the centre and frees the light-squared bishop. Black meets it with the Caro-Kann pawn centre.",
    ("london", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop, so that bishop can come out before the e-pawn.",
    ("italian-white", "e4"): "e4 claims a share of the centre and frees the light-squared bishop, the piece this Italian is built around.",
    ("qg-white", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop, before White offers the queen's pawn.",
    ("french-black", "e4"): "e4 claims a share of the centre and frees the light-squared bishop. Black answers with the French pawn chain.",
    ("ruy-lopez-white", "e4"): "e4 claims a share of the centre and frees the light-squared bishop, which will fight a knight from the queenside.",
    ("sicilian-black", "e4"): "e4 claims a share of the centre and frees the light-squared bishop. Black answers from the flank on the c-file.",
    ("qgd-black", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop. Black will hold a solid pawn centre before releasing the tension.",
    ("slav-defence", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop. Black will build a pawn centre and keep the light-squared bishop free.",
    ("nimzo-indian-black", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop. Black will pin the knight that supports the centre.",
    ("kings-indian-black", "d4"): "d4 claims a share of the centre and frees the dark-squared bishop. Black lets that centre grow, fianchettos, and only then strikes.",
}
