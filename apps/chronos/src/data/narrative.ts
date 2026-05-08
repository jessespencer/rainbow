/**
 * Narrative thread data — interpretive prominence scores for a stream graph.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  THIS IS INTERPRETIVE DATA, NOT SCRIPTURAL FACT.                   │
 * │                                                                     │
 * │  Each thread's "value" (0-100) represents its relative narrative    │
 * │  weight at a given moment — how prominent that theme is in the      │
 * │  unfolding biblical story. These are subjective, hand-tuned         │
 * │  numbers meant to evoke the SHAPE of the story, not to quantify    │
 * │  it.                                                                │
 * │                                                                     │
 * │  Interpretive choices:                                              │
 * │  • Covenant dips during exile because Israel broke the covenant —   │
 * │    the Sinai covenant's blessings were conditional, and exile is    │
 * │    the consequence. The thread persists as embers because God's     │
 * │    faithfulness endures even when Israel's doesn't.                 │
 * │  • Messianic is a whisper for millennia because the promise is      │
 * │    there from Genesis 3:15 but unfolds gradually through types      │
 * │    and prophecies. Its overwhelming peak at Christ is the           │
 * │    theological climax of the entire Old Testament arc.              │
 * │  • Kingdom-united ends HARD at 931 BC because the split is a       │
 * │    political rupture, not a gradual transition.                     │
 * │  • Prophecy peaks during crisis because prophets are God's          │
 * │    response to covenant failure — they rise when kings fall.        │
 * │                                                                     │
 * │  The stream graph is meant to evoke the shape of the biblical      │
 * │  story, not to quantify it. If you look at it and feel the         │
 * │  story's rhythm, it's working.                                      │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export interface NarrativePoint {
  year: number;
  value: number;
}

export interface NarrativeThread {
  id: string;
  name: string;
  color: string;
  description: string;
  points: NarrativePoint[];
}

/** Interpolate a thread's value at any year from its sparse control points. */
export const interpolateAt = (points: NarrativePoint[], year: number): number => {
  if (points.length === 0) return 0;
  if (year <= points[0]!.year) return points[0]!.value;
  if (year >= points[points.length - 1]!.year) return points[points.length - 1]!.value;

  // Find bracketing pair
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return a.value + t * (b.value - a.value);
    }
  }

  return 0;
};

export const NARRATIVE_START = -4004;
export const NARRATIVE_END = 50;

// ─── Thread definitions ─────────────────────────────────────────────

const covenant: NarrativeThread = {
  id: "covenant",
  name: "Covenant",
  color: "var(--thread-covenant)",
  description: "The promise made and carried forward",
  points: [
    { year: -4004, value: 0 },
    { year: -3000, value: 0 },
    { year: -1921, value: 60 },   // Call of Abraham — covenant begins
    { year: -1850, value: 55 },   // Sustained through patriarchs
    { year: -1700, value: 45 },   // Joseph in Egypt — preserved but dimming
    { year: -1500, value: 20 },   // Egyptian slavery — covenant dormant
    { year: -1491, value: 70 },   // Sinai — covenant renewed with a nation
    { year: -1400, value: 55 },   // Wilderness/conquest
    { year: -1100, value: 35 },   // Judges — covenant fraying
    { year: -1010, value: 75 },   // David anointed — Davidic covenant
    { year: -970, value: 70 },    // Solomon — temple built
    { year: -932, value: 50 },    // Pre-split decline
    { year: -800, value: 30 },    // Broken covenant through monarchy
    { year: -700, value: 25 },    // Further decline
    { year: -586, value: 10 },    // Exile — covenant consequences
    { year: -538, value: 15 },    // Return — embers
    { year: -430, value: 10 },    // Post-Malachi
    { year: -200, value: 5 },     // Intertestamental silence
    { year: -6, value: 20 },      // John the Baptist — stirring
    { year: 27, value: 65 },      // Jesus's ministry — new covenant
    { year: 33, value: 75 },      // Resurrection — covenant fulfilled
    { year: 50, value: 70 },
  ],
};

const kingdomUnited: NarrativeThread = {
  id: "kingdom-united",
  name: "United Kingdom",
  color: "var(--thread-kingdom-united)",
  description: "One throne, one people",
  points: [
    { year: -4004, value: 0 },
    { year: -1060, value: 0 },
    { year: -1050, value: 20 },   // Saul anointed
    { year: -1010, value: 55 },   // David anointed
    { year: -1000, value: 70 },   // David's reign — peak
    { year: -970, value: 80 },    // Solomon's glory
    { year: -940, value: 75 },    // Late Solomon
    { year: -932, value: 70 },    // Last moment before the split
    { year: -931, value: 0 },     // HARD DROP — kingdom divides
    { year: 50, value: 0 },
  ],
};

const kingdomNorth: NarrativeThread = {
  id: "kingdom-north",
  name: "Israel (North)",
  color: "var(--thread-kingdom-north)",
  description: "Ten tribes in rebellion",
  points: [
    { year: -4004, value: 0 },
    { year: -932, value: 0 },
    { year: -931, value: 50 },    // HARD APPEAR — split
    { year: -910, value: 45 },    // Early instability
    { year: -880, value: 55 },    // Omri dynasty rises
    { year: -860, value: 60 },    // Ahab — powerful but wicked
    { year: -840, value: 50 },    // Post-Ahab decline
    { year: -800, value: 45 },    // Jeroboam II prosperity
    { year: -780, value: 50 },    // Peak of Jeroboam II
    { year: -750, value: 35 },    // Rapid decline
    { year: -730, value: 25 },    // Final kings
    { year: -723, value: 15 },    // Last gasp
    { year: -722, value: 0 },     // HARD END — fall of Samaria
    { year: 50, value: 0 },
  ],
};

