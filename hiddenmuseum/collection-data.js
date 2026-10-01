/* ==========================================================================
   Numismatic timeline — content
   --------------------------------------------------------------------------
   Each phase has one or more groups. In each group:
     photoCount        number of photo slots shown
     photos            the photos you already have, in order:
                         { src, reverse?, alt, caption, text? }
                       (reverse: image of the other side; text: shown
                       when the photo is enlarged)
                       Empty slots up to photoCount show a "photo à venir" frame.
     descriptionCount  number of description slots shown
     descriptions      the descriptions you already have, in order:
                         { title, text }
   To add a photo: put the file in assets/collection/ and add an entry to
   `photos`. To add a text: add an entry to `descriptions`. Nothing else
   needs to change.
   ========================================================================== */
window.BAM_COLLECTION = [
  {
    id: 'origines',
    short: 'Origines',
    title: 'Des origines à la naissance de la monnaie',
    from: 'Prémonnaie',
    to: 'Achéménides',
    intro: 'Long before coins, value travelled as grain, cattle, shells and metal weighed out on the scale. The first true coins — lumps of electrum stamped with a mark of guarantee — appeared in Lydia in the seventh century BCE, and the Persian Achaemenids carried the idea across an empire with their gold daric.',
    groups: [
      {
        photoCount: 6,
        photos: [
          { src: 'assets/collection/premonnaie-1.webp', alt: 'Bronze pre-coinage object with four rounded arms.', caption: 'Prémonnaie · bronze' },
          { src: 'assets/collection/premonnaie-2.webp', alt: 'Small elongated bronze pre-coinage object with a green patina.', caption: 'Prémonnaie · bronze' },
          { src: 'assets/collection/premonnaie-3a.webp', reverse: 'assets/collection/premonnaie-3b.webp', alt: 'Spade-shaped bronze pre-coinage piece with a forked foot, a pierced handle and incised characters.', caption: 'Prémonnaie · bronze' },
          { src: 'assets/collection/lydie-statere-b.webp', reverse: 'assets/collection/lydie-statere-a.webp', alt: 'Oval gold coin of Lydia showing the facing heads of a lion and a bull.', caption: 'Lydia · gold stater · lion and bull' },
          { src: 'assets/collection/achemenide-darique-b.webp', reverse: 'assets/collection/achemenide-darique-a.webp', alt: 'Gold Achaemenid coin showing the Persian king running with bow and spear.', caption: 'Achaemenid Persia · gold daric · the king as archer' }
        ],
        descriptionCount: 3,
        descriptions: []
      }
    ]
  },
  {
    id: 'antique',
    short: 'Antiquité',
    title: 'Le monnayage antique',
    from: 'Grèce',
    to: 'Sassanides',
    intro: 'From the silver owls of Athens to the coins of Carthage, Numidia and Mauretania, and on to Rome, Byzantium and Sassanid Persia, antiquity made money a portrait of power: a ruler’s face, a city’s emblem, carried hand to hand across the Mediterranean.',
    groups: [
      {
        photoCount: 12,
        photos: [
          { src: 'assets/collection/antique-owl-a.webp', reverse: 'assets/collection/antique-owl-b.webp', alt: 'Dark coin of Athenian type with the head of Athena and, on the other side, an owl.', caption: 'Athenian type · head of Athena / owl' },
          { src: 'assets/collection/antique-carthage-a.webp', reverse: 'assets/collection/antique-carthage-b.webp', alt: 'Gold coin of Carthage with the head of the goddess Tanit and, on the other side, a standing horse.', caption: 'Carthage · gold stater · head of Tanit / horse' },
          { src: 'assets/collection/antique-rome-a.webp', reverse: 'assets/collection/antique-rome-b.webp', alt: 'Gold Roman coin with the laureate bust of Caracalla and, on the other side, a goddess riding a lion.', caption: 'Rome · gold aureus · Caracalla', text: 'Obverse: ANTONINVS PIVS AVG. Reverse: INDVLGENTIA AVGG IN CARTH — the goddess Caelestis riding a lion, celebrating the emperors’ favour to Carthage.' }
        ],
        descriptionCount: 12,
        descriptions: []
      }
    ]
  },
  {
    id: 'arabo-musulmane',
    short: 'Arabo-musulmane',
    title: 'Création de la monnaie arabo-musulmane',
    from: 'Omeyyades',
    to: 'Abbassides',
    intro: 'At the end of the seventh century the Umayyad caliph ʿAbd al-Malik replaced borrowed Byzantine and Persian designs with a new coinage of words alone: a gold dinar and a silver dirham carrying only inscriptions. The Abbasids spread this model from Central Asia to the Atlantic.',
    groups: [
      { photoCount: 4, photos: [], descriptionCount: 4, descriptions: [] }
    ]
  },
  {
    id: 'idrissides',
    short: 'Idrissides',
    title: 'Naissance d’un État musulman au Maroc',
    from: 'Idrissides',
    to: 'Hammoudides',
    intro: 'With Idris I in 788, Morocco gained its first Muslim state — and its own mints. Idrisid silver dirhams struck at Walila, Fès and other cities announced a new sovereignty, a lineage continued into the eleventh century by their Hammudid descendants.',
    groups: [
      { photoCount: 4, photos: [], descriptionCount: 4, descriptions: [] }
    ]
  },
  {
    id: 'or',
    short: 'Empires de l’or',
    title: 'Les grands empires de l’or',
    from: 'Almoravides',
    to: 'Wattassides',
    intro: 'Fed by the trans-Saharan gold routes, the Almoravid dinar became one of the most trusted coins of the medieval Mediterranean. The Almohads followed with their distinctive square dirham, and the Merinid and Wattasid dynasties carried this tradition of fine gold and silver to the threshold of the modern age.',
    groups: [
      { photoCount: 7, photos: [], descriptionCount: 7, descriptions: [] }
    ]
  },
  {
    id: 'cherifiens',
    short: 'Chérifiens',
    title: 'Les empires chérifiens',
    from: 'Saâdiens',
    to: 'Émissions du protectorat',
    intro: 'Saadian gold, the long Alaouite reigns, Moulay al-Hassan I’s attempt at a modern national currency, the first banknotes of the Banque d’État du Maroc created in 1907, and the issues of the protectorate: four centuries in which coin and paper tell the story of a state facing a changing world.',
    groups: [
      {
        label: 'Pièces',
        kind: 'coin',
        photoCount: 17,
        photos: [
          { src: 'assets/coin3a.webp', reverse: 'assets/coin3b.webp', alt: 'Large bronze coin of Moulay al-Hassan I with the legend “struck in Paris”.', caption: 'Moulay al-Hassan I · bronze · Paris · AH 1306', text: 'The largest bronze of the series. Its obverse reads ضرب بباريس — struck in Paris.' },
          { src: 'assets/coin4a.webp', reverse: 'assets/coin4b.webp', alt: 'Bronze coin of Moulay al-Hassan I with a border of stars.', caption: 'Moulay al-Hassan I · bronze · Paris · AH 1306', text: 'A border of eight-pointed stars frames the legend; each star is cut slightly differently.' },
          { src: 'assets/coin5a.webp', reverse: 'assets/coin5b.webp', alt: 'Small copper-red bronze coin of Moulay al-Hassan I.', caption: 'Moulay al-Hassan I · bronze · AH 1306', text: 'The smallest bronze in the case, made for everyday change.' },
          { src: 'assets/coin2a.webp', reverse: 'assets/coin2b.webp', alt: 'Darkly patinated coin of Moulay al-Hassan I dated 1310.', caption: 'Moulay al-Hassan I · AH 1310', text: 'Dated 1310 (1892–93); a dark patina has formed over a century of handling.' },
          { src: 'assets/coin1a.webp', reverse: 'assets/coin1b.webp', alt: 'Worn silver coin of Moulay al-Hassan I dated 1311.', caption: 'Moulay al-Hassan I · silver · AH 1311', text: 'Dated 1311 (1893–94), the final year of the reign. The worn rim records years of use.' }
        ],
        descriptionCount: 14,
        descriptions: [
          { title: 'The Hassani reform', text: 'In the 1880s Moulay al-Hassan I set out to give Morocco a unified currency bearing its own name, ordering silver and bronze coins from the most precise mints in Europe.' },
          { title: '“Struck in Paris”', text: 'The obverse of the large bronze reads ضرب بباريس — struck in Paris — announcing without apology where this modern coin was made.' },
          { title: 'The year 1306', text: 'On the reverse, عام ١٣٠٦: the year 1306 of the Hijra, 1888–89 CE, with European numerals set beneath Maghrebi script.' },
          { title: 'Change for the souk', text: 'The smallest bronze of the series was the one that travelled furthest, from palm to palm and stall to stall.' },
          { title: 'The last silver', text: 'Dated 1311 (1893–94), the final year of the reign, this worn silver piece records how quickly a reform becomes simply money.' }
        ]
      },
      { label: 'Billets', kind: 'note', photoCount: 21, photos: [], descriptionCount: 5, descriptions: [] }
    ]
  },
  {
    id: 'independance',
    short: 'Indépendance',
    title: 'De l’indépendance à nos jours',
    from: 'Les premières pièces de l’indépendance',
    to: 'Les pièces commémoratives',
    intro: 'Independence in 1956, the founding of Bank Al-Maghrib in 1959 and the introduction of the dirham in 1960 gave Morocco a fully national currency. Since then, each series of coins and banknotes — and the commemorative pieces struck for great national moments — has written the country’s recent history in metal and paper.',
    groups: [
      { label: 'Pièces courantes', kind: 'coin', photoCount: 24, photos: [], descriptionCount: 5, descriptions: [] },
      { label: 'Billets', kind: 'note', photoCount: 30, photos: [], descriptionCount: 7, descriptions: [] },
      { label: 'Pièces commémoratives', kind: 'coin', photoCount: 30, photos: [], descriptionCount: 1, descriptions: [] }
    ]
  }
];
