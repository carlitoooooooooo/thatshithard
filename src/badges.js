export const BADGES = [
  {
    id: "first_hard",
    label: "First Hard",
    emoji: "🔥",
    desc: "Hard your first track",
    check: (stats) => stats.totalHards >= 1,
  },
  {
    id: "ten_hards",
    label: "Hard Heads",
    emoji: "💯",
    desc: "Hard 10 tracks",
    check: (stats) => stats.totalHards >= 10,
  },
  {
    id: "trash_talk",
    label: "Trash Talk",
    emoji: "💀",
    desc: "Trash 5 tracks",
    check: (stats) => stats.totalTrash >= 5,
  },
  {
    id: "genre_king",
    label: "Genre King",
    emoji: "👑",
    desc: "Hard tracks from 5 different genres",
    check: (stats) => stats.uniqueGenres >= 5,
  },
  {
    id: "critic",
    label: "The Critic",
    emoji: "🎯",
    desc: "Rate 20 tracks",
    check: (stats) => stats.totalRated >= 20,
  },
  {
    id: "early_adopter",
    label: "Early Adopter",
    emoji: "⚡",
    desc: "One of the first",
    check: () => true,
  },
];
