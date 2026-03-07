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
  'Psalms-Isaiah': [
    { source: 'Psalm 2:1-2', target: 'Isaiah 61:1', note: 'The anointed one — kings rage, the Messiah is sent' },
    { source: 'Psalm 72:8', target: 'Isaiah 11:9', note: 'Dominion to the ends of the earth — the peaceable kingdom' },
    { source: 'Psalm 22:1', target: 'Isaiah 53:3', note: 'Forsaken and despised — the suffering servant' },
    { source: 'Psalm 46:4', target: 'Isaiah 33:21', note: 'River that makes glad — streams of the Lord\'s city' },
    { source: 'Psalm 96:13', target: 'Isaiah 2:4', note: 'The Lord comes to judge — swords into plowshares' },
    { source: 'Psalm 118:22', target: 'Isaiah 28:16', note: 'The rejected stone becomes the precious cornerstone' },
    { source: 'Psalm 40:6-8', target: 'Isaiah 1:11-13', note: 'God desires obedience over sacrifice' },
    { source: 'Psalm 104:2', target: 'Isaiah 40:22', note: 'Stretching out the heavens like a curtain' },
  ],
  'Isaiah-Jeremiah': [
    { source: 'Isaiah 10:21-22', target: 'Jeremiah 23:3', note: 'A remnant shall return — gathering the scattered flock' },
    { source: 'Isaiah 2:4', target: 'Jeremiah 6:14', note: 'Peace and its counterfeits — true vs. false shalom' },
    { source: 'Isaiah 29:13', target: 'Jeremiah 12:2', note: 'Near in mouth, far in heart — lip-service religion' },
    { source: 'Isaiah 44:28', target: 'Jeremiah 25:11-12', note: 'Seventy years of exile — restoration decreed' },
    { source: 'Isaiah 5:1-7', target: 'Jeremiah 2:21', note: 'The vineyard — a choice vine turned wild' },
    { source: 'Isaiah 49:6', target: 'Jeremiah 1:5', note: 'Called before birth — a light to the nations' },
    { source: 'Isaiah 31:3', target: 'Jeremiah 17:5', note: 'Cursed is trust in flesh — Egypt is human, not God' },
    { source: 'Isaiah 55:3', target: 'Jeremiah 31:31-33', note: 'Everlasting covenant — the new covenant promise' },
  ],
  'Matthew-Luke': [
    { source: 'Matthew 5:3', target: 'Luke 6:20', note: 'Blessed are the poor — Sermon on the Mount vs. Plain' },
    { source: 'Matthew 6:9-13', target: 'Luke 11:2-4', note: 'The Lord\'s Prayer — two versions, one pattern' },
    { source: 'Matthew 3:17', target: 'Luke 3:22', note: 'This is my beloved Son — voice at baptism' },
    { source: 'Matthew 24:30', target: 'Luke 21:27', note: 'Son of Man coming on clouds — Olivet Discourse' },
    { source: 'Matthew 13:31-32', target: 'Luke 13:18-19', note: 'Mustard seed — smallest becomes greatest' },
    { source: 'Matthew 10:26', target: 'Luke 12:2', note: 'Nothing hidden that will not be revealed' },
    { source: 'Matthew 22:37-39', target: 'Luke 10:27', note: 'Greatest commandment — love God, love neighbor' },
    { source: 'Matthew 28:19-20', target: 'Luke 24:47', note: 'Great Commission — go to all nations' },
  ],
  'Jeremiah-Ezekiel': [
    { source: 'Jeremiah 31:31-34', target: 'Ezekiel 36:26-27', note: 'New covenant — law written on hearts, new spirit within' },
    { source: 'Jeremiah 23:1-4', target: 'Ezekiel 34:2-10', note: 'Woe to the shepherds who scatter the flock' },
    { source: 'Jeremiah 23:5-6', target: 'Ezekiel 34:23-24', note: 'Righteous Branch — David my servant shall be king' },
    { source: 'Jeremiah 24:7', target: 'Ezekiel 11:19-20', note: 'I will give them a heart to know me' },
    { source: 'Jeremiah 7:4', target: 'Ezekiel 8:6', note: 'Temple profaned — false security in God\'s house' },
    { source: 'Jeremiah 4:23', target: 'Ezekiel 7:2', note: 'The end has come — earth without form and void' },
    { source: 'Jeremiah 50:17-19', target: 'Ezekiel 39:25-29', note: 'Israel restored from exile — gathered from the nations' },
  ],
  'Job-Psalms': [
    { source: 'Job 7:17-18', target: 'Psalm 8:4', note: 'What is man that you are mindful of him?' },
    { source: 'Job 19:25', target: 'Psalm 16:10', note: 'My Redeemer lives — you will not abandon my soul' },
    { source: 'Job 38:4-7', target: 'Psalm 104:5-6', note: 'Foundations of the earth — creation\'s grandeur' },
    { source: 'Job 1:21', target: 'Psalm 49:17', note: 'Naked I came — takes nothing to the grave' },
    { source: 'Job 42:2', target: 'Psalm 139:1-4', note: 'No purpose of yours can be thwarted — omniscience' },
    { source: 'Job 5:9', target: 'Psalm 145:3', note: 'Great things past finding out — unsearchable' },
    { source: 'Job 14:1-2', target: 'Psalm 103:15-16', note: 'Man born of woman, few days — like grass that withers' },
  ],
  'Psalms-Jeremiah': [
    { source: 'Psalm 1:3', target: 'Jeremiah 17:8', note: 'Tree planted by water — blessed who trusts the Lord' },
    { source: 'Psalm 79:6-7', target: 'Jeremiah 10:25', note: 'Pour out wrath on nations that do not know you' },
    { source: 'Psalm 44:22', target: 'Jeremiah 12:3', note: 'Sheep for slaughter — set apart for the day of killing' },
    { source: 'Psalm 31:13', target: 'Jeremiah 20:10', note: 'Terror on every side — whispering of many' },
    { source: 'Psalm 69:25', target: 'Jeremiah 18:23', note: 'Blot them out — imprecatory prayer under persecution' },
    { source: 'Psalm 137:7', target: 'Jeremiah 49:7-8', note: 'Judgment on Edom — remember what they did' },
  ],
  'Matthew-Mark': [
    { source: 'Matthew 16:24', target: 'Mark 8:34', note: 'Take up your cross and follow me' },
    { source: 'Matthew 26:26-28', target: 'Mark 14:22-24', note: 'Last Supper — this is my body, this is my blood' },
    { source: 'Matthew 14:19-21', target: 'Mark 6:41-44', note: 'Feeding the five thousand — five loaves, two fish' },
    { source: 'Matthew 17:1-2', target: 'Mark 9:2-3', note: 'Transfiguration — face shone, garments white' },
    { source: 'Matthew 19:14', target: 'Mark 10:14', note: 'Let the little children come to me' },
    { source: 'Matthew 21:12-13', target: 'Mark 11:15-17', note: 'Cleansing the temple — house of prayer, den of robbers' },
    { source: 'Matthew 27:46', target: 'Mark 15:34', note: 'Eloi, Eloi — cry of dereliction from the cross' },
  ],
  'Matthew-John': [
    { source: 'Matthew 3:11', target: 'John 1:26-27', note: 'John the Baptist — I am not worthy to untie his sandals' },
    { source: 'Matthew 14:25-27', target: 'John 6:19-20', note: 'Walking on water — take heart, it is I' },
    { source: 'Matthew 26:39', target: 'John 12:27', note: 'The hour has come — agony before the cross' },
    { source: 'Matthew 16:16', target: 'John 6:69', note: 'Peter\'s confession — You are the Christ, the Son of God' },
    { source: 'Matthew 28:6', target: 'John 20:17', note: 'He is risen — resurrection appearances' },
    { source: 'Matthew 11:27', target: 'John 10:15', note: 'The Father knows me and I know the Father' },
    { source: 'Matthew 26:14-15', target: 'John 13:2', note: 'Judas\'s betrayal — the devil put it into his heart' },
  ],
  'Psalms-Proverbs': [
    { source: 'Psalm 111:10', target: 'Proverbs 9:10', note: 'The fear of the Lord is the beginning of wisdom' },
    { source: 'Psalm 37:16', target: 'Proverbs 15:16', note: 'Better a little with righteousness than great wealth' },
    { source: 'Psalm 34:13', target: 'Proverbs 21:23', note: 'Guard your tongue — keeps soul from trouble' },
    { source: 'Psalm 127:1', target: 'Proverbs 10:22', note: 'Unless the Lord builds — blessing without toil' },
    { source: 'Psalm 37:21', target: 'Proverbs 22:7', note: 'The wicked borrows — the borrower is slave to the lender' },
    { source: 'Psalm 1:1', target: 'Proverbs 4:14', note: 'Blessed who walks not in the counsel of the wicked' },
    { source: 'Psalm 19:14', target: 'Proverbs 16:1', note: 'Words of my mouth — the answer of the tongue is from the Lord' },
  ],
  'Isaiah-Ezekiel': [
    { source: 'Isaiah 6:1-3', target: 'Ezekiel 1:26-28', note: 'Throne visions — holy, holy, holy and the glory of the Lord' },
    { source: 'Isaiah 14:12-15', target: 'Ezekiel 28:12-17', note: 'Fall of the cosmic tyrant — pride before destruction' },
    { source: 'Isaiah 34:5-6', target: 'Ezekiel 35:3-5', note: 'Judgment on Edom — sword of the Lord' },
    { source: 'Isaiah 11:6-9', target: 'Ezekiel 34:25', note: 'Covenant of peace — wolf and lamb, no wild beasts' },
    { source: 'Isaiah 4:2', target: 'Ezekiel 17:22-24', note: 'Branch of the Lord — the tender twig planted high' },
    { source: 'Isaiah 40:11', target: 'Ezekiel 34:11-12', note: 'God as shepherd — seeking the lost, gathering the flock' },
  ],
  'Luke-John': [
    { source: 'Luke 22:19-20', target: 'John 6:53-56', note: 'Body and blood — bread broken, flesh given for life' },
    { source: 'Luke 24:36-39', target: 'John 20:19-20', note: 'Peace be with you — risen Christ appears behind closed doors' },
    { source: 'Luke 10:22', target: 'John 3:35', note: 'All things delivered to me by the Father' },
    { source: 'Luke 5:4-7', target: 'John 21:6', note: 'Miraculous catch of fish — cast your nets' },
    { source: 'Luke 7:48', target: 'John 8:11', note: 'Your sins are forgiven — go and sin no more' },
    { source: 'Luke 3:16', target: 'John 1:33', note: 'He will baptize with the Holy Spirit and fire' },
  ],
  'Mark-Luke': [
    { source: 'Mark 1:15', target: 'Luke 4:43', note: 'The kingdom of God is at hand — I must preach' },
    { source: 'Mark 4:30-32', target: 'Luke 13:18-19', note: 'Mustard seed — the kingdom grows from small beginnings' },
    { source: 'Mark 10:45', target: 'Luke 22:27', note: 'Son of Man came to serve — I am among you as one who serves' },
    { source: 'Mark 12:41-44', target: 'Luke 21:1-4', note: 'Widow\'s mite — she gave all she had to live on' },
    { source: 'Mark 14:36', target: 'Luke 22:42', note: 'Abba, Father — not my will, but yours be done' },
    { source: 'Mark 16:15', target: 'Luke 24:47', note: 'Go into all the world — repentance preached to all nations' },
  ],
  'Deuteronomy-Psalms': [
    { source: 'Deuteronomy 6:5', target: 'Psalm 18:1', note: 'Love the Lord your God — I love you, O Lord, my strength' },
    { source: 'Deuteronomy 32:4', target: 'Psalm 18:31', note: 'The Rock — his work is perfect, who is a rock besides our God?' },
    { source: 'Deuteronomy 10:17', target: 'Psalm 136:2-3', note: 'God of gods, Lord of lords — his steadfast love endures forever' },
    { source: 'Deuteronomy 33:27', target: 'Psalm 90:1-2', note: 'The eternal God is your dwelling place — from everlasting' },
    { source: 'Deuteronomy 8:3', target: 'Psalm 119:103', note: 'Man lives by every word — sweeter than honey' },
    { source: 'Deuteronomy 32:35', target: 'Psalm 94:1', note: 'Vengeance is mine — O God of vengeance, shine forth' },
  ],
  'Luke-Acts': [
    { source: 'Luke 24:49', target: 'Acts 1:4-5', note: 'Wait for the promise — clothed with power from on high' },
    { source: 'Luke 24:50-51', target: 'Acts 1:9-11', note: 'Ascension — taken up, a cloud received him' },
    { source: 'Luke 3:16', target: 'Acts 2:3-4', note: 'Baptize with fire — tongues of fire at Pentecost' },
    { source: 'Luke 4:18-19', target: 'Acts 10:38', note: 'Anointed to preach good news — God anointed Jesus' },
    { source: 'Luke 22:69', target: 'Acts 7:56', note: 'Son of Man at the right hand — Stephen\'s vision' },
    { source: 'Luke 10:1', target: 'Acts 13:2-3', note: 'Sent out in pairs — set apart for the work' },
  ],
  'Matthew-Acts': [
    { source: 'Matthew 28:19', target: 'Acts 2:38', note: 'Baptize all nations — in the name of Jesus Christ' },
    { source: 'Matthew 10:18-20', target: 'Acts 4:8-12', note: 'Brought before governors — Peter before the Sanhedrin' },
    { source: 'Matthew 16:18', target: 'Acts 2:41-42', note: 'I will build my church — three thousand added that day' },
    { source: 'Matthew 24:14', target: 'Acts 1:8', note: 'Gospel to all nations — witnesses to the ends of the earth' },
    { source: 'Matthew 13:33', target: 'Acts 17:6', note: 'Leaven that leavens — turned the world upside down' },
    { source: 'Matthew 9:37-38', target: 'Acts 13:47', note: 'Harvest is plentiful — a light for the Gentiles' },
  ],
  'Psalms-Matthew': [
    { source: 'Psalm 22:1', target: 'Matthew 27:46', note: 'My God, my God, why have you forsaken me?' },
    { source: 'Psalm 118:22-23', target: 'Matthew 21:42', note: 'The stone the builders rejected — head of the corner' },
    { source: 'Psalm 110:1', target: 'Matthew 22:44', note: 'Sit at my right hand — David\'s Lord' },
    { source: 'Psalm 8:2', target: 'Matthew 21:16', note: 'Out of the mouth of infants — perfected praise' },
    { source: 'Psalm 78:2', target: 'Matthew 13:35', note: 'I will open my mouth in parables' },
    { source: 'Psalm 91:11-12', target: 'Matthew 4:6', note: 'Angels will bear you up — the temptation' },
    { source: 'Psalm 22:18', target: 'Matthew 27:35', note: 'They divided my garments, casting lots' },
  ],
  'Genesis-Psalms': [
    { source: 'Genesis 1:1', target: 'Psalm 33:6', note: 'By the word of the Lord the heavens were made' },
    { source: 'Genesis 1:16', target: 'Psalm 136:7-9', note: 'Sun and moon — great lights, steadfast love endures' },
    { source: 'Genesis 1:26-27', target: 'Psalm 8:5-6', note: 'Made in God\'s image — crowned with glory and honor' },
    { source: 'Genesis 3:19', target: 'Psalm 103:14', note: 'Dust to dust — he remembers that we are dust' },
    { source: 'Genesis 22:17', target: 'Psalm 147:4', note: 'Stars without number — he determines their count' },
    { source: 'Genesis 9:13', target: 'Psalm 104:3', note: 'Covenant sign in the clouds — he makes the clouds his chariot' },
  ],
  'Exodus-Psalms': [
    { source: 'Exodus 14:21-22', target: 'Psalm 78:13', note: 'Parting the Red Sea — he divided the sea' },
    { source: 'Exodus 16:4', target: 'Psalm 78:24', note: 'Manna from heaven — he rained down grain' },
    { source: 'Exodus 17:6', target: 'Psalm 78:15-16', note: 'Water from the rock — streams in the desert' },
    { source: 'Exodus 15:1-2', target: 'Psalm 118:14', note: 'The Lord is my strength and my song' },
    { source: 'Exodus 34:6-7', target: 'Psalm 103:8', note: 'Merciful and gracious, slow to anger, abounding in love' },
    { source: 'Exodus 19:16-18', target: 'Psalm 68:8', note: 'Sinai trembled — the earth shook at God\'s presence' },
  ],
  'Psalms-Revelation': [
    { source: 'Psalm 2:9', target: 'Revelation 2:27', note: 'Rule with a rod of iron — dash them like pottery' },
    { source: 'Psalm 96:13', target: 'Revelation 19:11', note: 'He comes to judge — Faithful and True' },
    { source: 'Psalm 149:1', target: 'Revelation 5:9', note: 'A new song — worthy is the Lamb' },
    { source: 'Psalm 47:8', target: 'Revelation 4:2', note: 'God sits on his holy throne — one seated on the throne' },
    { source: 'Psalm 46:4', target: 'Revelation 22:1', note: 'River of God — river of the water of life' },
    { source: 'Psalm 69:28', target: 'Revelation 3:5', note: 'Book of life — blot out or never blot out' },
  ],
};

export function getSampleKey(bookA: number, bookB: number): string | null {
  const nameMap: Record<number, string> = {
    0: 'Genesis', 1: 'Exodus', 4: 'Deuteronomy',
    17: 'Job', 18: 'Psalms', 19: 'Proverbs',
    22: 'Isaiah', 23: 'Jeremiah', 25: 'Ezekiel', 26: 'Daniel',
    39: 'Matthew', 40: 'Mark', 41: 'Luke', 42: 'John', 43: 'Acts',
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
