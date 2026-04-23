/**
 * Timeline figure data — Chronos Bible Timeline
 *
 * ═══════════════════════════════════════════════════════════════════
 * CHRONOLOGY SOURCES
 * ═══════════════════════════════════════════════════════════════════
 *
 * Pre-monarchy (Adam → United Kingdom):
 *   James Ussher, "Annals of the World" (1650).
 *   Genesis 5 & 11 lifespans computed from 4004 BC creation anchor.
 *   Patriarchal dates derived from stated ages at fatherhood and death.
 *   Exodus placed at 1491 BC; judges dates approximate and sequential
 *   per Ussher, though in reality many judgeships were regional and
 *   overlapping.
 *
 * United Monarchy:
 *   Transitional — uses traditional 40-year reigns for Saul, David,
 *   and Solomon, anchored so that Solomon's death aligns with Thiele's
 *   930 BC start of the divided kingdom.
 *
 * Divided Kingdom:
 *   Edwin R. Thiele, "The Mysterious Numbers of the Hebrew Kings"
 *   (3rd ed., 1983). Coregency dates are included where Thiele
 *   identifies them (e.g., Jeroboam II from 793, Azariah from 792).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONVENTIONS
 * ═══════════════════════════════════════════════════════════════════
 *
 * - Years are signed integers: negative = BC, positive = AD.
 *   There is no year 0. (-1 = 1 BC, 1 = AD 1.)
 * - For divided-kingdom kings whose birth and death dates are
 *   unknown, birth is set equal to reignStart and death is set
 *   equal to reignEnd. This is a display convention, not a
 *   historical claim.
 * - Judges dates are approximate; scholarly consensus treats many
 *   judgeships as regional and overlapping rather than sequential.
 * - Prophet lifespans are estimated from their active ministry
 *   periods. Exact birth/death years are rarely recorded.
 *
 * ═══════════════════════════════════════════════════════════════════
 * NOTABLE ASSUMPTIONS / CONTESTED DATES
 * ═══════════════════════════════════════════════════════════════════
 *
 * - Enoch: "death" year is his translation (taken by God), not death.
 * - Abraham: born when Terah was 130 (not 70); Ussher's reasoning
 *   from Acts 7:4 and Gen 12:4.
 * - Pekah (Israel): Thiele dates his reign 752–732 BC. The first
 *   12 years (752–740) overlap with Menahem and Pekahiah, likely
 *   representing a rival reign in Gilead.
 * - Joel: date is highly contested (9th century to post-exilic).
 *   Placed here at ~835 BC following the early-dating tradition
 *   (Joash of Judah era).
 * - Obadiah: placed at ~586 BC (post-destruction), though some
 *   scholars date him to the 9th century.
 *
 * ═══════════════════════════════════════════════════════════════════
 * GENEALOGY / LINEAGE DATA
 * ═══════════════════════════════════════════════════════════════════
 *
 * The `parent` and `lineage` fields support the subway-map lineage
 * view. Each figure may optionally belong to a lineage "line" and
 * reference its direct ancestor via `parent`.
 *
 * Messianic line source: Matthew 1 (primary), cross-referenced with
 * Luke 3 and Genesis 5, 11. The segment from Zerubbabel to Joseph
 * (Matt 1:13-15: Abiud → Eliakim → Azor → Zadok → Achim → Eliud →
 * Eleazar → Matthan → Jacob) uses approximate dates evenly
 * distributed across the intertestamental period (~500–10 BC), as
 * Scripture provides no chronological data for these figures.
 *
 * Matthew 1 skips three kings between Jehoram and Uzziah (Ahaziah,
 * Joash, Amaziah). The lineage parent chain follows Matthew's
 * simplified genealogy: Jehoram → Uzziah (Azariah).
 *
 * Israel-king `parent` fields trace political succession (predecessor
 * on the throne), NOT biological father-son relationships. Most
 * northern dynasty changes were violent usurpations, not hereditary.
 *
 * Lineage taxonomy:
 *   messianic    — Adam → Jesus through-line (Gen 5, 11; Matt 1)
 *   cainite      — Cain and descendants (terminates at the Flood)
 *   nations      — Ham, Japheth, and early post-Flood branches
 *   ishmaelite   — Ishmael's line
 *   edomite      — Esau's line
 *   tribes       — the 11 non-Judah sons of Jacob
 *   israel-king  — kings of the northern kingdom (931–722 BC)
 */

// ─── Types ───────────────────────────────────────────────────────

export type Category =
  | "antediluvian"
  | "postdiluvian"
  | "patriarch"
  | "exodus"
  | "judge"
  | "united-king"
  | "israel-king"
  | "judah-king"
  | "prophet"
  | "exile-return"
  | "messiah";

export type Lineage =
  | "messianic"
  | "cainite"
  | "nations"
  | "ishmaelite"
  | "edomite"
  | "tribes"
  | "israel-king";

export interface TimelineFigure {
  id: string;
  name: string;
  birth: number;
  death: number;
  reignStart?: number;
  reignEnd?: number;
  category: Category;
  scriptureRef: string;
  blurb: string;
  parent?: string;
  lineage?: Lineage;
}

// ─── Data ────────────────────────────────────────────────────────

