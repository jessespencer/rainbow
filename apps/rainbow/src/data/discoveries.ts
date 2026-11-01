/**
 * Curated reading journey, independent of the imported reference counts.
 * Text checked against World English Bible Classic, eBible.org, 2026-10-16.
 * The translation is public domain; emphasis is added by this application.
 */
export interface Passage {
  reference: string;
  text: string;
  emphasis: string;
  source: string;
}
export interface Discovery {
  title: string;
  connection: string;
  passages: [Passage, Passage];
  explanation: string;
}
const beginning: Passage = {
  reference: 'Genesis 1:1',
  text: 'In the beginning, God created the heavens and the earth.',
  emphasis: 'In the beginning',
  source: 'https://ebible.org/eng-web/GEN01.htm',
};
const light: Passage = {
  reference: 'Genesis 1:3',
  text: 'God said, “Let there be light,” and there was light.',
  emphasis: 'light',
  source: 'https://ebible.org/eng-web/GEN01.htm',
};
export const DISCOVERIES: Discovery[] = [
  {
    title: 'An opening that echoes',
    connection: 'Shared opening language',
    passages: [beginning, {
      reference: 'John 1:1',
      text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
      emphasis: 'In the beginning',
      source: 'https://ebible.org/eng-web/JHN01.htm',
    }],
    explanation: 'John begins with the same words that open Genesis. Genesis introduces God creating the world; John introduces the Word in relation to God. Reading the openings together places John’s story against the horizon of creation.',
  },
  {
    title: 'Light enters the story',
    connection: 'A thematic echo',
    passages: [light, {
      reference: 'John 1:5',
      text: 'The light shines in the darkness, and the darkness hasn’t overcome it.',
      emphasis: 'light',
      source: 'https://ebible.org/eng-web/JHN01.htm',
    }],
    explanation: 'Continue through the openings and light becomes a shared image. In Genesis, light appears at God’s command. In John, light shines against darkness. This is a thematic reading of the two passages, rather than an explicit quotation by John.',
  },
  {
    title: 'From creation to the heart',
    connection: 'An explicit creation reference',
    passages: [light, {
      reference: '2 Corinthians 4:6',
      text: 'seeing it is God who said, “Light will shine out of darkness,” who has shone in our hearts to give the light of the knowledge of the glory of God in the face of Jesus Christ.',
      emphasis: 'Light will shine out of darkness',
      source: 'https://ebible.org/eng-web/2CO04.htm',
    }],
    explanation: 'Paul directly recalls God’s command for light and applies it to knowing Christ. The image moves from the creation of the world to illumination in the heart. The source edition also links this verse to Genesis 1:3.',
  },
];
