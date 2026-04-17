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
  },
  {
    id: "kenan",
    name: "Kenan",
    birth: -3679,
    death: -2769,
    category: "antediluvian",
    scriptureRef: "Gen 5:9–14",
    blurb: "Son of Enosh; fourth generation from Adam.",
  },
  {
    id: "mahalalel",
    name: "Mahalalel",
    birth: -3609,
    death: -2714,
    category: "antediluvian",
    scriptureRef: "Gen 5:12–17",
    blurb: "Son of Kenan; lived 895 years.",
  },
  {
    id: "jared",
    name: "Jared",
    birth: -3544,
    death: -2582,
    category: "antediluvian",
    scriptureRef: "Gen 5:15–20",
    blurb: "Son of Mahalalel and father of Enoch; lived 962 years.",
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
  },
  {
    id: "lamech",
    name: "Lamech",
    birth: -3130,
    death: -2353,
    category: "antediluvian",
    scriptureRef: "Gen 5:25–31",
    blurb: "Father of Noah; died five years before the flood at age 777.",
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
  },
  {
    id: "arphaxad",
    name: "Arphaxad",
    birth: -2346,
    death: -1908,
    category: "postdiluvian",
    scriptureRef: "Gen 11:10–13",
    blurb: "Born two years after the flood; grandson of Noah through Shem.",
  },
  {
    id: "shelah",
    name: "Shelah",
    birth: -2311,
    death: -1878,
    category: "postdiluvian",
    scriptureRef: "Gen 11:12–15",
    blurb: "Son of Arphaxad; part of the post-flood genealogy linking Noah to Abraham.",
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
  },
  {
    id: "reu",
    name: "Reu",
    birth: -2217,
    death: -1978,
    category: "postdiluvian",
    scriptureRef: "Gen 11:18–21",
    blurb: "Son of Peleg; seventh generation from Shem.",
  },
  {
    id: "serug",
    name: "Serug",
    birth: -2185,
    death: -1955,
    category: "postdiluvian",
    scriptureRef: "Gen 11:20–23",
    blurb: "Son of Reu and grandfather of Nahor; lived 230 years.",
  },
  {
    id: "nahor",
    name: "Nahor",
    birth: -2155,
    death: -2007,
    category: "postdiluvian",
    scriptureRef: "Gen 11:22–25",
    blurb: "Grandfather of Abraham; lived 148 years.",
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
  {
    id: "joseph",
    name: "Joseph",
    birth: -1745,
    death: -1635,
    category: "patriarch",
    scriptureRef: "Gen 37–50",
    blurb:
      "Sold into slavery by his brothers; rose to become vizier of Egypt.",
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
  },

  // ═══════════════════════════════════════════════════════════════
  // KINGS OF ISRAEL — 1 Kings 12 – 2 Kings 17 (Thiele)
  // 19 kings. Birth = reignStart, death = reignEnd where unknown.
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
    name: "Jehoiachin",
    birth: -598,
    death: -597,
    reignStart: -598,
    reignEnd: -597,
    category: "judah-king",
    scriptureRef: "2 Kgs 24:8–17; 25:27–30",
    blurb:
      "Surrendered to Nebuchadnezzar after three months; later released from Babylonian prison.",
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
  {
    id: "zerubbabel",
    name: "Zerubbabel",
    birth: -560,
    death: -510,
    category: "exile-return",
    scriptureRef: "Ezra 1–6; Hag 1–2; Zech 4",
    blurb:
      "Davidic descendant who led the first return from exile and rebuilt the Temple foundation.",
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
  },
];
