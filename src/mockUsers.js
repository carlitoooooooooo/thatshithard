// Mock users with pre-set vote histories for Taste Match feature
// Votes: { trackId: "right" (hard) | "left" (trash) }

export const MOCK_USERS = [
  {
    username: "drill_sz",
    avatarColor: "#ff2d78",
    bio: "uk drill or nothin",
    votes: {
      2: "right",  // Neon Drip - Drill
      6: "right",  // Block Cypher - Hip-Hop
      11: "right", // Run It Up - Trap
      14: "right", // Concrete Jungle - Drill
      16: "right", // Street Philosopher - Hip-Hop
      1: "right",  // Midnight Frequencies - Trap
      3: "left",   // Lavender Haze - R&B
      4: "left",   // Afro Static - Afrobeats
      5: "left",   // Glitch Protocol - Hyperpop
      8: "left",   // Soulfire - Soul
    },
  },
  {
    username: "solxris.beats",
    avatarColor: "#bf5fff",
    bio: "vibes only 💜",
    votes: {
      3: "right",  // Lavender Haze - R&B
      8: "right",  // Soulfire - Soul
      10: "right", // Bedroom Sessions - Indie
      15: "right", // Brown Sugar - R&B
      18: "right", // Numb Season - Indie
      20: "right", // Black Gold - Soul
      2: "left",   // Neon Drip - Drill
      11: "left",  // Run It Up - Trap
      13: "left",  // 404 Error - Hyperpop
      14: "left",  // Concrete Jungle - Drill
    },
  },
  {
    username: "m0dem_labs",
    avatarColor: "#00cfff",
    bio: "glitch pop chaos",
    votes: {
      5: "right",  // Glitch Protocol - Hyperpop
      9: "right",  // Synthetik Dreams - Electronic
      13: "right", // 404 Error - Hyperpop
      19: "right", // Warehouse Rave - Electronic
      7: "right",  // Club Ready - Jersey Club
      17: "right", // Floor Work - Jersey Club
      3: "left",   // Lavender Haze - R&B
      6: "left",   // Block Cypher - Hip-Hop
      20: "left",  // Black Gold - Soul
      8: "left",   // Soulfire - Soul
    },
  },
  {
    username: "yxng_eko",
    avatarColor: "#aaff00",
    bio: "afroswing king 👑",
    votes: {
      4: "right",  // Afro Static - Afrobeats
      12: "right", // Lagos Nights - Afrobeats
      8: "right",  // Soulfire - Soul
      15: "right", // Brown Sugar - R&B
      20: "right", // Black Gold - Soul
      3: "right",  // Lavender Haze - R&B
      6: "right",  // Block Cypher - Hip-Hop
      5: "left",   // Glitch Protocol - Hyperpop
      13: "left",  // 404 Error - Hyperpop
      9: "left",   // Synthetik Dreams - Electronic
    },
  },
  {
    username: "presstek",
    avatarColor: "#ff6600",
    bio: "jersey club forever 🎵",
    votes: {
      7: "right",  // Club Ready - Jersey Club
      17: "right", // Floor Work - Jersey Club
      19: "right", // Warehouse Rave - Electronic
      9: "right",  // Synthetik Dreams - Electronic
      2: "right",  // Neon Drip - Drill
      11: "right", // Run It Up - Trap
      1: "right",  // Midnight Frequencies - Trap
      3: "left",   // Lavender Haze - R&B
      10: "left",  // Bedroom Sessions - Indie
      18: "left",  // Numb Season - Indie
    },
  },
];