export const figures: TimelineFigure[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANTEDILUVIAN — Genesis 5 (Ussher, from 4004 BC creation)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "adam",
    name: "Adam",
    birth: -4004,
    death: -3074,
    category: "antediluvian",
    scriptureRef: "Gen 1–5",
    blurb: "First man, created in the image of God; lived 930 years.",
    lineage: "messianic",
  },
  {
    id: "seth",
    name: "Seth",
    birth: -3874,
    death: -2962,
    category: "antediluvian",
    scriptureRef: "Gen 4:25–5:8",
    blurb:
      "Son of Adam born after Abel's death; ancestor of the line leading to Noah.",
    parent: "adam",
    lineage: "messianic",
  },
  {
    id: "enosh",
    name: "Enosh",
    birth: -3769,
    death: -2864,
    category: "antediluvian",
    scriptureRef: "Gen 5:6–11",
    blurb:
      "Son of Seth; in his time people began to call on the name of the LORD.",
    parent: "seth",
    lineage: "messianic",
  },
  {
    id: "kenan",
    name: "Kenan",
    birth: -3679,
    death: -2769,
    category: "antediluvian",
    scriptureRef: "Gen 5:9–14",
    blurb: "Son of Enosh; fourth generation from Adam.",
    parent: "enosh",
    lineage: "messianic",
  },
  {
    id: "mahalalel",
    name: "Mahalalel",
    birth: -3609,
    death: -2714,
    category: "antediluvian",
    scriptureRef: "Gen 5:12–17",
    blurb: "Son of Kenan; lived 895 years.",
    parent: "kenan",
    lineage: "messianic",
  },
  {
    id: "jared",
    name: "Jared",
    birth: -3544,
    death: -2582,
    category: "antediluvian",
    scriptureRef: "Gen 5:15–20",
    blurb: "Son of Mahalalel and father of Enoch; lived 962 years.",
    parent: "mahalalel",
    lineage: "messianic",
  },
  {
    id: "enoch",
    name: "Enoch",
    birth: -3382,
    death: -3017,
    category: "antediluvian",
    scriptureRef: "Gen 5:18–24",
    blurb:
      "Walked with God and was taken up without dying; lived 365 years on earth.",
    parent: "jared",
    lineage: "messianic",
  },
  {
    id: "methuselah",
    name: "Methuselah",
    birth: -3317,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 5:21–27",
    blurb:
      "Oldest recorded person at 969 years; died the year of the flood.",
    parent: "enoch",
    lineage: "messianic",
  },
  {
    id: "lamech",
    name: "Lamech",
    birth: -3130,
    death: -2353,
    category: "antediluvian",
    scriptureRef: "Gen 5:25–31",
    blurb: "Father of Noah; died five years before the flood at age 777.",
    parent: "methuselah",
    lineage: "messianic",
  },
  {
    id: "noah",
    name: "Noah",
    birth: -2948,
    death: -1998,
    category: "antediluvian",
    scriptureRef: "Gen 5–10",
    blurb:
      "Built the ark and preserved humanity through the flood; lived 950 years.",
    parent: "lamech",
    lineage: "messianic",
  },

  // ─── Cainite branch (Gen 4) ────────────────────────────────────
  // All perish in the Flood (-2348). Dates approximate, distributed
  // between Adam's era and the Flood.
  {
    id: "cain",
    name: "Cain",
    birth: -3874,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:1–24",
    blurb:
      "Firstborn of Adam; murdered his brother Abel and was cursed to wander.",
    parent: "adam",
    lineage: "cainite",
  },
  {
    id: "abel",
    name: "Abel",
    birth: -3864,
    death: -3824,
    category: "antediluvian",
    scriptureRef: "Gen 4:2–8",
    blurb:
      "Second son of Adam; offered an acceptable sacrifice and was killed by Cain.",
    parent: "adam",
    lineage: "cainite",
  },
  {
    id: "enoch-cain",
    name: "Enoch (of Cain)",
    birth: -3800,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:17",
    blurb:
      "Son of Cain; the first city was named after him.",
    parent: "cain",
    lineage: "cainite",
  },
  {
    id: "irad",
    name: "Irad",
    birth: -3730,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:18",
    blurb: "Son of Enoch of Cain; third generation of the Cainite line.",
    parent: "enoch-cain",
    lineage: "cainite",
  },
  {
    id: "mehujael",
    name: "Mehujael",
    birth: -3660,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:18",
    blurb: "Son of Irad; fourth generation of the Cainite line.",
    parent: "irad",
    lineage: "cainite",
  },
  {
    id: "methushael",
    name: "Methushael",
    birth: -3590,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:18",
    blurb: "Son of Mehujael; fifth generation of the Cainite line.",
    parent: "mehujael",
    lineage: "cainite",
  },
  {
    id: "lamech-cain",
    name: "Lamech (of Cain)",
    birth: -3520,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:18–24",
    blurb:
      "First recorded polygamist; boasted of killing a man and claimed sevenfold vengeance.",
    parent: "methushael",
    lineage: "cainite",
  },
  {
    id: "tubal-cain",
    name: "Tubal-Cain",
    birth: -3450,
    death: -2348,
    category: "antediluvian",
    scriptureRef: "Gen 4:22",
    blurb: "Son of Lamech of Cain; forger of all instruments of bronze and iron.",
    parent: "lamech-cain",
    lineage: "cainite",
  },

  // ═══════════════════════════════════════════════════════════════
  // POSTDILUVIAN — Genesis 11 (Ussher)
  // Shem through Terah
  // ═══════════════════════════════════════════════════════════════
  {
    id: "shem",
    name: "Shem",
    birth: -2447,
    death: -1847,
    category: "postdiluvian",
    scriptureRef: "Gen 10–11",
    blurb:
      "Son of Noah; ancestor of the Semitic peoples and the messianic line.",
    parent: "noah",
    lineage: "messianic",
  },
  {
    id: "arphaxad",
    name: "Arphaxad",
    birth: -2346,
    death: -1908,
    category: "postdiluvian",
    scriptureRef: "Gen 11:10–13",
    blurb: "Born two years after the flood; grandson of Noah through Shem.",
    parent: "shem",
    lineage: "messianic",
  },
  {
    id: "shelah",
    name: "Shelah",
    birth: -2311,
    death: -1878,
    category: "postdiluvian",
    scriptureRef: "Gen 11:12–15",
    blurb: "Son of Arphaxad; part of the post-flood genealogy linking Noah to Abraham.",
    parent: "arphaxad",
    lineage: "messianic",
  },
  {
    id: "eber",
    name: "Eber",
    birth: -2281,
    death: -1817,
    category: "postdiluvian",
    scriptureRef: "Gen 11:14–17",
    blurb:
      "Ancestor from whom the term 'Hebrew' may derive; outlived several descendants.",
    parent: "shelah",
    lineage: "messianic",
  },
  {
    id: "peleg",
    name: "Peleg",
    birth: -2247,
    death: -2008,
    category: "postdiluvian",
    scriptureRef: "Gen 11:16–19",
    blurb:
      "Named 'division' because in his days the earth was divided.",
    parent: "eber",
    lineage: "messianic",
  },
  {
    id: "reu",
    name: "Reu",
    birth: -2217,
    death: -1978,
    category: "postdiluvian",
    scriptureRef: "Gen 11:18–21",
    blurb: "Son of Peleg; seventh generation from Shem.",
    parent: "peleg",
    lineage: "messianic",
  },
  {
    id: "serug",
    name: "Serug",
    birth: -2185,
    death: -1955,
    category: "postdiluvian",
    scriptureRef: "Gen 11:20–23",
    blurb: "Son of Reu and grandfather of Nahor; lived 230 years.",
    parent: "reu",
    lineage: "messianic",
  },
  {
    id: "nahor",
    name: "Nahor",
    birth: -2155,
    death: -2007,
    category: "postdiluvian",
    scriptureRef: "Gen 11:22–25",
    blurb: "Grandfather of Abraham; lived 148 years.",
    parent: "serug",
    lineage: "messianic",
  },
  {
    id: "terah",
    name: "Terah",
    birth: -2126,
    death: -1921,
    category: "postdiluvian",
    scriptureRef: "Gen 11:24–32",
    blurb:
      "Father of Abraham; migrated from Ur toward Canaan but settled in Haran.",
    parent: "nahor",
    lineage: "messianic",
  },

  // ─── Nations branch (Gen 10) ───────────────────────────────────
  {
    id: "ham",
    name: "Ham",
    birth: -2448,
    death: -1900,
    category: "postdiluvian",
    scriptureRef: "Gen 9–10",
    blurb:
      "Son of Noah; father of Canaan, Cush, Mizraim, and Put — ancestor of many ancient nations.",
    parent: "noah",
    lineage: "nations",
  },
  {
    id: "japheth",
    name: "Japheth",
    birth: -2448,
    death: -1900,
    category: "postdiluvian",
    scriptureRef: "Gen 9–10",
    blurb:
      "Son of Noah; ancestor of the Indo-European peoples who spread across the coastlands.",
    parent: "noah",
    lineage: "nations",
  },
  {
    id: "cush",
    name: "Cush",
    birth: -2340,
    death: -1800,
    category: "postdiluvian",
    scriptureRef: "Gen 10:6–12",
    blurb: "Son of Ham; father of Nimrod and ancestor of the Cushite peoples.",
    parent: "ham",
    lineage: "nations",
  },
  {
    id: "canaan-son",
    name: "Canaan",
    birth: -2330,
    death: -1800,
    category: "postdiluvian",
    scriptureRef: "Gen 9:20–27; 10:15–19",
    blurb:
      "Son of Ham; cursed by Noah — his descendants inhabited the land promised to Israel.",
    parent: "ham",
    lineage: "nations",
  },
  {
    id: "nimrod",
    name: "Nimrod",
    birth: -2300,
    death: -1750,
    category: "postdiluvian",
    scriptureRef: "Gen 10:8–12",
    blurb:
      "Mighty hunter before the LORD; founded Babel, Nineveh, and other great cities.",
    parent: "cush",
    lineage: "nations",
  },

  // ═══════════════════════════════════════════════════════════════
  // PATRIARCHS — Genesis 12–50 (Ussher)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "abraham",
    name: "Abraham",
    birth: -1996,
    death: -1821,
    category: "patriarch",
    scriptureRef: "Gen 12–25",
    blurb:
      "Father of many nations; received God's covenant promise of land, seed, and blessing.",
    parent: "terah",
    lineage: "messianic",
  },
  {
    id: "sarah",
    name: "Sarah",
    birth: -1986,
    death: -1859,
    category: "patriarch",
    scriptureRef: "Gen 12–23",
    blurb: "Wife of Abraham; bore Isaac at age 90 and lived 127 years.",
  },
  {
    id: "ishmael",
    name: "Ishmael",
    birth: -1910,
    death: -1773,
    category: "patriarch",
    scriptureRef: "Gen 16–25",
    blurb:
      "Son of Abraham and Hagar; became father of twelve princes and a great nation.",
    parent: "abraham",
    lineage: "ishmaelite",
  },
  {
    id: "isaac",
    name: "Isaac",
    birth: -1896,
    death: -1716,
    category: "patriarch",
    scriptureRef: "Gen 21–35",
    blurb:
      "Child of promise; nearly sacrificed on Mount Moriah, father of Jacob and Esau.",
    parent: "abraham",
    lineage: "messianic",
  },
  {
    id: "rebekah",
    name: "Rebekah",
    birth: -1876,
    death: -1750,
    category: "patriarch",
    scriptureRef: "Gen 24–27",
    blurb:
      "Wife of Isaac; mother of the twins Jacob and Esau.",
  },
  {
    id: "jacob",
    name: "Jacob",
    birth: -1836,
    death: -1689,
    category: "patriarch",
    scriptureRef: "Gen 25–50",
    blurb:
      "Renamed Israel; father of the twelve tribes through his twelve sons.",
    parent: "isaac",
    lineage: "messianic",
  },
  {
    id: "esau",
    name: "Esau",
    birth: -1836,
    death: -1700,
    category: "patriarch",
    scriptureRef: "Gen 25–36",
    blurb:
      "Twin brother of Jacob; sold his birthright and became father of the Edomites.",
    parent: "isaac",
    lineage: "edomite",
  },
  {
    id: "leah",
    name: "Leah",
    birth: -1773,
    death: -1710,
    category: "patriarch",
    scriptureRef: "Gen 29–35",
    blurb:
      "First wife of Jacob; mother of six sons and one daughter, buried in Machpelah.",
  },
  {
    id: "rachel",
    name: "Rachel",
    birth: -1770,
    death: -1735,
    category: "patriarch",
    scriptureRef: "Gen 29–35",
    blurb:
      "Beloved wife of Jacob; mother of Joseph and Benjamin, died in childbirth.",
  },

  // ─── Messianic: Judah (continues the through-line) ─────────────
  {
    id: "judah",
    name: "Judah",
    birth: -1795,
    death: -1650,
    category: "patriarch",
    scriptureRef: "Gen 29:35; 38; 49:8–12",
    blurb:
      "Fourth son of Jacob; ancestor of David and the royal messianic line.",
    parent: "jacob",
    lineage: "messianic",
  },

  // ─── Tribes branch (11 non-Judah sons of Jacob) ────────────────
  {
    id: "reuben",
    name: "Reuben",
    birth: -1790,
    death: -1660,
    category: "patriarch",
    scriptureRef: "Gen 29:32; 35:22; 49:3–4",
    blurb:
      "Firstborn of Jacob; lost his birthright for defiling his father's bed.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "simeon",
    name: "Simeon",
    birth: -1788,
    death: -1658,
    category: "patriarch",
    scriptureRef: "Gen 29:33; 34; 49:5–7",
    blurb:
      "Second son of Jacob; condemned with Levi for the massacre at Shechem.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "levi",
    name: "Levi",
    birth: -1786,
    death: -1649,
    category: "patriarch",
    scriptureRef: "Gen 29:34; 49:5–7; Exod 6:16",
    blurb:
      "Third son of Jacob; ancestor of the priestly tribe that served at the tabernacle and temple.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "dan",
    name: "Dan",
    birth: -1775,
    death: -1645,
    category: "patriarch",
    scriptureRef: "Gen 30:5–6; 49:16–18",
    blurb:
      "Son of Jacob and Bilhah; his tribe later settled in the far north of Israel.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "naphtali",
    name: "Naphtali",
    birth: -1773,
    death: -1643,
    category: "patriarch",
    scriptureRef: "Gen 30:7–8; 49:21",
    blurb:
      "Son of Jacob and Bilhah; his tribe settled in the Galilee region.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "gad",
    name: "Gad",
    birth: -1770,
    death: -1640,
    category: "patriarch",
    scriptureRef: "Gen 30:9–11; 49:19",
    blurb:
      "Son of Jacob and Zilpah; his tribe settled in the Transjordan.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "asher",
    name: "Asher",
    birth: -1768,
    death: -1638,
    category: "patriarch",
    scriptureRef: "Gen 30:12–13; 49:20",
    blurb:
      "Son of Jacob and Zilpah; blessed with rich food and royal delicacies.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "issachar",
    name: "Issachar",
    birth: -1755,
    death: -1625,
    category: "patriarch",
    scriptureRef: "Gen 30:17–18; 49:14–15",
    blurb:
      "Son of Jacob and Leah; his tribe was known for understanding the times.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "zebulun",
    name: "Zebulun",
    birth: -1753,
    death: -1623,
    category: "patriarch",
    scriptureRef: "Gen 30:19–20; 49:13",
    blurb:
      "Son of Jacob and Leah; his tribe settled near the coast of Sidon.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "joseph",
    name: "Joseph",
    birth: -1745,
    death: -1635,
    category: "patriarch",
    scriptureRef: "Gen 37–50",
    blurb:
      "Sold into slavery by his brothers; rose to become vizier of Egypt.",
    parent: "jacob",
    lineage: "tribes",
  },
  {
    id: "benjamin",
    name: "Benjamin",
    birth: -1735,
    death: -1605,
    category: "patriarch",
    scriptureRef: "Gen 35:16–18; 49:27",
    blurb:
      "Youngest son of Jacob and Rachel; his tribe produced Saul, Israel's first king.",
    parent: "jacob",
    lineage: "tribes",
  },

  // ─── Ishmaelite branch ─────────────────────────────────────────
  {
    id: "nebaioth",
    name: "Nebaioth",
    birth: -1870,
    death: -1750,
    category: "patriarch",
    scriptureRef: "Gen 25:13; 28:9; Isa 60:7",
    blurb:
      "Firstborn of Ishmael; ancestor of an Arabian tribe associated with flocks and herds.",
    parent: "ishmael",
    lineage: "ishmaelite",
  },
  {
    id: "kedar",
    name: "Kedar",
    birth: -1865,
    death: -1745,
    category: "patriarch",
    scriptureRef: "Gen 25:13; Isa 21:16–17; Ps 120:5",
    blurb:
      "Second son of Ishmael; his descendants were skilled archers and tent-dwellers in the Arabian desert.",
    parent: "ishmael",
    lineage: "ishmaelite",
  },

  // ─── Edomite branch ────────────────────────────────────────────
  {
    id: "eliphaz",
    name: "Eliphaz",
    birth: -1790,
    death: -1670,
    category: "patriarch",
    scriptureRef: "Gen 36:4, 10–12",
    blurb:
      "Firstborn of Esau; father of Teman and Amalek, progenitor of Edomite clans.",
    parent: "esau",
    lineage: "edomite",
  },
  {
    id: "amalek",
    name: "Amalek",
    birth: -1760,
    death: -1640,
    category: "patriarch",
    scriptureRef: "Gen 36:12; Exod 17:8–16",
    blurb:
      "Grandson of Esau through Eliphaz; ancestor of Israel's persistent enemy, the Amalekites.",
    parent: "eliphaz",
    lineage: "edomite",
  },

  // ─── Messianic: Perez through Jesse ────────────────────────────
  {
    id: "perez",
    name: "Perez",
    birth: -1727,
    death: -1600,
    category: "patriarch",
    scriptureRef: "Gen 38:27–30; Ruth 4:18",
    blurb:
      "Son of Judah and Tamar; ancestor of David through the line recorded in Ruth 4.",
    parent: "judah",
    lineage: "messianic",
  },
  {
    id: "hezron",
    name: "Hezron",
    birth: -1700,
    death: -1570,
    category: "patriarch",
    scriptureRef: "Gen 46:12; Ruth 4:18; 1 Chr 2:5",
    blurb:
      "Son of Perez; entered Egypt with Jacob's household.",
    parent: "perez",
    lineage: "messianic",
  },
  {
    id: "ram",
    name: "Ram",
    birth: -1670,
    death: -1540,
    category: "patriarch",
    scriptureRef: "Ruth 4:19; 1 Chr 2:9–10",
    blurb:
      "Son of Hezron; messianic ancestor between the patriarchal and exodus periods.",
    parent: "hezron",
    lineage: "messianic",
  },
  {
    id: "amminadab",
    name: "Amminadab",
    birth: -1640,
    death: -1510,
    category: "patriarch",
    scriptureRef: "Ruth 4:19–20; 1 Chr 2:10",
    blurb:
      "Son of Ram; his daughter married Aaron the high priest.",
    parent: "ram",
    lineage: "messianic",
  },
  {
    id: "nahshon",
    name: "Nahshon",
    birth: -1610,
    death: -1480,
    category: "exodus",
    scriptureRef: "Num 1:7; 2:3; Ruth 4:20",
    blurb:
      "Leader of the tribe of Judah during the wilderness wanderings; brother-in-law of Aaron.",
    parent: "amminadab",
    lineage: "messianic",
  },
  {
    id: "salmon",
    name: "Salmon",
    birth: -1580,
    death: -1450,
    category: "exodus",
    scriptureRef: "Ruth 4:20–21; Matt 1:5",
    blurb:
      "Son of Nahshon; married Rahab of Jericho according to Matthew's genealogy.",
    parent: "nahshon",
    lineage: "messianic",
  },
  {
    id: "boaz",
    name: "Boaz",
    birth: -1350,
    death: -1230,
    category: "judge",
    scriptureRef: "Ruth 2–4",
    blurb:
      "Kinsman-redeemer of Ruth; a man of standing in Bethlehem during the period of the judges.",
    parent: "salmon",
    lineage: "messianic",
  },
  {
    id: "obed",
    name: "Obed",
    birth: -1310,
    death: -1190,
    category: "judge",
    scriptureRef: "Ruth 4:13–17; 1 Chr 2:12",
    blurb:
      "Son of Boaz and Ruth; grandfather of David.",
    parent: "boaz",
    lineage: "messianic",
  },
  {
    id: "jesse",
    name: "Jesse",
    birth: -1080,
    death: -1000,
    category: "judge",
    scriptureRef: "1 Sam 16–17; Ruth 4:17, 22",
    blurb:
      "Father of David; a Bethlehemite whose youngest son was anointed king by Samuel.",
    parent: "obed",
    lineage: "messianic",
  },

  // ═══════════════════════════════════════════════════════════════
  // EXODUS — Exodus through Joshua (Ussher)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "miriam",
    name: "Miriam",
    birth: -1577,
    death: -1452,
    category: "exodus",
    scriptureRef: "Exod 2; 15; Num 12; 20",
    blurb:
      "Sister of Moses and Aaron; prophetess who led Israel in worship after the Red Sea crossing.",
  },
  {
    id: "aaron",
    name: "Aaron",
    birth: -1574,
    death: -1452,
    category: "exodus",
    scriptureRef: "Exod 4–Num 20",
    blurb:
      "Brother of Moses; first high priest of Israel, died on Mount Hor at age 123.",
  },
  {
    id: "moses",
    name: "Moses",
    birth: -1571,
    death: -1451,
    category: "exodus",
    scriptureRef: "Exod 2–Deut 34",
    blurb:
      "Led Israel out of Egypt; received the Law at Sinai and guided the people for 40 years.",
  },
  {
    id: "joshua",
    name: "Joshua",
    birth: -1531,
    death: -1421,
    category: "exodus",
    scriptureRef: "Josh 1–24",
    blurb:
      "Successor of Moses; led Israel across the Jordan and conquered the Promised Land.",
  },
  {
    id: "caleb",
    name: "Caleb",
    birth: -1529,
    death: -1420,
    category: "exodus",
    scriptureRef: "Num 13–14; Josh 14–15",
    blurb:
      "One of two faithful spies; at 85 claimed the hill country of Hebron as his inheritance.",
  },

  // ═══════════════════════════════════════════════════════════════
  // JUDGES — Judges & 1 Samuel (approximate, Ussher framework)
  // Dates are approximate; judgeships were often regional and
  // overlapping. Birth/death estimated from active periods.
  // ═══════════════════════════════════════════════════════════════
  {
    id: "othniel",
    name: "Othniel",
    birth: -1400,
    death: -1350,
    category: "judge",
    scriptureRef: "Judg 3:7–11",
    blurb:
      "First judge of Israel; delivered the people from Cushan-rishathaim of Mesopotamia.",
  },
  {
    id: "ehud",
    name: "Ehud",
    birth: -1350,
    death: -1250,
    category: "judge",
    scriptureRef: "Judg 3:12–30",
    blurb:
      "Left-handed Benjamite who assassinated King Eglon of Moab and won 80 years of peace.",
  },
  {
    id: "deborah",
    name: "Deborah",
    birth: -1260,
    death: -1200,
    category: "judge",
    scriptureRef: "Judg 4–5",
    blurb:
      "Prophetess and judge who led Israel to victory over Sisera's Canaanite army.",
  },
  {
    id: "gideon",
    name: "Gideon",
    birth: -1210,
    death: -1150,
    category: "judge",
    scriptureRef: "Judg 6–8",
    blurb:
      "Defeated the Midianites with 300 men using trumpets, torches, and jars.",
  },
  {
    id: "jephthah",
    name: "Jephthah",
    birth: -1130,
    death: -1078,
    category: "judge",
    scriptureRef: "Judg 11–12",
    blurb:
      "Gileadite outcast who defeated the Ammonites; known for his tragic vow.",
  },
  {
    id: "samson",
    name: "Samson",
    birth: -1105,
    death: -1065,
    category: "judge",
    scriptureRef: "Judg 13–16",
    blurb:
      "Nazirite with supernatural strength; judged Israel 20 years during Philistine oppression.",
  },
  {
    id: "eli",
    name: "Eli",
    birth: -1158,
    death: -1060,
    category: "judge",
    scriptureRef: "1 Sam 1–4",
    blurb:
      "High priest and judge at Shiloh for 40 years; died upon hearing the ark was captured.",
  },
  {
    id: "samuel",
    name: "Samuel",
    birth: -1105,
    death: -1020,
    category: "judge",
    scriptureRef: "1 Sam 1–25",
    blurb:
      "Last judge and kingmaker prophet; anointed both Saul and David as king.",
  },

  // ═══════════════════════════════════════════════════════════════
  // UNITED MONARCHY — 1 & 2 Samuel, 1 Kings 1–11
  // Transitional: traditional 40-year reigns anchored to Thiele's
  // 930 BC for the start of the divided kingdom.
  // ═══════════════════════════════════════════════════════════════
  {
    id: "king-saul",
    name: "Saul",
    birth: -1080,
    death: -1010,
    reignStart: -1050,
    reignEnd: -1010,
    category: "united-king",
    scriptureRef: "1 Sam 9–31",
    blurb:
      "First king of Israel; began well but was rejected by God for disobedience.",
  },
  {
    id: "king-david",
    name: "David",
    birth: -1040,
    death: -970,
    reignStart: -1010,
    reignEnd: -970,
    category: "united-king",
    scriptureRef: "1 Sam 16–1 Kgs 2",
    blurb:
      "Shepherd, warrior, and poet-king; united Israel and received the messianic covenant.",
    parent: "jesse",
    lineage: "messianic",
  },
  {
    id: "king-solomon",
    name: "Solomon",
    birth: -990,
    death: -930,
    reignStart: -970,
    reignEnd: -930,
    category: "united-king",
    scriptureRef: "1 Kgs 1–11",
    blurb:
      "Wisest king; built the First Temple but turned to idolatry in his later years.",
    parent: "king-david",
    lineage: "messianic",
  },

  // ═══════════════════════════════════════════════════════════════
  // KINGS OF ISRAEL — 1 Kings 12 – 2 Kings 17 (Thiele)
  // 19 kings. Birth = reignStart, death = reignEnd where unknown.
  // Parent = political predecessor (not biological father).
  // ═══════════════════════════════════════════════════════════════
  {
    id: "jeroboam-i",
    name: "Jeroboam I",
    birth: -930,
    death: -909,
    reignStart: -930,
    reignEnd: -909,
    category: "israel-king",
    scriptureRef: "1 Kgs 11:26–14:20",
    blurb:
      "First king of the northern kingdom; set up golden calves at Dan and Bethel.",
    parent: "king-solomon",
    lineage: "israel-king",
  },
  {
    id: "nadab-israel",
    name: "Nadab",
    birth: -909,
    death: -908,
    reignStart: -909,
    reignEnd: -908,
    category: "israel-king",
    scriptureRef: "1 Kgs 15:25–32",
    blurb: "Son of Jeroboam I; assassinated by Baasha after reigning two years.",
    parent: "jeroboam-i",
    lineage: "israel-king",
  },
  {
    id: "baasha",
    name: "Baasha",
    birth: -908,
    death: -886,
    reignStart: -908,
    reignEnd: -886,
    category: "israel-king",
    scriptureRef: "1 Kgs 15:33–16:7",
    blurb:
      "Seized the throne by killing Nadab; continued in the sins of Jeroboam.",
    parent: "nadab-israel",
    lineage: "israel-king",
  },
  {
    id: "elah-israel",
    name: "Elah",
    birth: -886,
    death: -885,
    reignStart: -886,
    reignEnd: -885,
    category: "israel-king",
    scriptureRef: "1 Kgs 16:8–14",
    blurb: "Son of Baasha; killed while drunk by his servant Zimri.",
    parent: "baasha",
    lineage: "israel-king",
  },
  {
    id: "zimri",
    name: "Zimri",
    birth: -885,
    death: -885,
    reignStart: -885,
    reignEnd: -885,
    category: "israel-king",
    scriptureRef: "1 Kgs 16:9–20",
    blurb:
      "Reigned only seven days; set the palace on fire around himself when Omri besieged Tirzah.",
    parent: "elah-israel",
    lineage: "israel-king",
  },
  {
    id: "omri",
    name: "Omri",
    birth: -885,
    death: -874,
    reignStart: -885,
    reignEnd: -874,
    category: "israel-king",
    scriptureRef: "1 Kgs 16:15–28",
    blurb:
      "Military commander who became king; built Samaria as the new capital.",
    parent: "zimri",
    lineage: "israel-king",
  },
  {
    id: "ahab",
    name: "Ahab",
    birth: -874,
    death: -853,
    reignStart: -874,
    reignEnd: -853,
    category: "israel-king",
    scriptureRef: "1 Kgs 16:29–22:40",
    blurb:
      "Married Jezebel and promoted Baal worship; opposed by Elijah on Mount Carmel.",
    parent: "omri",
    lineage: "israel-king",
  },
  {
    id: "ahaziah-israel",
    name: "Ahaziah",
    birth: -853,
    death: -852,
    reignStart: -853,
    reignEnd: -852,
    category: "israel-king",
    scriptureRef: "1 Kgs 22:51–2 Kgs 1:18",
    blurb:
      "Son of Ahab; fell through a lattice and died after consulting Baal-zebub.",
    parent: "ahab",
    lineage: "israel-king",
  },
  {
    id: "joram-israel",
    name: "Joram",
    birth: -852,
    death: -841,
    reignStart: -852,
    reignEnd: -841,
    category: "israel-king",
    scriptureRef: "2 Kgs 3–8",
    blurb:
      "Son of Ahab; killed by Jehu's arrow in Naboth's vineyard.",
    parent: "ahaziah-israel",
    lineage: "israel-king",
  },
  {
    id: "jehu",
    name: "Jehu",
    birth: -841,
    death: -814,
    reignStart: -841,
    reignEnd: -814,
    category: "israel-king",
    scriptureRef: "2 Kgs 9–10",
    blurb:
      "Anointed by Elisha's servant; purged Baal worship and destroyed the house of Ahab.",
    parent: "joram-israel",
    lineage: "israel-king",
  },
  {
    id: "jehoahaz-israel",
    name: "Jehoahaz",
    birth: -814,
    death: -798,
    reignStart: -814,
    reignEnd: -798,
    category: "israel-king",
    scriptureRef: "2 Kgs 13:1–9",
    blurb:
      "Son of Jehu; Israel was greatly weakened by Aram during his reign.",
    parent: "jehu",
    lineage: "israel-king",
  },
  {
    id: "joash-israel",
    name: "Jehoash",
    birth: -798,
    death: -782,
    reignStart: -798,
    reignEnd: -782,
    category: "israel-king",
    scriptureRef: "2 Kgs 13:10–25",
    blurb:
      "Visited the dying Elisha; defeated Aram three times and recaptured Israelite cities.",
    parent: "jehoahaz-israel",
    lineage: "israel-king",
  },
  {
    id: "jeroboam-ii",
    name: "Jeroboam II",
    birth: -793,
    death: -753,
    reignStart: -793,
    reignEnd: -753,
    category: "israel-king",
    scriptureRef: "2 Kgs 14:23–29",
    blurb:
      "Restored Israel's borders to their greatest extent; reigned during Amos and Hosea's ministry.",
    parent: "joash-israel",
    lineage: "israel-king",
  },
  {
    id: "zechariah-israel",
    name: "Zechariah",
    birth: -753,
    death: -752,
    reignStart: -753,
    reignEnd: -752,
    category: "israel-king",
    scriptureRef: "2 Kgs 15:8–12",
    blurb:
      "Last king of Jehu's dynasty; assassinated by Shallum after six months.",
    parent: "jeroboam-ii",
    lineage: "israel-king",
  },
  {
    id: "shallum",
    name: "Shallum",
    birth: -752,
    death: -752,
    reignStart: -752,
    reignEnd: -752,
    category: "israel-king",
    scriptureRef: "2 Kgs 15:13–16",
    blurb: "Usurper who reigned only one month before Menahem killed him.",
    parent: "zechariah-israel",
    lineage: "israel-king",
  },
  {
    id: "menahem",
    name: "Menahem",
    birth: -752,
    death: -742,
    reignStart: -752,
    reignEnd: -742,
    category: "israel-king",
    scriptureRef: "2 Kgs 15:14–22",
    blurb:
      "Brutal usurper; paid tribute to Assyria to secure his throne.",
    parent: "shallum",
    lineage: "israel-king",
  },
  {
    id: "pekahiah",
    name: "Pekahiah",
    birth: -742,
    death: -740,
    reignStart: -742,
    reignEnd: -740,
    category: "israel-king",
    scriptureRef: "2 Kgs 15:23–26",
    blurb: "Son of Menahem; assassinated by his officer Pekah after two years.",
    parent: "menahem",
    lineage: "israel-king",
  },
  {
    id: "pekah",
    name: "Pekah",
    birth: -752,
    death: -732,
    reignStart: -752,
    reignEnd: -732,
    category: "israel-king",
    scriptureRef: "2 Kgs 15:27–31",
    blurb:
      "Rival king in Gilead from 752; allied with Aram against Judah in the Syro-Ephraimite War.",
    parent: "pekahiah",
    lineage: "israel-king",
  },
  {
    id: "hoshea",
    name: "Hoshea",
    birth: -732,
    death: -722,
    reignStart: -732,
    reignEnd: -722,
    category: "israel-king",
    scriptureRef: "2 Kgs 17:1–6",
    blurb:
      "Last king of Israel; Samaria fell to Assyria and the northern kingdom ended.",
    parent: "pekah",
    lineage: "israel-king",
  },

  // ═══════════════════════════════════════════════════════════════
  // KINGS OF JUDAH — 1 Kings 12 – 2 Kings 25 (Thiele)
  // 20 rulers (including Athaliah). Birth = reignStart,
  // death = reignEnd where unknown.
  // ═══════════════════════════════════════════════════════════════
  {
    id: "rehoboam",
    name: "Rehoboam",
    birth: -930,
    death: -913,
    reignStart: -930,
    reignEnd: -913,
    category: "judah-king",
    scriptureRef: "1 Kgs 12–14",
    blurb:
      "Son of Solomon whose harshness caused the kingdom to split in two.",
    parent: "king-solomon",
    lineage: "messianic",
  },
  {
    id: "abijah-judah",
    name: "Abijah",
    birth: -913,
    death: -910,
    reignStart: -913,
    reignEnd: -910,
    category: "judah-king",
    scriptureRef: "1 Kgs 15:1–8; 2 Chr 13",
    blurb:
      "Defeated Jeroboam I in battle despite being outnumbered two to one.",
    parent: "rehoboam",
    lineage: "messianic",
  },
  {
    id: "asa",
    name: "Asa",
    birth: -910,
    death: -869,
    reignStart: -910,
    reignEnd: -869,
    category: "judah-king",
    scriptureRef: "1 Kgs 15:9–24; 2 Chr 14–16",
    blurb:
      "Faithful reformer who removed idols; relied on Aram rather than God in his later years.",
    parent: "abijah-judah",
    lineage: "messianic",
  },
  {
    id: "jehoshaphat",
    name: "Jehoshaphat",
    birth: -872,
    death: -848,
    reignStart: -872,
    reignEnd: -848,
    category: "judah-king",
    scriptureRef: "1 Kgs 22; 2 Chr 17–20",
    blurb:
      "Godly king who sent teachers throughout Judah; unwisely allied with Ahab's house.",
    parent: "asa",
    lineage: "messianic",
  },
  {
    id: "jehoram-judah",
    name: "Jehoram",
    birth: -848,
    death: -841,
    reignStart: -848,
    reignEnd: -841,
    category: "judah-king",
    scriptureRef: "2 Kgs 8:16–24; 2 Chr 21",
    blurb:
      "Married Ahab's daughter Athaliah; killed his brothers and led Judah into idolatry.",
    parent: "jehoshaphat",
    lineage: "messianic",
  },
  {
    id: "ahaziah-judah",
    name: "Ahaziah",
    birth: -841,
    death: -841,
    reignStart: -841,
    reignEnd: -841,
    category: "judah-king",
    scriptureRef: "2 Kgs 8:25–29; 9:27–29",
    blurb:
      "Reigned less than a year; killed by Jehu along with his uncle Joram of Israel.",
  },
  {
    id: "athaliah",
    name: "Athaliah",
    birth: -841,
    death: -835,
    reignStart: -841,
    reignEnd: -835,
    category: "judah-king",
    scriptureRef: "2 Kgs 11; 2 Chr 22:10–23:21",
    blurb:
      "Only queen regnant of Judah; seized the throne by massacring the royal family.",
  },
  {
    id: "joash-judah",
    name: "Joash",
    birth: -835,
    death: -796,
    reignStart: -835,
    reignEnd: -796,
    category: "judah-king",
    scriptureRef: "2 Kgs 12; 2 Chr 24",
    blurb:
      "Hidden as an infant from Athaliah; repaired the Temple but later turned to idolatry.",
  },
  {
    id: "amaziah",
    name: "Amaziah",
    birth: -796,
    death: -767,
    reignStart: -796,
    reignEnd: -767,
    category: "judah-king",
    scriptureRef: "2 Kgs 14:1–22; 2 Chr 25",
    blurb:
      "Defeated Edom but foolishly challenged Israel and was humiliated by Jehoash.",
  },
  {
    id: "azariah",
    name: "Azariah (Uzziah)",
    birth: -792,
    death: -740,
    reignStart: -792,
    reignEnd: -740,
    category: "judah-king",
    scriptureRef: "2 Kgs 15:1–7; 2 Chr 26",
    blurb:
      "Powerful king who built up Judah's military; struck with leprosy for usurping priestly duties.",
    parent: "jehoram-judah",
    lineage: "messianic",
  },
  {
    id: "jotham",
    name: "Jotham",
    birth: -750,
    death: -735,
    reignStart: -750,
    reignEnd: -735,
    category: "judah-king",
    scriptureRef: "2 Kgs 15:32–38; 2 Chr 27",
    blurb:
      "Did what was right before the LORD; built the upper gate of the Temple.",
    parent: "azariah",
    lineage: "messianic",
  },
  {
    id: "ahaz",
    name: "Ahaz",
    birth: -735,
    death: -715,
    reignStart: -735,
    reignEnd: -715,
    category: "judah-king",
    scriptureRef: "2 Kgs 16; 2 Chr 28",
    blurb:
      "Wicked king who sacrificed his son; appealed to Assyria against Aram and Israel.",
    parent: "jotham",
    lineage: "messianic",
  },
  {
    id: "hezekiah",
    name: "Hezekiah",
    birth: -715,
    death: -686,
    reignStart: -715,
    reignEnd: -686,
    category: "judah-king",
    scriptureRef: "2 Kgs 18–20; 2 Chr 29–32",
    blurb:
      "Great reformer who trusted God when Sennacherib besieged Jerusalem; granted 15 extra years.",
    parent: "ahaz",
    lineage: "messianic",
  },
  {
    id: "manasseh",
    name: "Manasseh",
    birth: -697,
    death: -642,
    reignStart: -697,
    reignEnd: -642,
    category: "judah-king",
    scriptureRef: "2 Kgs 21:1–18; 2 Chr 33:1–20",
    blurb:
      "Longest-reigning king at 55 years; deeply wicked but repented late in life.",
    parent: "hezekiah",
    lineage: "messianic",
  },
  {
    id: "amon",
    name: "Amon",
    birth: -642,
    death: -640,
    reignStart: -642,
    reignEnd: -640,
    category: "judah-king",
    scriptureRef: "2 Kgs 21:19–26; 2 Chr 33:21–25",
    blurb: "Reverted to his father's early idolatry; assassinated by his own servants.",
    parent: "manasseh",
    lineage: "messianic",
  },
  {
    id: "josiah",
    name: "Josiah",
    birth: -640,
    death: -609,
    reignStart: -640,
    reignEnd: -609,
    category: "judah-king",
    scriptureRef: "2 Kgs 22–23; 2 Chr 34–35",
    blurb:
      "Last great reformer; rediscovered the Book of the Law and renewed the covenant.",
    parent: "amon",
    lineage: "messianic",
  },
  {
    id: "jehoahaz-judah",
    name: "Jehoahaz",
    birth: -609,
    death: -609,
    reignStart: -609,
    reignEnd: -609,
    category: "judah-king",
    scriptureRef: "2 Kgs 23:31–34",
    blurb: "Reigned only three months before Pharaoh Necho deposed and exiled him to Egypt.",
  },
  {
    id: "jehoiakim",
    name: "Jehoiakim",
    birth: -609,
    death: -598,
    reignStart: -609,
    reignEnd: -598,
    category: "judah-king",
    scriptureRef: "2 Kgs 23:34–24:7; Jer 36",
    blurb:
      "Installed by Egypt; infamously burned Jeremiah's scroll column by column.",
  },
  {
    id: "jehoiachin",
    name: "Jehoiachin (Jeconiah)",
    birth: -598,
    death: -597,
    reignStart: -598,
    reignEnd: -597,
    category: "judah-king",
    scriptureRef: "2 Kgs 24:8–17; 25:27–30; Matt 1:11–12",
    blurb:
      "Surrendered to Nebuchadnezzar after three months; later released from Babylonian prison.",
    parent: "josiah",
    lineage: "messianic",
  },
  {
    id: "zedekiah",
    name: "Zedekiah",
    birth: -597,
    death: -586,
    reignStart: -597,
    reignEnd: -586,
    category: "judah-king",
    scriptureRef: "2 Kgs 24:18–25:7; Jer 37–39",
    blurb:
      "Last king of Judah; rebelled against Babylon, was blinded and taken captive.",
  },

  // ═══════════════════════════════════════════════════════════════
  // PROPHETS (approximate dates from active ministry periods)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "joel",
    name: "Joel",
    birth: -850,
    death: -800,
    category: "prophet",
    scriptureRef: "Joel 1–3",
    blurb:
      "Prophesied a locust plague as divine judgment and the future outpouring of the Spirit.",
  },
  {
    id: "elijah",
    name: "Elijah",
    birth: -900,
    death: -848,
    category: "prophet",
    scriptureRef: "1 Kgs 17–2 Kgs 2",
    blurb:
      "Confronted Ahab and the prophets of Baal on Carmel; taken to heaven in a chariot of fire.",
  },
  {
    id: "elisha",
    name: "Elisha",
    birth: -870,
    death: -800,
    category: "prophet",
    scriptureRef: "1 Kgs 19; 2 Kgs 2–13",
    blurb:
      "Received Elijah's mantle with a double portion of his spirit; performed many miracles.",
  },
  {
    id: "jonah",
    name: "Jonah",
    birth: -800,
    death: -750,
    category: "prophet",
    scriptureRef: "2 Kgs 14:25; Jonah 1–4",
    blurb:
      "Reluctantly preached to Nineveh after being swallowed by a great fish.",
  },
  {
    id: "amos",
    name: "Amos",
    birth: -780,
    death: -740,
    category: "prophet",
    scriptureRef: "Amos 1–9",
    blurb:
      "Shepherd from Tekoa who denounced social injustice and empty ritual in Israel.",
  },
  {
    id: "hosea",
    name: "Hosea",
    birth: -780,
    death: -720,
    category: "prophet",
    scriptureRef: "Hos 1–14",
    blurb:
      "Married unfaithful Gomer as a living parable of God's steadfast love for wayward Israel.",
  },
  {
    id: "isaiah",
    name: "Isaiah",
    birth: -760,
    death: -680,
    category: "prophet",
    scriptureRef: "Isa 1–66; 2 Kgs 19–20",
    blurb:
      "Prince of prophets who foretold the Suffering Servant and the coming Messiah.",
  },
  {
    id: "micah",
    name: "Micah",
    birth: -755,
    death: -700,
    category: "prophet",
    scriptureRef: "Mic 1–7",
    blurb:
      "Contemporary of Isaiah; prophesied that the Messiah would be born in Bethlehem.",
  },
  {
    id: "nahum",
    name: "Nahum",
    birth: -660,
    death: -620,
    category: "prophet",
    scriptureRef: "Nah 1–3",
    blurb:
      "Foretold the destruction of Nineveh, which fell to Babylon in 612 BC.",
  },
  {
    id: "zephaniah",
    name: "Zephaniah",
    birth: -650,
    death: -610,
    category: "prophet",
    scriptureRef: "Zeph 1–3",
    blurb:
      "Prophesied during Josiah's reign, warning of the coming Day of the LORD.",
  },
  {
    id: "habakkuk",
    name: "Habakkuk",
    birth: -640,
    death: -600,
    category: "prophet",
    scriptureRef: "Hab 1–3",
    blurb:
      "Questioned God's justice, then affirmed that the righteous shall live by faith.",
  },
  {
    id: "jeremiah",
    name: "Jeremiah",
    birth: -650,
    death: -580,
    category: "prophet",
    scriptureRef: "Jer 1–52; Lam 1–5",
    blurb:
      "Weeping prophet who warned Judah for 40 years and foretold the new covenant.",
  },
  {
    id: "obadiah",
    name: "Obadiah",
    birth: -610,
    death: -570,
    category: "prophet",
    scriptureRef: "Obad 1",
    blurb:
      "Shortest Old Testament book; pronounced judgment on Edom for betraying Judah.",
  },

  // ═══════════════════════════════════════════════════════════════
  // EXILE & RETURN (approximate)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "ezekiel",
    name: "Ezekiel",
    birth: -623,
    death: -570,
    category: "exile-return",
    scriptureRef: "Ezek 1–48",
    blurb:
      "Priest and prophet among the Babylonian exiles; saw visions of God's glory and the restored Temple.",
  },
  {
    id: "daniel",
    name: "Daniel",
    birth: -622,
    death: -536,
    category: "exile-return",
    scriptureRef: "Dan 1–12",
    blurb:
      "Statesman and prophet in Babylon and Persia; survived the lions' den and received apocalyptic visions.",
  },

  // ─── Messianic: Shealtiel → Zerubbabel ─────────────────────────
  {
    id: "shealtiel",
    name: "Shealtiel",
    birth: -595,
    death: -540,
    category: "exile-return",
    scriptureRef: "1 Chr 3:17; Matt 1:12; Luke 3:27",
    blurb:
      "Son of Jeconiah; father of Zerubbabel who led the return from exile.",
    parent: "jehoiachin",
    lineage: "messianic",
  },
  {
    id: "zerubbabel",
    name: "Zerubbabel",
    birth: -560,
    death: -510,
    category: "exile-return",
    scriptureRef: "Ezra 1–6; Hag 1–2; Zech 4",
    blurb:
      "Davidic descendant who led the first return from exile and rebuilt the Temple foundation.",
    parent: "shealtiel",
    lineage: "messianic",
  },
  {
    id: "esther",
    name: "Esther",
    birth: -500,
    death: -460,
    category: "exile-return",
    scriptureRef: "Esth 1–10",
    blurb:
      "Jewish queen of Persia who risked her life to save her people from Haman's genocide.",
  },

  // ─── Messianic: Matt 1:13–15 (intertestamental, approximate) ──
  {
    id: "abiud",
    name: "Abiud",
    birth: -530,
    death: -480,
    category: "exile-return",
    scriptureRef: "Matt 1:13",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "zerubbabel",
    lineage: "messianic",
  },
  {
    id: "eliakim-lineage",
    name: "Eliakim",
    birth: -500,
    death: -450,
    category: "exile-return",
    scriptureRef: "Matt 1:13",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "abiud",
    lineage: "messianic",
  },
  {
    id: "azor",
    name: "Azor",
    birth: -470,
    death: -420,
    category: "exile-return",
    scriptureRef: "Matt 1:13–14",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "eliakim-lineage",
    lineage: "messianic",
  },
  {
    id: "zadok-lineage",
    name: "Zadok",
    birth: -440,
    death: -390,
    category: "exile-return",
    scriptureRef: "Matt 1:14",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "azor",
    lineage: "messianic",
  },
  {
    id: "achim",
    name: "Achim",
    birth: -410,
    death: -360,
    category: "exile-return",
    scriptureRef: "Matt 1:14",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "zadok-lineage",
    lineage: "messianic",
  },
  {
    id: "eliud",
    name: "Eliud",
    birth: -380,
    death: -330,
    category: "exile-return",
    scriptureRef: "Matt 1:14–15",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "achim",
    lineage: "messianic",
  },
  {
    id: "eleazar-lineage",
    name: "Eleazar",
    birth: -350,
    death: -300,
    category: "exile-return",
    scriptureRef: "Matt 1:15",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "eliud",
    lineage: "messianic",
  },
  {
    id: "matthan",
    name: "Matthan",
    birth: -300,
    death: -250,
    category: "exile-return",
    scriptureRef: "Matt 1:15",
    blurb:
      "Post-exilic messianic ancestor; little is known beyond the genealogy.",
    parent: "eleazar-lineage",
    lineage: "messianic",
  },
  {
    id: "jacob-of-joseph",
    name: "Jacob",
    birth: -120,
    death: -50,
    category: "exile-return",
    scriptureRef: "Matt 1:15–16",
    blurb:
      "Father of Joseph, husband of Mary; last link before the Messiah in Matthew's genealogy.",
    parent: "matthan",
    lineage: "messianic",
  },

  {
    id: "ezra",
    name: "Ezra",
    birth: -480,
    death: -420,
    category: "exile-return",
    scriptureRef: "Ezra 7–10; Neh 8",
    blurb:
      "Priest and scribe who led the second return and restored the teaching of the Torah.",
  },
  {
    id: "nehemiah",
    name: "Nehemiah",
    birth: -475,
    death: -415,
    category: "exile-return",
    scriptureRef: "Neh 1–13",
    blurb:
      "Cupbearer to the Persian king who rebuilt Jerusalem's walls in 52 days.",
  },
  {
    id: "haggai",
    name: "Haggai",
    birth: -560,
    death: -500,
    category: "exile-return",
    scriptureRef: "Hag 1–2",
    blurb:
      "Post-exilic prophet who urged the returned exiles to finish rebuilding the Temple.",
  },
  {
    id: "zechariah-prophet",
    name: "Zechariah",
    birth: -555,
    death: -480,
    category: "exile-return",
    scriptureRef: "Zech 1–14",
    blurb:
      "Contemporary of Haggai; saw messianic visions of the Branch, the pierced one, and the coming King.",
  },
  {
    id: "malachi",
    name: "Malachi",
    birth: -460,
    death: -400,
    category: "exile-return",
    scriptureRef: "Mal 1–4",
    blurb:
      "Last Old Testament prophet; rebuked faithlessness and foretold the messenger who would precede the Messiah.",
  },

  // ═══════════════════════════════════════════════════════════════
  // MESSIAH — Gospels
  // ═══════════════════════════════════════════════════════════════
  {
    id: "joseph-husband",
    name: "Joseph",
    birth: -45,
    death: 18,
    category: "messiah",
    scriptureRef: "Matt 1–2; Luke 1–2",
    blurb:
      "Husband of Mary and legal father of Jesus; a righteous man of David's line.",
    parent: "jacob-of-joseph",
    lineage: "messianic",
  },
  {
    id: "mary",
    name: "Mary",
    birth: -20,
    death: 40,
    category: "messiah",
    scriptureRef: "Luke 1–2; John 2; 19:25–27; Acts 1:14",
    blurb:
      "Mother of Jesus; chosen by God to bear the Messiah, present from the manger to the cross.",
  },
  {
    id: "john-the-baptist",
    name: "John the Baptist",
    birth: -5,
    death: 29,
    category: "messiah",
    scriptureRef: "Luke 1; Matt 3; 14:1–12",
    blurb:
      "Forerunner of the Messiah; baptized Jesus in the Jordan and was beheaded by Herod Antipas.",
  },
  {
    id: "jesus",
    name: "Jesus",
    birth: -4,
    death: 33,
    category: "messiah",
    scriptureRef: "Matt–John",
    blurb:
      "The promised Messiah; crucified under Pontius Pilate and risen on the third day.",
    parent: "joseph-husband",
    lineage: "messianic",
  },
];
