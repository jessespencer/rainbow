import type { Category } from "../data/timeline.ts";

export const CATEGORY_ORDER: Category[] = [
  "antediluvian",
  "postdiluvian",
  "patriarch",
  "exodus",
  "judge",
  "united-king",
  "israel-king",
  "judah-king",
  "prophet",
  "exile-return",
  "messiah",
];

export const CATEGORY_NAMES: Record<Category, string> = {
  antediluvian: "Antediluvian",
  postdiluvian: "Postdiluvian",
  patriarch: "Patriarch",
  exodus: "Exodus",
  judge: "Judge",
  "united-king": "United Kingdom",
  "israel-king": "Israel (North)",
  "judah-king": "Judah (South)",
  prophet: "Prophet",
  "exile-return": "Exile & Return",
  messiah: "Messiah",
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  antediluvian: "Before the Flood — Adam through the generation of Noah",
  postdiluvian: "After the Flood — Noah's descendants through Terah",
  patriarch: "The patriarchs of Israel — Abraham, Isaac, Jacob, and Joseph",
  exodus: "The Exodus from Egypt — Moses and Aaron lead Israel out of slavery",
  judge: "Tribal leaders who governed Israel before the monarchy",
  "united-king": "Saul, David, and Solomon rule all twelve tribes",
  "israel-king": "Kings of the Northern Kingdom after the split in 931 BC",
  "judah-king": "Kings of the Southern Kingdom after the split in 931 BC",
  prophet: "God's messengers during the monarchy and exile",
  "exile-return": "The Babylonian exile and the return to rebuild Jerusalem",
  messiah: "Jesus Christ — his birth, ministry, and resurrection",
};
