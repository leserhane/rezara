/* ==========================================================================
   Numismatic timeline — content
   --------------------------------------------------------------------------
   Every text can be written in four languages: { fr, ar, en, es }.
   A missing language falls back to French, then English. A plain string
   is shown as-is in every language.

   Each phase has one or more groups. In each group:
     photoCount        number of photo slots shown
     photos            the photos you already have, in order:
                         { src, reverse?, alt, caption, text? }
                       (reverse: image of the other side, shown in 3D;
                       text: shown when the photo is enlarged)
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
    short: { fr: 'Origines', ar: 'البدايات', en: 'Origins', es: 'Orígenes' },
    title: { fr: 'Des origines à la naissance de la monnaie', ar: 'من البدايات إلى ميلاد النقود', en: 'From the origins to the birth of coinage', es: 'De los orígenes al nacimiento de la moneda' },
    from: { fr: 'Prémonnaie', ar: 'ما قبل النقود', en: 'Pre-money', es: 'Premoneda' },
    to: { fr: 'Achéménides', ar: 'الأخمينيون', en: 'Achaemenids', es: 'Aqueménidas' },
    intro: {
      fr: 'Bien avant les pièces, la valeur circulait sous forme de grain, de bétail, de coquillages et de métal pesé sur la balance. Les premières vraies monnaies – des pépites d’électrum frappées d’une marque de garantie – apparurent en Lydie au VIIe siècle av. J.-C., et les Achéménides de Perse diffusèrent l’idée dans tout un empire avec leur darique d’or.',
      ar: 'قبل ظهور القطع النقدية بزمن طويل، كانت القيمة تتداول في شكل حبوب وماشية وأصداف ومعادن توزن بالميزان. وظهرت أولى النقود الحقيقية – كتل من الإلكتروم مختومة بعلامة ضمان – في ليديا خلال القرن السابع قبل الميلاد، ثم نشر الأخمينيون الفرس الفكرة عبر إمبراطورية كاملة بدريكهم الذهبي.',
      en: 'Long before coins, value travelled as grain, cattle, shells and metal weighed out on the scale. The first true coins — lumps of electrum stamped with a mark of guarantee — appeared in Lydia in the seventh century BCE, and the Persian Achaemenids carried the idea across an empire with their gold daric.',
      es: 'Mucho antes de las monedas, el valor circulaba como grano, ganado, conchas y metal pesado en la balanza. Las primeras monedas verdaderas –pepitas de electro marcadas con un sello de garantía– aparecieron en Lidia en el siglo VII a. C., y los aqueménidas persas llevaron la idea a todo un imperio con su dárico de oro.'
    },
    groups: [
      {
        photoCount: 6,
        photos: [
          { src: 'assets/collection/premonnaie-1.webp',
            alt: { fr: 'Objet prémonétaire en bronze à quatre bras arrondis.', ar: 'قطعة برونزية من مرحلة ما قبل النقود بأربعة أذرع مستديرة.', en: 'Bronze pre-coinage object with four rounded arms.', es: 'Objeto premonetario de bronce con cuatro brazos redondeados.' },
            caption: { fr: 'Prémonnaie · bronze', ar: 'ما قبل النقود · برونز', en: 'Pre-money · bronze', es: 'Premoneda · bronce' } },
          { src: 'assets/collection/premonnaie-2.webp',
            alt: { fr: 'Petit objet prémonétaire allongé en bronze, à patine verte.', ar: 'قطعة برونزية صغيرة مستطيلة من مرحلة ما قبل النقود بزنجار أخضر.', en: 'Small elongated bronze pre-coinage object with a green patina.', es: 'Pequeño objeto premonetario alargado de bronce, con pátina verde.' },
            caption: { fr: 'Prémonnaie · bronze', ar: 'ما قبل النقود · برونز', en: 'Pre-money · bronze', es: 'Premoneda · bronce' } },
          { src: 'assets/collection/premonnaie-3a.webp', reverse: 'assets/collection/premonnaie-3b.webp',
            alt: { fr: 'Pièce prémonétaire en bronze en forme de bêche, au pied fourchu, à la poignée percée et aux caractères incisés.', ar: 'قطعة برونزية على شكل مِسحاة من مرحلة ما قبل النقود، بقاعدة مشقوقة ومقبض مثقوب ورموز محفورة.', en: 'Spade-shaped bronze pre-coinage piece with a forked foot, a pierced handle and incised characters.', es: 'Pieza premonetaria de bronce en forma de pala, con pie bifurcado, mango perforado y caracteres incisos.' },
            caption: { fr: 'Prémonnaie · bronze', ar: 'ما قبل النقود · برونز', en: 'Pre-money · bronze', es: 'Premoneda · bronce' } },
          { src: 'assets/collection/lydie-statere-b.webp', reverse: 'assets/collection/lydie-statere-a.webp',
            alt: { fr: 'Pièce d’or ovale de Lydie montrant les têtes affrontées d’un lion et d’un taureau.', ar: 'قطعة ذهبية بيضاوية من ليديا تظهر رأسي أسد وثور متقابلين.', en: 'Oval gold coin of Lydia showing the facing heads of a lion and a bull.', es: 'Moneda ovalada de oro de Lidia con las cabezas enfrentadas de un león y un toro.' },
            caption: { fr: 'Lydie · statère d’or · lion et taureau', ar: 'ليديا · ستاتير ذهبي · أسد وثور', en: 'Lydia · gold stater · lion and bull', es: 'Lidia · estátera de oro · león y toro' } },
          { src: 'assets/collection/achemenide-darique-b.webp', reverse: 'assets/collection/achemenide-darique-a.webp',
            alt: { fr: 'Pièce d’or achéménide montrant le roi perse courant, arc et lance en main.', ar: 'قطعة ذهبية أخمينية تُظهر الملك الفارسي يعدو حاملاً قوساً ورمحاً.', en: 'Gold Achaemenid coin showing the Persian king running with bow and spear.', es: 'Moneda de oro aqueménida con el rey persa corriendo con arco y lanza.' },
            caption: { fr: 'Perse achéménide · darique d’or · le roi archer', ar: 'فارس الأخمينية · دريك ذهبي · الملك الرامي', en: 'Achaemenid Persia · gold daric · the king as archer', es: 'Persia aqueménida · dárico de oro · el rey arquero' } }
        ],
        descriptionCount: 3,
        descriptions: []
      }
    ]
  },
  {
    id: 'antique',
    short: { fr: 'Antiquité', ar: 'العصور القديمة', en: 'Antiquity', es: 'Antigüedad' },
    title: { fr: 'Le monnayage antique', ar: 'النقود في العصور القديمة', en: 'Ancient coinage', es: 'La moneda antigua' },
    from: { fr: 'Grèce', ar: 'اليونان', en: 'Greece', es: 'Grecia' },
    to: { fr: 'Sassanides', ar: 'الساسانيون', en: 'Sasanians', es: 'Sasánidas' },
    intro: {
      fr: 'Des chouettes d’argent d’Athènes aux monnaies de Carthage, de Numidie et de Maurétanie, jusqu’à Rome, Byzance et la Perse sassanide, l’Antiquité fit de la monnaie un portrait du pouvoir : le visage d’un souverain, l’emblème d’une cité, passés de main en main autour de la Méditerranée.',
      ar: 'من البوم الفضي لأثينا إلى نقود قرطاج ونوميديا وموريطانيا، ثم روما وبيزنطة وفارس الساسانية، جعلت العصور القديمة من النقود صورةً للسلطة: وجه حاكم أو شعار مدينة، يتنقّل من يد إلى يد حول البحر الأبيض المتوسط.',
      en: 'From the silver owls of Athens to the coins of Carthage, Numidia and Mauretania, and on to Rome, Byzantium and Sassanid Persia, antiquity made money a portrait of power: a ruler’s face, a city’s emblem, carried hand to hand across the Mediterranean.',
      es: 'De las lechuzas de plata de Atenas a las monedas de Cartago, Numidia y Mauritania, y hasta Roma, Bizancio y la Persia sasánida, la Antigüedad hizo del dinero un retrato del poder: el rostro de un soberano, el emblema de una ciudad, pasando de mano en mano por el Mediterráneo.'
    },
    groups: [
      {
        photoCount: 12,
        photos: [
          { src: 'assets/collection/antique-owl-a.webp', reverse: 'assets/collection/antique-owl-b.webp',
            alt: { fr: 'Pièce sombre de type athénien avec la tête d’Athéna et, au revers, une chouette.', ar: 'قطعة داكنة من الطراز الأثيني برأس أثينا، وعلى ظهرها بومة.', en: 'Dark coin of Athenian type with the head of Athena and, on the other side, an owl.', es: 'Moneda oscura de tipo ateniense con la cabeza de Atenea y, en el reverso, una lechuza.' },
            caption: { fr: 'Type athénien · tête d’Athéna / chouette', ar: 'طراز أثيني · رأس أثينا / بومة', en: 'Athenian type · head of Athena / owl', es: 'Tipo ateniense · cabeza de Atenea / lechuza' } },
          { src: 'assets/collection/antique-carthage-a.webp', reverse: 'assets/collection/antique-carthage-b.webp',
            alt: { fr: 'Pièce d’or de Carthage avec la tête de la déesse Tanit et, au revers, un cheval debout.', ar: 'قطعة ذهبية من قرطاج برأس الإلهة تانيت، وعلى ظهرها حصان واقف.', en: 'Gold coin of Carthage with the head of the goddess Tanit and, on the other side, a standing horse.', es: 'Moneda de oro de Cartago con la cabeza de la diosa Tanit y, en el reverso, un caballo en pie.' },
            caption: { fr: 'Carthage · statère d’or · tête de Tanit / cheval', ar: 'قرطاج · ستاتير ذهبي · رأس تانيت / حصان', en: 'Carthage · gold stater · head of Tanit / horse', es: 'Cartago · estátera de oro · cabeza de Tanit / caballo' } },
          { src: 'assets/collection/antique-rome-a.webp', reverse: 'assets/collection/antique-rome-b.webp',
            alt: { fr: 'Pièce d’or romaine avec le buste lauré de Caracalla et, au revers, une déesse chevauchant un lion.', ar: 'قطعة ذهبية رومانية بتمثال نصفي مكلّل لكاراكلا، وعلى ظهرها إلهة تمتطي أسداً.', en: 'Gold Roman coin with the laureate bust of Caracalla and, on the other side, a goddess riding a lion.', es: 'Moneda de oro romana con el busto laureado de Caracalla y, en el reverso, una diosa a lomos de un león.' },
            caption: { fr: 'Rome · aureus d’or · Caracalla', ar: 'روما · أوريوس ذهبي · كاراكلا', en: 'Rome · gold aureus · Caracalla', es: 'Roma · áureo de oro · Caracalla' },
            text: {
              fr: 'Avers : ANTONINVS PIVS AVG. Revers : INDVLGENTIA AVGG IN CARTH – la déesse Caelestis chevauchant un lion, célébrant la faveur des empereurs envers Carthage.',
              ar: 'الوجه: ANTONINVS PIVS AVG. الظهر: INDVLGENTIA AVGG IN CARTH – الإلهة كايليستيس تمتطي أسداً، احتفاءً بعطف الإمبراطورين على قرطاج.',
              en: 'Obverse: ANTONINVS PIVS AVG. Reverse: INDVLGENTIA AVGG IN CARTH — the goddess Caelestis riding a lion, celebrating the emperors’ favour to Carthage.',
              es: 'Anverso: ANTONINVS PIVS AVG. Reverso: INDVLGENTIA AVGG IN CARTH: la diosa Caelestis a lomos de un león, celebrando el favor de los emperadores hacia Cartago.'
            } }
        ],
        descriptionCount: 12,
        descriptions: []
      }
    ]
  },
  {
    id: 'arabo-musulmane',
    short: { fr: 'Arabo-musulmane', ar: 'العربية الإسلامية', en: 'Arab-Islamic', es: 'Arabo-islámica' },
    title: { fr: 'Création de la monnaie arabo-musulmane', ar: 'نشأة النقود العربية الإسلامية', en: 'The creation of Arab-Islamic coinage', es: 'La creación de la moneda arabo-islámica' },
    from: { fr: 'Omeyyades', ar: 'الأمويون', en: 'Umayyads', es: 'Omeyas' },
    to: { fr: 'Abbassides', ar: 'العباسيون', en: 'Abbasids', es: 'Abasíes' },
    intro: {
      fr: 'À la fin du VIIe siècle, le calife omeyyade ʿAbd al-Malik remplaça les modèles byzantins et perses par un monnayage fait de mots seulement : un dinar d’or et un dirham d’argent ne portant que des inscriptions. Les Abbassides diffusèrent ce modèle de l’Asie centrale à l’Atlantique.',
      ar: 'في أواخر القرن السابع الميلادي، استبدل الخليفة الأموي عبد الملك بن مروان النماذج البيزنطية والفارسية بنقود قوامها الكتابة وحدها: دينار من ذهب ودرهم من فضة لا يحملان سوى النقوش. ونشر العباسيون هذا النموذج من آسيا الوسطى إلى المحيط الأطلسي.',
      en: 'At the end of the seventh century the Umayyad caliph ʿAbd al-Malik replaced borrowed Byzantine and Persian designs with a new coinage of words alone: a gold dinar and a silver dirham carrying only inscriptions. The Abbasids spread this model from Central Asia to the Atlantic.',
      es: 'A finales del siglo VII, el califa omeya ʿAbd al-Malik sustituyó los modelos bizantinos y persas por una moneda hecha solo de palabras: un dinar de oro y un dírham de plata que únicamente llevaban inscripciones. Los abasíes difundieron este modelo de Asia central al Atlántico.'
    },
    groups: [
      { photoCount: 4, photos: [], descriptionCount: 4, descriptions: [] }
    ]
  },
  {
    id: 'idrissides',
    short: { fr: 'Idrissides', ar: 'الأدارسة', en: 'Idrisids', es: 'Idrisíes' },
    title: { fr: 'Naissance d’un État musulman au Maroc', ar: 'نشأة دولة إسلامية بالمغرب', en: 'The birth of a Muslim state in Morocco', es: 'El nacimiento de un Estado musulmán en Marruecos' },
    from: { fr: 'Idrissides', ar: 'الأدارسة', en: 'Idrisids', es: 'Idrisíes' },
    to: { fr: 'Hammoudides', ar: 'الحموديون', en: 'Hammudids', es: 'Hammudíes' },
    intro: {
      fr: 'Avec Idris Ier, en 788, le Maroc se dota de son premier État musulman – et de ses propres ateliers monétaires. Les dirhams d’argent idrissides frappés à Walila, à Fès et dans d’autres villes affirmaient une souveraineté nouvelle, une lignée prolongée jusqu’au XIe siècle par leurs descendants hammoudides.',
      ar: 'مع إدريس الأول سنة 788م، قامت بالمغرب أول دولة إسلامية – ومعها دور سكّها الخاصة. وكانت الدراهم الفضية الإدريسية المضروبة في وليلي وفاس ومدن أخرى إعلاناً لسيادة جديدة، امتدّ نسبها إلى القرن الحادي عشر مع أحفادهم الحموديين.',
      en: 'With Idris I in 788, Morocco gained its first Muslim state — and its own mints. Idrisid silver dirhams struck at Walila, Fès and other cities announced a new sovereignty, a lineage continued into the eleventh century by their Hammudid descendants.',
      es: 'Con Idris I, en 788, Marruecos tuvo su primer Estado musulmán, y sus propias cecas. Los dírhams de plata idrisíes acuñados en Walila, Fez y otras ciudades proclamaban una nueva soberanía, un linaje prolongado hasta el siglo XI por sus descendientes hammudíes.'
    },
    groups: [
      { photoCount: 4, photos: [], descriptionCount: 4, descriptions: [] }
    ]
  },
  {
    id: 'or',
    short: { fr: 'Empires de l’or', ar: 'إمبراطوريات الذهب', en: 'Empires of gold', es: 'Imperios del oro' },
    title: { fr: 'Les grands empires de l’or', ar: 'إمبراطوريات الذهب الكبرى', en: 'The great empires of gold', es: 'Los grandes imperios del oro' },
    from: { fr: 'Almoravides', ar: 'المرابطون', en: 'Almoravids', es: 'Almorávides' },
    to: { fr: 'Wattassides', ar: 'الوطاسيون', en: 'Wattasids', es: 'Wattásidas' },
    intro: {
      fr: 'Nourri par les routes transsahariennes de l’or, le dinar almoravide devint l’une des monnaies les plus recherchées de la Méditerranée médiévale. Les Almohades suivirent avec leur dirham carré caractéristique, et les Mérinides puis les Wattassides prolongèrent cette tradition de l’or et de l’argent fins jusqu’au seuil des temps modernes.',
      ar: 'بفضل طرق الذهب العابرة للصحراء، أصبح الدينار المرابطي من أكثر النقود ثقةً في حوض المتوسط خلال العصر الوسيط. ثم جاء الموحدون بدرهمهم المربّع المميّز، وواصل المرينيون والوطاسيون تقليد الذهب والفضة الخالصين إلى مشارف العصر الحديث.',
      en: 'Fed by the trans-Saharan gold routes, the Almoravid dinar became one of the most trusted coins of the medieval Mediterranean. The Almohads followed with their distinctive square dirham, and the Merinid and Wattasid dynasties carried this tradition of fine gold and silver to the threshold of the modern age.',
      es: 'Alimentado por las rutas transaharianas del oro, el dinar almorávide se convirtió en una de las monedas más apreciadas del Mediterráneo medieval. Los almohades siguieron con su característico dírham cuadrado, y los benimerines y wattásidas prolongaron esta tradición de oro y plata finos hasta el umbral de la Edad Moderna.'
    },
    groups: [
      { photoCount: 7, photos: [], descriptionCount: 7, descriptions: [] }
    ]
  },
  {
    id: 'cherifiens',
    short: { fr: 'Chérifiens', ar: 'الشرفاء', en: 'Sharifian', es: 'Jerifianos' },
    title: { fr: 'Les empires chérifiens', ar: 'الدول الشريفة', en: 'The Sharifian empires', es: 'Los imperios jerifianos' },
    from: { fr: 'Saâdiens', ar: 'السعديون', en: 'Saadians', es: 'Saadíes' },
    to: { fr: 'Émissions du protectorat', ar: 'إصدارات عهد الحماية', en: 'Protectorate issues', es: 'Emisiones del protectorado' },
    intro: {
      fr: 'L’or saadien, les longs règnes alaouites, la tentative de Moulay al-Hassan Ier de créer une monnaie nationale moderne, les premiers billets de la Banque d’État du Maroc créée en 1907, puis les émissions du protectorat : quatre siècles où pièces et billets racontent un État face à un monde qui change.',
      ar: 'ذهب السعديين، والعهود العلوية الطويلة، ومحاولة مولاي الحسن الأول إرساء عملة وطنية حديثة، وأولى أوراق بنك الدولة المغربية الذي أُسّس سنة 1907، ثم إصدارات عهد الحماية: أربعة قرون تروي فيها القطع والأوراق النقدية قصة دولة في مواجهة عالم متغيّر.',
      en: 'Saadian gold, the long Alaouite reigns, Moulay al-Hassan I’s attempt at a modern national currency, the first banknotes of the Banque d’État du Maroc created in 1907, and the issues of the protectorate: four centuries in which coin and paper tell the story of a state facing a changing world.',
      es: 'El oro saadí, los largos reinados alauíes, el intento de Mulay al-Hasan I de crear una moneda nacional moderna, los primeros billetes de la Banque d’État du Maroc fundada en 1907 y las emisiones del protectorado: cuatro siglos en los que monedas y billetes cuentan la historia de un Estado ante un mundo cambiante.'
    },
    groups: [
      {
        label: { fr: 'Pièces', ar: 'القطع النقدية', en: 'Coins', es: 'Monedas' },
        kind: 'coin',
        photoCount: 17,
        photos: [
          { src: 'assets/coin3a.webp', reverse: 'assets/coin3b.webp',
            alt: { fr: 'Grand bronze de Moulay al-Hassan Ier portant la légende « frappé à Paris ».', ar: 'قطعة برونزية كبيرة لمولاي الحسن الأول تحمل عبارة «ضُرب بباريس».', en: 'Large bronze coin of Moulay al-Hassan I with the legend “struck in Paris”.', es: 'Gran moneda de bronce de Mulay al-Hasan I con la leyenda «acuñado en París».' },
            caption: { fr: 'Moulay al-Hassan Ier · bronze · Paris · 1306 H.', ar: 'مولاي الحسن الأول · برونز · باريس · 1306 هـ', en: 'Moulay al-Hassan I · bronze · Paris · AH 1306', es: 'Mulay al-Hasan I · bronce · París · 1306 H.' },
            text: { fr: 'Le plus grand bronze de la série. Son avers porte ضرب بباريس – frappé à Paris.', ar: 'أكبر قطعة برونزية في السلسلة، وعلى وجهها عبارة «ضرب بباريس».', en: 'The largest bronze of the series. Its obverse reads ضرب بباريس — struck in Paris.', es: 'El bronce más grande de la serie. Su anverso dice ضرب بباريس: acuñado en París.' } },
          { src: 'assets/coin4a.webp', reverse: 'assets/coin4b.webp',
            alt: { fr: 'Bronze de Moulay al-Hassan Ier à bordure d’étoiles.', ar: 'قطعة برونزية لمولاي الحسن الأول بإطار من النجوم.', en: 'Bronze coin of Moulay al-Hassan I with a border of stars.', es: 'Moneda de bronce de Mulay al-Hasan I con una orla de estrellas.' },
            caption: { fr: 'Moulay al-Hassan Ier · bronze · Paris · 1306 H.', ar: 'مولاي الحسن الأول · برونز · باريس · 1306 هـ', en: 'Moulay al-Hassan I · bronze · Paris · AH 1306', es: 'Mulay al-Hasan I · bronce · París · 1306 H.' },
            text: { fr: 'Une bordure d’étoiles à huit branches encadre la légende ; chaque étoile est taillée un peu différemment.', ar: 'إطار من النجوم الثمانية يحيط بالكتابة، وكل نجمة منحوتة بشكل مختلف قليلاً.', en: 'A border of eight-pointed stars frames the legend; each star is cut slightly differently.', es: 'Una orla de estrellas de ocho puntas enmarca la leyenda; cada estrella está tallada de forma algo distinta.' } },
          { src: 'assets/coin5a.webp', reverse: 'assets/coin5b.webp',
            alt: { fr: 'Petit bronze rouge cuivré de Moulay al-Hassan Ier.', ar: 'قطعة برونزية صغيرة نحاسية الحمرة لمولاي الحسن الأول.', en: 'Small copper-red bronze coin of Moulay al-Hassan I.', es: 'Pequeña moneda de bronce rojo cobrizo de Mulay al-Hasan I.' },
            caption: { fr: 'Moulay al-Hassan Ier · bronze · 1306 H.', ar: 'مولاي الحسن الأول · برونز · 1306 هـ', en: 'Moulay al-Hassan I · bronze · AH 1306', es: 'Mulay al-Hasan I · bronce · 1306 H.' },
            text: { fr: 'Le plus petit bronze de la vitrine, fait pour la monnaie de tous les jours.', ar: 'أصغر قطعة برونزية في الواجهة، صُنعت للصرف اليومي.', en: 'The smallest bronze in the case, made for everyday change.', es: 'El bronce más pequeño de la vitrina, hecho para el cambio diario.' } },
          { src: 'assets/coin2a.webp', reverse: 'assets/coin2b.webp',
            alt: { fr: 'Pièce de Moulay al-Hassan Ier à patine sombre, datée de 1310.', ar: 'قطعة لمولاي الحسن الأول بزنجار داكن، مؤرّخة بعام 1310.', en: 'Darkly patinated coin of Moulay al-Hassan I dated 1310.', es: 'Moneda de Mulay al-Hasan I con pátina oscura, fechada en 1310.' },
            caption: { fr: 'Moulay al-Hassan Ier · 1310 H.', ar: 'مولاي الحسن الأول · 1310 هـ', en: 'Moulay al-Hassan I · AH 1310', es: 'Mulay al-Hasan I · 1310 H.' },
            text: { fr: 'Datée de 1310 (1892-1893) ; une patine sombre s’est formée au fil d’un siècle de manipulations.', ar: 'مؤرّخة بعام 1310 (1892–1893)، وقد تكوّن عليها زنجار داكن عبر قرن من التداول.', en: 'Dated 1310 (1892–93); a dark patina has formed over a century of handling.', es: 'Fechada en 1310 (1892-1893); una pátina oscura se ha formado tras un siglo de manipulación.' } },
          { src: 'assets/coin1a.webp', reverse: 'assets/coin1b.webp',
            alt: { fr: 'Pièce d’argent usée de Moulay al-Hassan Ier, datée de 1311.', ar: 'قطعة فضية بالية لمولاي الحسن الأول، مؤرّخة بعام 1311.', en: 'Worn silver coin of Moulay al-Hassan I dated 1311.', es: 'Moneda de plata gastada de Mulay al-Hasan I, fechada en 1311.' },
            caption: { fr: 'Moulay al-Hassan Ier · argent · 1311 H.', ar: 'مولاي الحسن الأول · فضة · 1311 هـ', en: 'Moulay al-Hassan I · silver · AH 1311', es: 'Mulay al-Hasan I · plata · 1311 H.' },
            text: { fr: 'Datée de 1311 (1893-1894), dernière année du règne. Le bord usé garde la trace des années d’usage.', ar: 'مؤرّخة بعام 1311 (1893–1894)، آخر سنة من العهد. وحافّتها البالية تحفظ أثر سنوات التداول.', en: 'Dated 1311 (1893–94), the final year of the reign. The worn rim records years of use.', es: 'Fechada en 1311 (1893-1894), último año del reinado. El borde gastado guarda la huella de años de uso.' } }
        ],
        descriptionCount: 14,
        descriptions: [
          { title: { fr: 'La réforme hassanienne', ar: 'الإصلاح الحسني', en: 'The Hassani reform', es: 'La reforma hasaní' },
            text: { fr: 'Dans les années 1880, Moulay al-Hassan Ier voulut doter le Maroc d’une monnaie unifiée portant son propre nom, et commanda des pièces d’argent et de bronze aux ateliers les plus précis d’Europe.', ar: 'في ثمانينيات القرن التاسع عشر، سعى مولاي الحسن الأول إلى منح المغرب عملة موحّدة تحمل اسمه، فطلب قطعاً من الفضة والبرونز من أدقّ دور السكّ في أوروبا.', en: 'In the 1880s Moulay al-Hassan I set out to give Morocco a unified currency bearing its own name, ordering silver and bronze coins from the most precise mints in Europe.', es: 'En la década de 1880, Mulay al-Hasan I quiso dotar a Marruecos de una moneda unificada con su propio nombre y encargó piezas de plata y bronce a las cecas más precisas de Europa.' } },
          { title: { fr: '« Frappé à Paris »', ar: '«ضُرب بباريس»', en: '“Struck in Paris”', es: '«Acuñado en París»' },
            text: { fr: 'L’avers du grand bronze porte ضرب بباريس – frappé à Paris –, annonçant sans détour où cette monnaie moderne a été fabriquée.', ar: 'يحمل وجه القطعة البرونزية الكبرى عبارة «ضرب بباريس»، معلناً دون تحفّظ مكان صنع هذه العملة الحديثة.', en: 'The obverse of the large bronze reads ضرب بباريس — struck in Paris — announcing without apology where this modern coin was made.', es: 'El anverso del gran bronce dice ضرب بباريس –acuñado en París–, anunciando sin rodeos dónde se fabricó esta moneda moderna.' } },
          { title: { fr: 'L’an 1306', ar: 'عام 1306', en: 'The year 1306', es: 'El año 1306' },
            text: { fr: 'Au revers, عام ١٣٠٦ : l’an 1306 de l’Hégire, 1888-1889 de notre ère, avec des chiffres européens sous l’écriture maghrébine.', ar: 'على الظهر: «عام ١٣٠٦» للهجرة، أي 1888–1889 للميلاد، بأرقام أوروبية تحت الخط المغربي.', en: 'On the reverse, عام ١٣٠٦: the year 1306 of the Hijra, 1888–89 CE, with European numerals set beneath Maghrebi script.', es: 'En el reverso, عام ١٣٠٦: el año 1306 de la Hégira, 1888-1889 d. C., con cifras europeas bajo la escritura magrebí.' } },
          { title: { fr: 'La monnaie du souk', ar: 'صرف السوق', en: 'Change for the souk', es: 'Cambio para el zoco' },
            text: { fr: 'Le plus petit bronze de la série est celui qui a le plus voyagé, de main en main et d’étal en étal.', ar: 'أصغر قطعة برونزية في السلسلة هي التي سافرت أبعد، من يد إلى يد ومن دكّان إلى دكّان.', en: 'The smallest bronze of the series was the one that travelled furthest, from palm to palm and stall to stall.', es: 'El bronce más pequeño de la serie fue el que más viajó, de mano en mano y de puesto en puesto.' } },
          { title: { fr: 'Le dernier argent', ar: 'آخر الفضّة', en: 'The last silver', es: 'La última plata' },
            text: { fr: 'Datée de 1311 (1893-1894), dernière année du règne, cette pièce d’argent usée montre à quelle vitesse une réforme devient simplement de la monnaie.', ar: 'تحمل هذه القطعة الفضية البالية تاريخ 1311 (1893–1894)، آخر سنة من العهد، وتشهد على سرعة تحوّل الإصلاح إلى مجرّد نقود.', en: 'Dated 1311 (1893–94), the final year of the reign, this worn silver piece records how quickly a reform becomes simply money.', es: 'Fechada en 1311 (1893-1894), último año del reinado, esta gastada pieza de plata muestra lo rápido que una reforma se convierte simplemente en dinero.' } }
        ]
      },
      { label: { fr: 'Billets', ar: 'الأوراق النقدية', en: 'Banknotes', es: 'Billetes' }, kind: 'note', photoCount: 21, photos: [], descriptionCount: 5, descriptions: [] }
    ]
  },
  {
    id: 'independance',
    short: { fr: 'Indépendance', ar: 'الاستقلال', en: 'Independence', es: 'Independencia' },
    title: { fr: 'De l’indépendance à nos jours', ar: 'من الاستقلال إلى اليوم', en: 'From independence to the present day', es: 'De la independencia a nuestros días' },
    from: { fr: 'Les premières pièces de l’indépendance', ar: 'أولى قطع الاستقلال', en: 'The first coins of independence', es: 'Las primeras monedas de la independencia' },
    to: { fr: 'Les pièces commémoratives', ar: 'القطع التذكارية', en: 'Commemorative coins', es: 'Las monedas conmemorativas' },
    intro: {
      fr: 'L’indépendance en 1956, la création de Bank Al-Maghrib en 1959 et l’introduction du dirham en 1960 ont donné au Maroc une monnaie pleinement nationale. Depuis, chaque série de pièces et de billets – et les pièces commémoratives frappées pour les grands moments de la nation – écrit l’histoire récente du pays dans le métal et le papier.',
      ar: 'منح الاستقلال سنة 1956، وتأسيس بنك المغرب سنة 1959، واعتماد الدرهم سنة 1960، المغربَ عملةً وطنية كاملة. ومنذ ذلك الحين، تكتب كل سلسلة من القطع والأوراق النقدية – والقطع التذكارية المسكوكة لأبرز لحظات الأمة – التاريخ الحديث للبلاد في المعدن والورق.',
      en: 'Independence in 1956, the founding of Bank Al-Maghrib in 1959 and the introduction of the dirham in 1960 gave Morocco a fully national currency. Since then, each series of coins and banknotes — and the commemorative pieces struck for great national moments — has written the country’s recent history in metal and paper.',
      es: 'La independencia en 1956, la fundación de Bank Al-Maghrib en 1959 y la introducción del dírham en 1960 dieron a Marruecos una moneda plenamente nacional. Desde entonces, cada serie de monedas y billetes –y las piezas conmemorativas acuñadas para los grandes momentos de la nación– escribe la historia reciente del país en metal y papel.'
    },
    groups: [
      { label: { fr: 'Pièces courantes', ar: 'القطع المتداولة', en: 'Circulating coins', es: 'Monedas en circulación' }, kind: 'coin', photoCount: 24, photos: [], descriptionCount: 5, descriptions: [] },
      { label: { fr: 'Billets', ar: 'الأوراق النقدية', en: 'Banknotes', es: 'Billetes' }, kind: 'note', photoCount: 30, photos: [], descriptionCount: 7, descriptions: [] },
      { label: { fr: 'Pièces commémoratives', ar: 'القطع التذكارية', en: 'Commemorative coins', es: 'Monedas conmemorativas' }, kind: 'coin', photoCount: 30, photos: [], descriptionCount: 1, descriptions: [] }
    ]
  }
];
