// Hardcoded top verse pairs for the side panel, organized by major book combinations.
// Each entry: { source: "Book Ch:V", target: "Book Ch:V", note: brief theological context }

export interface SampleRef {
  source: string;
  target: string;
  note: string;
}

export const SAMPLE_REFS: Record<string, SampleRef[]> = {
  'Isaiah-Matthew': [
    { source: 'Isaiah 7:14', target: 'Matthew 1:23', note: 'Virgin birth — Emmanuel prophecy fulfilled' },
    { source: 'Isaiah 9:1-2', target: 'Matthew 4:15-16', note: 'Light to Galilee of the Gentiles' },
    { source: 'Isaiah 53:4', target: 'Matthew 8:17', note: 'He took our infirmities and bore our diseases' },
    { source: 'Isaiah 42:1-4', target: 'Matthew 12:18-21', note: 'The Servant — justice to the nations' },
    { source: 'Isaiah 6:9-10', target: 'Matthew 13:14-15', note: 'Hearing but not understanding — judicial hardening' },
    { source: 'Isaiah 53:12', target: 'Matthew 27:38', note: 'Numbered with transgressors at crucifixion' },
    { source: 'Isaiah 61:1-2', target: 'Matthew 11:5', note: 'Good news to the poor, sight to the blind' },
    { source: 'Isaiah 40:3', target: 'Matthew 3:3', note: 'Voice crying in the wilderness — John the Baptist' },
    { source: 'Isaiah 29:13', target: 'Matthew 15:8-9', note: 'Lip service without heart devotion' },
    { source: 'Isaiah 62:11', target: 'Matthew 21:5', note: 'King comes riding on a donkey' },
  ],
  'Psalms-Hebrews': [
    { source: 'Psalm 2:7', target: 'Hebrews 1:5', note: 'You are my Son — divine sonship' },
    { source: 'Psalm 45:6-7', target: 'Hebrews 1:8-9', note: 'Your throne, O God, is forever' },
    { source: 'Psalm 102:25-27', target: 'Hebrews 1:10-12', note: 'Heavens perish, but You remain' },
    { source: 'Psalm 110:1', target: 'Hebrews 1:13', note: 'Sit at my right hand — Melchizedek priesthood' },
    { source: 'Psalm 8:4-6', target: 'Hebrews 2:6-8', note: 'What is man? — crowned with glory' },
    { source: 'Psalm 22:22', target: 'Hebrews 2:12', note: 'I will declare your name to my brothers' },
    { source: 'Psalm 95:7-11', target: 'Hebrews 3:7-11', note: 'Today if you hear his voice — Sabbath rest' },
    { source: 'Psalm 110:4', target: 'Hebrews 5:6', note: 'Priest forever after the order of Melchizedek' },
    { source: 'Psalm 40:6-8', target: 'Hebrews 10:5-7', note: 'Sacrifice and offering you did not desire' },
    { source: 'Psalm 118:6', target: 'Hebrews 13:6', note: 'The Lord is my helper; I will not fear' },
  ],
  'Genesis-John': [
    { source: 'Genesis 1:1', target: 'John 1:1', note: 'In the beginning — the Word as agent of creation' },
    { source: 'Genesis 1:3', target: 'John 1:4-5', note: 'Let there be light — the light of men' },
    { source: 'Genesis 2:19-20', target: 'John 10:3', note: 'Naming and knowing — the Good Shepherd calls by name' },
    { source: 'Genesis 3:15', target: 'John 12:31', note: 'Seed of the woman — ruler of this world cast out' },
    { source: 'Genesis 14:18', target: 'John 6:35', note: 'Melchizedek brings bread and wine — bread of life' },
    { source: 'Genesis 22:2', target: 'John 3:16', note: 'Only son offered — God so loved the world' },
    { source: 'Genesis 28:12', target: 'John 1:51', note: 'Jacob\'s ladder — angels ascending and descending on the Son of Man' },
    { source: 'Genesis 49:10', target: 'John 4:25-26', note: 'Shiloh — the Messiah has come' },
    { source: 'Genesis 1:29', target: 'John 6:51', note: 'Food given for life — living bread from heaven' },
    { source: 'Genesis 2:7', target: 'John 20:22', note: 'Breath of life — Jesus breathes the Holy Spirit' },
  ],
  'Genesis-Romans': [
    { source: 'Genesis 1:20-25', target: 'Romans 1:20', note: 'Creation reveals God\'s eternal power' },
    { source: 'Genesis 3:6', target: 'Romans 5:12', note: 'Through one man sin entered the world' },
    { source: 'Genesis 15:6', target: 'Romans 4:3', note: 'Abraham believed God — credited as righteousness' },
    { source: 'Genesis 12:3', target: 'Romans 4:16-17', note: 'Blessing to all nations — father of many' },
    { source: 'Genesis 18:25', target: 'Romans 3:6', note: 'Shall not the judge of all the earth do right?' },
    { source: 'Genesis 25:23', target: 'Romans 9:12', note: 'The older shall serve the younger — election' },
    { source: 'Genesis 2:24', target: 'Romans 7:2', note: 'Marriage bond — law of the husband' },
    { source: 'Genesis 3:19', target: 'Romans 6:23', note: 'Dust to dust — wages of sin is death' },
  ],
  'Deuteronomy-Romans': [
    { source: 'Deuteronomy 30:12-14', target: 'Romans 10:6-8', note: 'The word is near you — righteousness by faith' },
    { source: 'Deuteronomy 32:35', target: 'Romans 12:19', note: 'Vengeance is mine, says the Lord' },
    { source: 'Deuteronomy 32:43', target: 'Romans 15:10', note: 'Rejoice, O Gentiles, with his people' },
    { source: 'Deuteronomy 25:4', target: 'Romans 11:1-2', note: 'God has not rejected his people' },
    { source: 'Deuteronomy 27:26', target: 'Romans 3:19-20', note: 'Cursed is everyone who does not keep the law' },
  ],
  'Psalms-Gospels': [
    { source: 'Psalm 22:1', target: 'Matthew 27:46', note: 'My God, my God, why have you forsaken me?' },
    { source: 'Psalm 22:18', target: 'John 19:24', note: 'They divided my garments and cast lots' },
    { source: 'Psalm 69:21', target: 'Matthew 27:48', note: 'They gave me vinegar to drink' },
    { source: 'Psalm 118:22-23', target: 'Matthew 21:42', note: 'The stone the builders rejected' },
    { source: 'Psalm 110:1', target: 'Mark 12:36', note: 'The Lord said to my Lord — David\'s Lord' },
    { source: 'Psalm 41:9', target: 'John 13:18', note: 'He who ate my bread has lifted his heel' },
    { source: 'Psalm 31:5', target: 'Luke 23:46', note: 'Into your hands I commit my spirit' },
    { source: 'Psalm 69:9', target: 'John 2:17', note: 'Zeal for your house will consume me' },
  ],
  'Daniel-Revelation': [
    { source: 'Daniel 7:13-14', target: 'Revelation 1:13-14', note: 'One like a Son of Man — ancient imagery' },
    { source: 'Daniel 7:9-10', target: 'Revelation 20:11-12', note: 'Thrones set, books opened — the great judgment' },
    { source: 'Daniel 10:6', target: 'Revelation 1:15', note: 'Feet like burnished bronze — theophany description' },
    { source: 'Daniel 12:1', target: 'Revelation 12:7', note: 'Michael arises — war in heaven' },
    { source: 'Daniel 2:44', target: 'Revelation 11:15', note: 'Kingdom that shall never be destroyed' },
    { source: 'Daniel 7:25', target: 'Revelation 13:5-7', note: 'Three and a half years — persecution of saints' },
  ],
  'Exodus-Hebrews': [
    { source: 'Exodus 24:8', target: 'Hebrews 9:20', note: 'Blood of the covenant — old and new' },
    { source: 'Exodus 25:40', target: 'Hebrews 8:5', note: 'Pattern shown on the mountain — heavenly tabernacle' },
    { source: 'Exodus 19:12-13', target: 'Hebrews 12:18-20', note: 'Mount Sinai — trembling and fear' },
    { source: 'Exodus 3:2-6', target: 'Hebrews 11:27', note: 'The burning bush — seeing the invisible' },
    { source: 'Exodus 12:21-23', target: 'Hebrews 11:28', note: 'Passover and sprinkling of blood' },
  ],
};

export function getSampleKey(bookA: number, bookB: number): string | null {
  const nameMap: Record<number, string> = {
    0: 'Genesis', 4: 'Deuteronomy', 18: 'Psalms', 22: 'Isaiah',
    26: 'Daniel', 1: 'Exodus', 39: 'Matthew', 42: 'John',
    44: 'Romans', 57: 'Hebrews', 65: 'Revelation',
  };
  const a = nameMap[bookA];
  const b = nameMap[bookB];
  if (!a || !b) return null;
  const key1 = `${a}-${b}`;
  const key2 = `${b}-${a}`;
  if (SAMPLE_REFS[key1]) return key1;
  if (SAMPLE_REFS[key2]) return key2;
  // Check for grouped keys like 'Psalms-Gospels'
  if (bookB >= 39 && bookB <= 42 && a === 'Psalms') return 'Psalms-Gospels';
  if (bookA >= 39 && bookA <= 42 && b === 'Psalms') return 'Psalms-Gospels';
  return null;
}