const kingdomSouth: NarrativeThread = {
  id: "kingdom-south",
  name: "Judah (South)",
  color: "var(--thread-kingdom-south)",
  description: "The line of David preserved",
  points: [
    { year: -4004, value: 0 },
    { year: -932, value: 0 },
    { year: -931, value: 40 },    // HARD APPEAR — narrower than North
    { year: -900, value: 35 },    // Early southern kings
    { year: -850, value: 30 },    // Jehoshaphat
    { year: -800, value: 25 },    // Unstable period
    { year: -715, value: 55 },    // Hezekiah's reforms — peak
    { year: -690, value: 35 },    // Manasseh's wickedness
    { year: -640, value: 30 },    // Pre-Josiah
    { year: -625, value: 50 },    // Josiah's reforms — second peak
    { year: -610, value: 35 },    // Josiah dies
    { year: -600, value: 25 },    // Final kings
    { year: -587, value: 10 },    // Last gasp
    { year: -586, value: 0 },     // HARD END — fall of Jerusalem
    { year: 50, value: 0 },
  ],
};

const prophecy: NarrativeThread = {
  id: "prophecy",
  name: "Prophecy",
  color: "var(--thread-prophecy)",
  description: "The voice that will not be silenced",
  points: [
    { year: -4004, value: 0 },
    { year: -1100, value: 0 },
    { year: -1050, value: 10 },   // Samuel — faint beginning
    { year: -900, value: 15 },    // Early prophets
    { year: -870, value: 30 },    // Elijah
    { year: -850, value: 35 },    // Elisha
    { year: -800, value: 25 },    // Quiet period
    { year: -760, value: 55 },    // Amos, Hosea — 8th century surge
    { year: -740, value: 65 },    // Isaiah begins
    { year: -700, value: 60 },    // Micah, Isaiah at peak
    { year: -650, value: 40 },    // Quieter
    { year: -627, value: 55 },    // Jeremiah begins
    { year: -600, value: 70 },    // Jeremiah, Ezekiel — peak
    { year: -586, value: 75 },    // Prophets during the fall
    { year: -550, value: 55 },    // Daniel in exile
    { year: -520, value: 40 },    // Haggai, Zechariah
    { year: -430, value: 20 },    // Malachi — last prophet
    { year: -400, value: 5 },     // Silence begins
    { year: -200, value: 3 },     // Intertestamental — near zero
    { year: -10, value: 5 },      // Stirring before John
    { year: -6, value: 15 },      // John the Baptist
    { year: 27, value: 25 },      // Jesus as prophet
    { year: 33, value: 20 },      // Fulfilled
    { year: 50, value: 15 },
  ],
};

const exile: NarrativeThread = {
  id: "exile",
  name: "Exile",
  color: "var(--thread-exile)",
  description: "The people scattered, the land empty",
  points: [
    { year: -4004, value: 0 },
    { year: -730, value: 0 },
    { year: -722, value: 20 },    // Northern exile — small surge
    { year: -700, value: 15 },    // Northern diaspora continues
    { year: -590, value: 10 },    // Pre-fall Judah
    { year: -586, value: 70 },    // Fall of Jerusalem — massive surge
    { year: -570, value: 75 },    // Peak exile — dominant thread
    { year: -550, value: 65 },    // Babylonian captivity
    { year: -538, value: 50 },    // First return under Zerubbabel
    { year: -515, value: 40 },    // Temple rebuilt
    { year: -458, value: 30 },    // Ezra's return
    { year: -445, value: 25 },    // Nehemiah — walls rebuilt
    { year: -400, value: 20 },    // Diaspora continues
    { year: -200, value: 15 },    // Widespread diaspora
    { year: -4, value: 10 },      // Still scattered
    { year: 33, value: 8 },       // Diaspora persists
    { year: 50, value: 8 },
  ],
};

const messianic: NarrativeThread = {
  id: "messianic",
  name: "Messianic",
  color: "var(--thread-messianic)",
  description: "Light breaking into the world",
  points: [
    { year: -4004, value: 2 },    // Genesis 3:15 — protoevangelium whisper
    { year: -3000, value: 1 },    // Barely there
    { year: -2000, value: 1 },    // Faintest presence
    { year: -1921, value: 5 },    // Abraham — "all nations blessed"
    { year: -1700, value: 4 },    // Through patriarchs
    { year: -1491, value: 5 },    // Passover lamb — type of Christ
    { year: -1010, value: 10 },   // Davidic covenant — "throne forever"
    { year: -970, value: 8 },     // Solomon — type of the king
    { year: -800, value: 6 },     // Quiet period
    { year: -740, value: 15 },    // Isaiah 7:14 — virgin birth
    { year: -700, value: 20 },    // Isaiah 9, 53 — suffering servant
    { year: -690, value: 15 },    // Micah 5:2 — Bethlehem
    { year: -600, value: 18 },    // Jeremiah 31 — new covenant
    { year: -550, value: 20 },    // Daniel 9 — seventy weeks
    { year: -430, value: 12 },    // Malachi — messenger coming
    { year: -200, value: 5 },     // Intertestamental — expectation building
    { year: -50, value: 8 },      // Growing anticipation
    { year: -6, value: 30 },      // John the Baptist — "prepare the way"
    { year: -4, value: 45 },      // Birth of Christ
    { year: 27, value: 75 },      // Ministry begins — "the kingdom is here"
    { year: 30, value: 85 },      // Ministry peak
    { year: 33, value: 100 },     // Resurrection — overwhelming climax
    { year: 50, value: 90 },
  ],
};

export const narrativeThreads: NarrativeThread[] = [
  covenant,
  kingdomUnited,
  kingdomNorth,
  kingdomSouth,
  prophecy,
  exile,
  messianic,
];
