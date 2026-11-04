/**
 * The priestly line — people who appear in the Lineage view only.
 *
 * Levi to Aaron: Exod 6:16–20. Aaron to Jehozadak: 1 Chr 6:3–15, with Ezra
 * 7:1–5 as a shorter parallel. Jeshua to Jaddua: Neh 12:10–11. Zechariah and
 * Elizabeth: Luke 1:5.
 *
 * Scripture gives almost no dates for these priests, so every year here is an
 * estimate, spaced by generation between a few anchors: Aaron, Zadok under
 * David and Solomon, Hilkiah under Josiah (622 BC), Seraiah's death at the
 * fall of Jerusalem (586 BC), and Jeshua at the return. The lists may also
 * skip generations. `estimated` makes the app say so.
 *
 * Hebrews 7:14 is explicit that Jesus descended from Judah, not Levi, so this
 * line never joins his family line. It reaches him by calling: the dashed link
 * in renderLineage.ts.
 */

import type { TimelineFigure } from "./timeline.ts";

const LIFESPAN = 70;

const priest = (
  id: string,
  name: string,
  birth: number,
  parent: string | undefined,
  scriptureRef: string,
  blurb: string,
  extra: Partial<TimelineFigure> = {},
): TimelineFigure => ({
  id,
  name,
  birth,
  death: birth + LIFESPAN,
  category: "priest",
  scriptureRef,
  blurb,
  parent,
  lineage: "priestly",
  estimated: true,
  ...extra,
});

const CHRONICLES = "1 Chr 6:3–15";

/** The last name in the high-priestly record, where the line goes dashed. */
export const LAST_RECORDED_PRIEST_ID = "jaddua";
/** Where the record picks up again, at the edge of the New Testament. */
export const RECORD_RESUMES_ID = "zechariah-priest";

export const priestlyLine: TimelineFigure[] = [
  priest("kohath", "Kohath", -1760, "levi", "Exod 6:16–18", "Son of Levi and ancestor of the priests; lived 133 years.", { death: -1627 }),
  priest("amram", "Amram", -1680, "kohath", "Exod 6:18–20", "Son of Kohath and father of Aaron, Moses, and Miriam; lived 137 years.", { death: -1543 }),
  priest("eleazar-priest", "Eleazar", -1530, "aaron", "Num 20:28; Josh 24:33", "Son of Aaron, who received his father's priestly garments and succeeded him as high priest."),
  priest("phinehas", "Phinehas", -1490, "eleazar-priest", "Num 25:10–13", "Son of Eleazar, given a covenant of permanent priesthood for his zeal."),
  priest("abishua", "Abishua", -1433, "phinehas", CHRONICLES, "Son of Phinehas in the priestly line."),
  priest("bukki", "Bukki", -1375, "abishua", CHRONICLES, "Son of Abishua in the priestly line."),
  priest("uzzi", "Uzzi", -1318, "bukki", CHRONICLES, "Son of Bukki in the priestly line."),
  priest("zerahiah", "Zerahiah", -1260, "uzzi", CHRONICLES, "Son of Uzzi in the priestly line."),
  priest("meraioth", "Meraioth", -1203, "zerahiah", CHRONICLES, "Son of Zerahiah in the priestly line."),
  priest("amariah-1", "Amariah", -1145, "meraioth", CHRONICLES, "Son of Meraioth in the priestly line."),
  priest("ahitub-1", "Ahitub", -1088, "amariah-1", CHRONICLES, "Son of Amariah and father of Zadok."),
  priest("zadok-priest", "Zadok", -1030, "ahitub-1", "1 Chr 6:8; 1 Kgs 2:35", "Priest under David, appointed by Solomon in Abiathar's place."),
  priest("ahimaaz", "Ahimaaz", -991, "zadok-priest", CHRONICLES, "Son of Zadok in the priestly line."),
  priest("azariah-1", "Azariah", -952, "ahimaaz", CHRONICLES, "Son of Ahimaaz in the priestly line."),
  priest("johanan", "Johanan", -913, "azariah-1", CHRONICLES, "Son of Azariah in the priestly line."),
  priest("azariah-2", "Azariah", -874, "johanan", "1 Chr 6:10", "Son of Johanan, remembered as serving in the temple Solomon built."),
  priest("amariah-2", "Amariah", -835, "azariah-2", CHRONICLES, "Son of Azariah in the priestly line."),
  priest("ahitub-2", "Ahitub", -797, "amariah-2", CHRONICLES, "Son of Amariah in the priestly line."),
  priest("zadok-2", "Zadok", -758, "ahitub-2", CHRONICLES, "Son of Ahitub in the priestly line."),
  priest("shallum-priest", "Shallum", -719, "zadok-2", CHRONICLES, "Son of Zadok and father of Hilkiah."),
  priest("hilkiah", "Hilkiah", -680, "shallum-priest", "1 Chr 6:13; 2 Kgs 22:8", "High priest under Josiah, who found the Book of the Law in the temple.", { death: -615 }),
  priest("azariah-3", "Azariah", -660, "hilkiah", CHRONICLES, "Son of Hilkiah in the priestly line."),
  priest("seraiah", "Seraiah", -630, "azariah-3", "1 Chr 6:14; 2 Kgs 25:18–21", "Chief priest when Jerusalem fell, put to death at Riblah.", { death: -586 }),
  priest("jehozadak", "Jehozadak", -610, "seraiah", "1 Chr 6:14–15", "Son of Seraiah, taken into exile when Judah fell to Nebuchadnezzar."),
  priest("jeshua", "Jeshua", -570, "jehozadak", "Hag 1:1; Ezra 3:2; Zech 6:11–13", "High priest of the return, also called Joshua. Zechariah set a crown on his head as a sign of the coming Branch.", { death: -500 }),
  priest("joiakim", "Joiakim", -530, "jeshua", "Neh 12:10", "Son of Jeshua in the line of high priests."),
  priest("eliashib", "Eliashib", -490, "joiakim", "Neh 12:10", "Son of Joiakim in the line of high priests."),
  priest("joiada", "Joiada", -455, "eliashib", "Neh 12:10", "Son of Eliashib in the line of high priests."),
  priest("jonathan-priest", "Jonathan", -420, "joiada", "Neh 12:11", "Son of Joiada in the line of high priests."),
  priest(LAST_RECORDED_PRIEST_ID, "Jaddua", -390, "jonathan-priest", "Neh 12:11", "Son of Jonathan, the last high priest named in the Old Testament."),
  priest(RECORD_RESUMES_ID, "Zechariah", -65, undefined, "Luke 1:5", "Priest of the division of Abijah and father of John the Baptist.", { deathUnknown: true, death: 0 }),
  priest("elizabeth", "Elizabeth", -60, undefined, "Luke 1:5, 36", "Descendant of Aaron, mother of John the Baptist, and relative of Mary.", { deathUnknown: true, death: 5 }),
];
