/**
 * Book moves that reach the still position the intro board shows.
 * Each list is a prefix of one book line in that pack, stopped when the
 * characteristic setup is on the board. The short stem on the card stays
 * the "Starting position:" text. These moves are copied from the pack
 * lines; nothing here is a new move.
 */

export type IntroSetup = {
  lineId: string;
  plies: readonly string[];
};

export const STUDY_INTRO_SETUPS: Readonly<Record<string, IntroSetup>> = {
  "caro-kann-black": {
    lineId: "ckb1",
    plies: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5", "O-O", "Nc6"],
  },
  "qgd-black": {
    lineId: "qgdb1",
    plies: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7"],
  },
  "slav-defence": {
    lineId: "sd2",
    plies: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6", "Bxc4", "Bb4", "O-O", "O-O"],
  },
  "london-black": {
    lineId: "alb1",
    plies: ["d4", "d5", "Bf4", "c6", "e3", "Bf5", "Nf3", "e6", "Bd3", "Bxd3", "Qxd3", "Nf6", "Nbd2", "Bd6"],
  },
  "d4-sidelines-black": {
    lineId: "d4s2",
    plies: ["d4", "d5", "Nf3", "Nf6", "e3", "e6", "Bd3", "c5", "c3", "Bd6", "O-O", "O-O"],
  },
  "anti-sicilian-black": {
    lineId: "as1",
    plies: ["e4", "c5", "c3", "d5", "exd5", "Qxd5", "d4", "Nf6", "Nf3", "e6"],
  },
  "nimzo-larsen-white": {
    lineId: "nl1",
    plies: ["b3", "e5", "Bb2", "Nc6", "e3", "Nf6", "Bb5", "Bd6", "Ne2", "O-O", "O-O"],
  },
  "italian-white": {
    lineId: "it1",
    plies: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "a6", "a4", "Ba7", "Nbd2", "O-O"],
  },
  "french-white": {
    lineId: "fr1",
    plies: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "Bd3"],
  },
  "alapin-white": {
    lineId: "al1",
    plies: ["e4", "c5", "c3", "Nc6", "d4", "cxd4", "cxd4", "d5", "exd5", "Qxd5", "Nf3"],
  },
  "english-black": {
    lineId: "en1",
    plies: ["c4", "c5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "Nf3", "Nf6", "O-O", "O-O"],
  },
  "kg-black": {
    lineId: "kg1",
    plies: ["e4", "e5", "f4", "exf4", "Nf3", "d5", "exd5", "Nf6", "Bb5+", "c6", "dxc6", "Nxc6"],
  },
  "scandinavian-white": {
    lineId: "sc2",
    plies: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "c6", "Bc4", "Bf5"],
  },
  "pirc-150-white": {
    lineId: "pm1",
    plies: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "Qd2", "O-O"],
  },
  "dutch-fianchetto-white": {
    lineId: "du1",
    plies: ["d4", "f5", "g3", "Nf6", "Bg2", "e6", "c4", "Be7", "Nf3", "O-O"],
  },
  "caro-advance-panov-white": {
    lineId: "ckw1",
    plies: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5", "O-O"],
  },
  "evans-black": {
    lineId: "evb1",
    plies: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5"],
  },
  "englund-white": {
    lineId: "eg3",
    plies: ["d4", "e5", "dxe5", "Nc6", "Nf3", "Qe7", "Bf4", "d6", "exd6", "cxd6", "e3"],
  },
  "budapest-white": {
    lineId: "bp1",
    plies: ["d4", "Nf6", "c4", "e5", "dxe5", "Ng4", "Bf4", "Nc6", "Nf3", "Bb4+", "Nbd2"],
  },
  "bdg-black": {
    lineId: "bdg1",
    plies: ["d4", "d5", "e4", "dxe4", "Nc3", "Nf6", "f3", "exf3", "Nxf3", "Bf5", "Bd3", "Bxd3", "Qxd3"],
  },
  "qg-white": {
    lineId: "qg1",
    plies: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7"],
  },
  "opening-traps": {
    lineId: "ot1",
    plies: ["e4", "e5", "Nf3", "d6", "Bc4", "Bg4", "Nc3"],
  },
  scotch: {
    lineId: "sg1",
    plies: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Nf6", "O-O", "Nxe4", "Re1", "d5"],
  },
  london: {
    lineId: "lon1",
    plies: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6", "Nd2", "e6", "Ngf3", "Bd6", "Bg3", "O-O", "Bd3"],
  },
  "english-white": {
    lineId: "engw1",
    plies: ["c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6", "e3", "Bb4", "Qc2", "O-O", "Nd5", "Re8", "a3", "Bf8", "Bd3"],
  },
  "catalan-white": {
    lineId: "catw1",
    plies: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "dxc4", "Nf3", "Be7", "O-O", "O-O"],
  },
  "nimzo-indian-black": {
    lineId: "nib1",
    plies: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "c5", "O-O", "Nc6"],
  },
  "grunfeld-black": {
    lineId: "gfb1",
    plies: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3", "Bg7", "Bc4", "c5", "Ne2", "O-O"],
  },
  "petroff-black": {
    lineId: "peb1",
    plies: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4", "d5", "Bd3", "Nc6"],
  },
  "berlin-black": {
    lineId: "berb1",
    plies: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6", "Bxc6", "dxc6", "dxe5", "Nf5", "Qxd8+", "Kxd8"],
  },
  "kings-indian-black": {
    lineId: "kidb1",
    plies: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6"],
  },
  "old-indian-black": {
    lineId: "oib1",
    plies: ["d4", "d6", "c4", "Nf6", "Nc3", "Nbd7", "Qc2", "e5", "Nf3", "Be7", "e4", "O-O"],
  },
  "stafford-black": {
    lineId: "stb1",
    plies: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "Nc6", "Nxc6", "dxc6", "d3", "Bc5", "Be2", "h5"],
  },
  "ponziani-white": {
    lineId: "pw1",
    plies: ["e4", "e5", "Nf3", "Nc6", "c3", "Nf6", "d4", "exd4", "e5", "Nd5", "cxd4"],
  },
  "alekhine-black": {
    lineId: "ab1",
    plies: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "Nf3", "dxe5", "Nxe5", "Nd7", "Nf3", "e6", "c4", "N5f6", "Nc3", "Be7", "Be2", "O-O"],
  },
  "french-black": {
    lineId: "frb1",
    plies: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7"],
  },
  "ruy-lopez-white": {
    lineId: "rlw1",
    plies: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"],
  },
  "sicilian-black": {
    lineId: "sib1",
    plies: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5", "Nb3", "Be6"],
  },
};
