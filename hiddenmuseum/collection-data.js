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

/* ==========================================================================
   Boutique — commemorative coins shelf
   --------------------------------------------------------------------------
   Same photo format as the timeline: { src, reverse?, alt, caption, text? }.
   src is the obverse (portrait side); reverse is the commemorative design.
   cover: true shows a photo (e.g. a box set) filling its frame.
   Add a coin by putting its images in assets/boutique/ and adding an entry.
   ========================================================================== */
window.BAM_SHOP_COINS = [
  {
    "src": "assets/boutique/independance-1975-a.webp",
    "reverse": "assets/boutique/independance-1975-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 50 dirhams de 1975 : portrait de Hassan II et, au revers, les armoiries du Royaume.",
      "ar": "قطعة فضية من فئة 50 درهماً لسنة 1975: صورة الحسن الثاني، وعلى الظهر شعار المملكة.",
      "en": "Silver 50 dirham coin of 1975: portrait of Hassan II and, on the reverse, the arms of the Kingdom.",
      "es": "Moneda de plata de 50 dírhams de 1975: retrato de Hasán II y, en el reverso, el escudo del Reino."
    },
    "caption": {
      "fr": "20e anniversaire de l’Indépendance · 50 dirhams · 1975 / 1395 H.",
      "ar": "الذكرى العشرون للاستقلال · 50 درهماً · 1975 / 1395 هـ",
      "en": "20th anniversary of Independence · 50 dirhams · 1975 / AH 1395",
      "es": "XX aniversario de la Independencia · 50 dírhams · 1975 / 1395 H."
    }
  },
  {
    "src": "assets/boutique/marche-verte-1976-a.webp",
    "reverse": "assets/boutique/marche-verte-1976-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 50 dirhams de 1976 : portrait de Hassan II et, au revers, des mains portant des drapeaux.",
      "ar": "قطعة فضية من فئة 50 درهماً لسنة 1976: صورة الحسن الثاني، وعلى الظهر أيادٍ تحمل الأعلام.",
      "en": "Silver 50 dirham coin of 1976: portrait of Hassan II and, on the reverse, hands carrying flags.",
      "es": "Moneda de plata de 50 dírhams de 1976: retrato de Hasán II y, en el reverso, manos que portan banderas."
    },
    "caption": {
      "fr": "Marche verte · 50 dirhams · 1976 / 1396 H.",
      "ar": "المسيرة الخضراء · 50 درهماً · 1976 / 1396 هـ",
      "en": "Green March · 50 dirhams · 1976 / AH 1396",
      "es": "Marcha Verde · 50 dírhams · 1976 / 1396 H."
    }
  },
  {
    "src": "assets/boutique/hassan2-1980-a.webp",
    "reverse": "assets/boutique/hassan2-1980-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 150 dirhams de 1980 : portrait de Hassan II et, au revers, une mosquée et la Kaaba.",
      "ar": "قطعة فضية من فئة 150 درهماً لسنة 1980: صورة الحسن الثاني، وعلى الظهر مسجد والكعبة.",
      "en": "Silver 150 dirham coin of 1980: portrait of Hassan II and, on the reverse, a mosque and the Kaaba.",
      "es": "Moneda de plata de 150 dírhams de 1980: retrato de Hasán II y, en el reverso, una mezquita y la Kaaba."
    },
    "caption": {
      "fr": "Hassan II · 150 dirhams · 1980 / 1401 H.",
      "ar": "الحسن الثاني · 150 درهماً · 1980 / 1401 هـ",
      "en": "Hassan II · 150 dirhams · 1980 / AH 1401",
      "es": "Hasán II · 150 dírhams · 1980 / 1401 H."
    }
  },
  {
    "src": "assets/boutique/jeux-med-1983-a.webp",
    "reverse": "assets/boutique/jeux-med-1983-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 100 dirhams de 1983 : portrait de Hassan II et, au revers, trois anneaux au-dessus des vagues.",
      "ar": "قطعة فضية من فئة 100 درهم لسنة 1983: صورة الحسن الثاني، وعلى الظهر ثلاث حلقات فوق الأمواج.",
      "en": "Silver 100 dirham coin of 1983: portrait of Hassan II and, on the reverse, three rings above waves.",
      "es": "Moneda de plata de 100 dírhams de 1983: retrato de Hasán II y, en el reverso, tres anillos sobre las olas."
    },
    "caption": {
      "fr": "9es Jeux méditerranéens · 100 dirhams · 1983 / 1403 H.",
      "ar": "الدورة التاسعة لألعاب البحر الأبيض المتوسط · 100 درهم · 1983 / 1403 هـ",
      "en": "9th Mediterranean Games · 100 dirhams · 1983 / AH 1403",
      "es": "IX Juegos Mediterráneos · 100 dírhams · 1983 / 1403 H."
    }
  },
  {
    "src": "assets/boutique/amitie-maroc-usa-1987-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 200 dirhams de 1987 aux drapeaux marocain et américain croisés.",
      "ar": "قطعة فضية من فئة 200 درهم لسنة 1987 تحمل العلمين المغربي والأمريكي متقاطعين.",
      "en": "Silver 200 dirham coin of 1987 with the crossed flags of Morocco and the United States.",
      "es": "Moneda de plata de 200 dírhams de 1987 con las banderas cruzadas de Marruecos y Estados Unidos."
    },
    "caption": {
      "fr": "Traité d’amitié maroco-américain 1787–1987 · 200 dirhams · 1987 / 1408 H.",
      "ar": "معاهدة الصداقة المغربية الأمريكية 1787–1987 · 200 درهم · 1987 / 1408 هـ",
      "en": "Moroccan-American Friendship Treaty 1787–1987 · 200 dirhams · 1987 / AH 1408",
      "es": "Tratado de amistad marroquí-estadounidense 1787-1987 · 200 dírhams · 1987 / 1408 H."
    }
  },
  {
    "src": "assets/boutique/francophonie-1989-a.webp",
    "reverse": "assets/boutique/francophonie-1989-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 200 dirhams de 1989 : portrait de Hassan II et, au revers, l’emblème des premiers Jeux de la Francophonie.",
      "ar": "قطعة فضية من فئة 200 درهم لسنة 1989: صورة الحسن الثاني، وعلى الظهر شعار الألعاب الفرنكوفونية الأولى.",
      "en": "Silver 200 dirham coin of 1989: portrait of Hassan II and, on the reverse, the emblem of the first Jeux de la Francophonie.",
      "es": "Moneda de plata de 200 dírhams de 1989: retrato de Hasán II y, en el reverso, el emblema de los primeros Juegos de la Francofonía."
    },
    "caption": {
      "fr": "1ers Jeux de la Francophonie · 200 dirhams · 1989 / 1409 H.",
      "ar": "الألعاب الفرنكوفونية الأولى · 200 درهم · 1989 / 1409 هـ",
      "en": "1st Jeux de la Francophonie · 200 dirhams · 1989 / AH 1409",
      "es": "I Juegos de la Francofonía · 200 dírhams · 1989 / 1409 H."
    }
  },
  {
    "src": "assets/boutique/rabat-1995-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 200 dirhams de 1995 montrant la tour Hassan et le mausolée Mohammed V à Rabat.",
      "ar": "قطعة فضية من فئة 200 درهم لسنة 1995 تُظهر صومعة حسان وضريح محمد الخامس بالرباط.",
      "en": "Silver 200 dirham coin of 1995 showing the Hassan Tower and the Mausoleum of Mohammed V in Rabat.",
      "es": "Moneda de plata de 200 dírhams de 1995 con la torre Hasán y el mausoleo de Mohammed V en Rabat."
    },
    "caption": {
      "fr": "8e centenaire de la ville de Rabat · 200 dirhams · 1995 / 1416 H.",
      "ar": "الذكرى المئوية الثامنة لمدينة الرباط · 200 درهم · 1995 / 1416 هـ",
      "en": "8th centenary of the city of Rabat · 200 dirhams · 1995 / AH 1416",
      "es": "VIII centenario de la ciudad de Rabat · 200 dírhams · 1995 / 1416 H."
    }
  },
  {
    "src": "assets/boutique/fes-2008-a.webp",
    "reverse": "assets/boutique/fes-2008-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 250 dirhams de 2008 : portrait de Mohammed VI et, au revers, la ville de Fès sous un soleil levant.",
      "ar": "قطعة فضية من فئة 250 درهماً لسنة 2008: صورة محمد السادس، وعلى الظهر مدينة فاس تحت شمس مشرقة.",
      "en": "Silver 250 dirham coin of 2008: portrait of Mohammed VI and, on the reverse, the city of Fès beneath a rising sun.",
      "es": "Moneda de plata de 250 dírhams de 2008: retrato de Mohammed VI y, en el reverso, la ciudad de Fez bajo un sol naciente."
    },
    "caption": {
      "fr": "12 siècles d’histoire du Royaume · Fondation de Fès en 808 · 250 dirhams · 2008 / 1429 H.",
      "ar": "12 قرناً من تاريخ المملكة · تأسيس مدينة فاس سنة 808 · 250 درهماً · 2008 / 1429 هـ",
      "en": "12 centuries of the Kingdom’s history · Founding of Fès in 808 · 250 dirhams · 2008 / AH 1429",
      "es": "12 siglos de historia del Reino · Fundación de Fez en 808 · 250 dírhams · 2008 / 1429 H."
    }
  },
  {
    "src": "assets/boutique/bam-50ans-2009-a.webp",
    "reverse": "assets/boutique/bam-50ans-2009-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 250 dirhams de 2009 : portrait de Mohammed VI et, au revers, le siège de Bank Al-Maghrib.",
      "ar": "قطعة فضية من فئة 250 درهماً لسنة 2009: صورة محمد السادس، وعلى الظهر مقر بنك المغرب.",
      "en": "Silver 250 dirham coin of 2009: portrait of Mohammed VI and, on the reverse, the Bank Al-Maghrib headquarters.",
      "es": "Moneda de plata de 250 dírhams de 2009: retrato de Mohammed VI y, en el reverso, la sede de Bank Al-Maghrib."
    },
    "caption": {
      "fr": "50e anniversaire de la création de Bank Al-Maghrib · 250 dirhams · 2009 / 1430 H.",
      "ar": "الذكرى الخمسون لتأسيس بنك المغرب · 250 درهماً · 2009 / 1430 هـ",
      "en": "50th anniversary of Bank Al-Maghrib · 250 dirhams · 2009 / AH 1430",
      "es": "50.º aniversario de Bank Al-Maghrib · 250 dírhams · 2009 / 1430 H."
    }
  },
  {
    "src": "assets/boutique/m6-2011-a.webp",
    "reverse": "assets/boutique/m6-2011-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 250 dirhams de 2011 : portrait de Mohammed VI et, au revers, un monument sous les armoiries du Royaume.",
      "ar": "قطعة فضية من فئة 250 درهماً لسنة 2011: صورة محمد السادس، وعلى الظهر معلمة تحت شعار المملكة.",
      "en": "Silver 250 dirham coin of 2011: portrait of Mohammed VI and, on the reverse, a monument beneath the arms of the Kingdom.",
      "es": "Moneda de plata de 250 dírhams de 2011: retrato de Mohammed VI y, en el reverso, un monumento bajo el escudo del Reino."
    },
    "caption": {
      "fr": "Mohammed VI · 250 dirhams · 2011 / 1432 H.",
      "ar": "محمد السادس · 250 درهماً · 2011 / 1432 هـ",
      "en": "Mohammed VI · 250 dirhams · 2011 / AH 1432",
      "es": "Mohammed VI · 250 dírhams · 2011 / 1432 H."
    }
  },
  {
    "src": "assets/boutique/m6-2012-a.webp",
    "reverse": "assets/boutique/m6-2012-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 250 dirhams de 2012 : portrait de Mohammed VI et, au revers, une porte monumentale sous les armoiries du Royaume.",
      "ar": "قطعة فضية من فئة 250 درهماً لسنة 2012: صورة محمد السادس، وعلى الظهر باب أثري تحت شعار المملكة.",
      "en": "Silver 250 dirham coin of 2012: portrait of Mohammed VI and, on the reverse, a monumental gate beneath the arms of the Kingdom.",
      "es": "Moneda de plata de 250 dírhams de 2012: retrato de Mohammed VI y, en el reverso, una puerta monumental bajo el escudo del Reino."
    },
    "caption": {
      "fr": "Mohammed VI · 250 dirhams · 2012 / 1433 H.",
      "ar": "محمد السادس · 250 درهماً · 2012 / 1433 هـ",
      "en": "Mohammed VI · 250 dirhams · 2012 / AH 1433",
      "es": "Mohammed VI · 250 dírhams · 2012 / 1433 H."
    }
  },
  {
    "src": "assets/boutique/m6-51-ans-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 250 dirhams aux armoiries du Royaume.",
      "ar": "قطعة فضية من فئة 250 درهماً تحمل شعار المملكة.",
      "en": "Silver 250 dirham coin with the arms of the Kingdom.",
      "es": "Moneda de plata de 250 dírhams con el escudo del Reino."
    },
    "caption": {
      "fr": "51e anniversaire de S.M. le Roi Mohammed VI · 250 dirhams",
      "ar": "الذكرى الحادية والخمسون لميلاد جلالة الملك محمد السادس · 250 درهماً",
      "en": "51st birthday of H.M. King Mohammed VI · 250 dirhams",
      "es": "51.º aniversario de S. M. el Rey Mohammed VI · 250 dírhams"
    }
  },
  {
    "src": "assets/boutique/intronisation-21-2020-a.webp",
    "reverse": "assets/boutique/intronisation-21-2020-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 250 dirhams de 2020 : portrait de Mohammed VI et, au revers, les armoiries du Royaume dans un cadre étoilé.",
      "ar": "قطعة فضية من فئة 250 درهماً لسنة 2020: صورة محمد السادس، وعلى الظهر شعار المملكة داخل إطار مرصّع بالنجوم.",
      "en": "Silver 250 dirham coin of 2020: portrait of Mohammed VI and, on the reverse, the arms of the Kingdom in a starred frame.",
      "es": "Moneda de plata de 250 dírhams de 2020: retrato de Mohammed VI y, en el reverso, el escudo del Reino en un marco estrellado."
    },
    "caption": {
      "fr": "21e anniversaire de l’intronisation de S.M. le Roi Mohammed VI · 250 dirhams · 2020 / 1441 H.",
      "ar": "الذكرى الحادية والعشرون لتربع جلالة الملك على العرش · 250 درهماً · 2020 / 1441 هـ",
      "en": "21st anniversary of the enthronement of H.M. King Mohammed VI · 250 dirhams · 2020 / AH 1441",
      "es": "21.º aniversario de la entronización de S. M. el Rey Mohammed VI · 250 dírhams · 2020 / 1441 H."
    }
  },
  {
    "src": "assets/boutique/musee-20ans-2022-a.webp",
    "reverse": "assets/boutique/musee-20ans-2022-b.webp",
    "alt": {
      "fr": "Pièce d’argent de 2022 : portrait de Mohammed VI et, au revers, une salle du musée avec le nombre 20.",
      "ar": "قطعة فضية لسنة 2022: صورة محمد السادس، وعلى الظهر قاعة من المتحف والعدد 20.",
      "en": "Silver coin of 2022: portrait of Mohammed VI and, on the reverse, a museum gallery with the number 20.",
      "es": "Moneda de plata de 2022: retrato de Mohammed VI y, en el reverso, una sala del museo con el número 20."
    },
    "caption": {
      "fr": "20e anniversaire de la création du Musée de Bank Al-Maghrib · 2022 / 1443 H.",
      "ar": "الذكرى العشرون لتأسيس متحف بنك المغرب · 2022 / 1443 هـ",
      "en": "20th anniversary of the Bank Al-Maghrib Museum · 2022 / AH 1443",
      "es": "20.º aniversario del Museo de Bank Al-Maghrib · 2022 / 1443 H."
    }
  },
  {
    "src": "assets/boutique/coffret.webp",
    "alt": {
      "fr": "Coffret noir ouvert présentant cinq pièces d’argent sous le nom de Bank Al-Maghrib.",
      "ar": "علبة سوداء مفتوحة تعرض خمس قطع فضية تحت اسم بنك المغرب.",
      "en": "Open black presentation box holding five silver coins beneath the Bank Al-Maghrib name.",
      "es": "Estuche negro abierto con cinco monedas de plata bajo el nombre de Bank Al-Maghrib."
    },
    "caption": {
      "fr": "Coffret de pièces commémoratives",
      "ar": "علبة القطع النقدية التذكارية",
      "en": "Commemorative coin box set",
      "es": "Estuche de monedas conmemorativas"
    },
    "cover": true
  }
];

/* Boutique — withdrawn and commemorative banknotes shelf (front only). */
window.BAM_SHOP_NOTES = [
  {
    "src": "assets/boutique/billets/mohammed5-5dh.webp",
    "alt": {
      "fr": "Billet de 5 dirhams de Bank Al-Maghrib au portrait de Mohammed V, devant une vue de ville.",
      "ar": "ورقة نقدية من فئة 5 دراهم لبنك المغرب تحمل صورة محمد الخامس أمام منظر لمدينة.",
      "en": "Bank Al-Maghrib 5 dirham note with a portrait of Mohammed V in front of a city view.",
      "es": "Billete de 5 dírhams de Bank Al-Maghrib con el retrato de Mohammed V ante una vista de ciudad."
    },
    "caption": {
      "fr": "Mohammed V · 5 dirhams",
      "ar": "محمد الخامس · 5 دراهم",
      "en": "Mohammed V · 5 dirhams",
      "es": "Mohammed V · 5 dírhams"
    }
  },
  {
    "src": "assets/boutique/billets/mohammed5-10dh.webp",
    "alt": {
      "fr": "Billet de 10 dirhams de Bank Al-Maghrib au portrait de Mohammed V, avec la tour Hassan.",
      "ar": "ورقة نقدية من فئة 10 دراهم لبنك المغرب تحمل صورة محمد الخامس وصومعة حسان.",
      "en": "Bank Al-Maghrib 10 dirham note with a portrait of Mohammed V and the Hassan Tower.",
      "es": "Billete de 10 dírhams de Bank Al-Maghrib con el retrato de Mohammed V y la torre Hasán."
    },
    "caption": {
      "fr": "Mohammed V · 10 dirhams · tour Hassan",
      "ar": "محمد الخامس · 10 دراهم · صومعة حسان",
      "en": "Mohammed V · 10 dirhams · Hassan Tower",
      "es": "Mohammed V · 10 dírhams · torre Hasán"
    }
  },
  {
    "src": "assets/boutique/billets/hassan2-50dh-1965.webp",
    "alt": {
      "fr": "Billet de 50 dirhams de Bank Al-Maghrib au portrait de Hassan II, devant une ville côtière.",
      "ar": "ورقة نقدية من فئة 50 درهماً لبنك المغرب تحمل صورة الحسن الثاني أمام مدينة ساحلية.",
      "en": "Bank Al-Maghrib 50 dirham note with a portrait of Hassan II in front of a coastal city.",
      "es": "Billete de 50 dírhams de Bank Al-Maghrib con el retrato de Hasán II ante una ciudad costera."
    },
    "caption": {
      "fr": "Hassan II · 50 dirhams · vue côtière",
      "ar": "الحسن الثاني · 50 درهماً · منظر ساحلي",
      "en": "Hassan II · 50 dirhams · coastal view",
      "es": "Hasán II · 50 dírhams · vista costera"
    }
  },
  {
    "src": "assets/boutique/billets/hassan2-5dh-1970.webp",
    "alt": {
      "fr": "Billet violet de 5 dirhams de 1970 au portrait de Hassan II, avec une kasbah.",
      "ar": "ورقة نقدية بنفسجية من فئة 5 دراهم لسنة 1970 تحمل صورة الحسن الثاني وقصبة.",
      "en": "Purple 5 dirham note of 1970 with a portrait of Hassan II and a kasbah.",
      "es": "Billete morado de 5 dírhams de 1970 con el retrato de Hasán II y una alcazaba."
    },
    "caption": {
      "fr": "Hassan II · 5 dirhams · 1970 / 1390 H.",
      "ar": "الحسن الثاني · 5 دراهم · 1970 / 1390 هـ",
      "en": "Hassan II · 5 dirhams · 1970 / AH 1390",
      "es": "Hasán II · 5 dírhams · 1970 / 1390 H."
    }
  },
  {
    "src": "assets/boutique/billets/hassan2-10dh-1970.webp",
    "alt": {
      "fr": "Billet rouge de 10 dirhams de 1970 au portrait de Hassan II.",
      "ar": "ورقة نقدية حمراء من فئة 10 دراهم لسنة 1970 تحمل صورة الحسن الثاني.",
      "en": "Red 10 dirham note of 1970 with a portrait of Hassan II.",
      "es": "Billete rojo de 10 dírhams de 1970 con el retrato de Hasán II."
    },
    "caption": {
      "fr": "Hassan II · 10 dirhams · 1970 / 1390 H.",
      "ar": "الحسن الثاني · 10 دراهم · 1970 / 1390 هـ",
      "en": "Hassan II · 10 dirhams · 1970 / AH 1390",
      "es": "Hasán II · 10 dírhams · 1970 / 1390 H."
    }
  },
  {
    "src": "assets/boutique/billets/hassan2-50dh.webp",
    "alt": {
      "fr": "Billet vert de 50 dirhams au portrait de Hassan II, avec une vue de ville.",
      "ar": "ورقة نقدية خضراء من فئة 50 درهماً تحمل صورة الحسن الثاني ومنظراً لمدينة.",
      "en": "Green 50 dirham note with a portrait of Hassan II and a city view.",
      "es": "Billete verde de 50 dírhams con el retrato de Hasán II y una vista de ciudad."
    },
    "caption": {
      "fr": "Hassan II · 50 dirhams · vue de ville",
      "ar": "الحسن الثاني · 50 درهماً · منظر مدينة",
      "en": "Hassan II · 50 dirhams · city view",
      "es": "Hasán II · 50 dírhams · vista de ciudad"
    }
  },
  {
    "src": "assets/boutique/billets/hassan2-100dh.webp",
    "alt": {
      "fr": "Billet de 100 dirhams de 1985 au portrait de Hassan II, avec le siège de Bank Al-Maghrib.",
      "ar": "ورقة نقدية من فئة 100 درهم لسنة 1985 تحمل صورة الحسن الثاني ومقر بنك المغرب.",
      "en": "100 dirham note of 1985 with a portrait of Hassan II and the Bank Al-Maghrib headquarters.",
      "es": "Billete de 100 dírhams de 1985 con el retrato de Hasán II y la sede de Bank Al-Maghrib."
    },
    "caption": {
      "fr": "Hassan II · 100 dirhams · 1985 / 1405 H.",
      "ar": "الحسن الثاني · 100 درهم · 1985 / 1405 هـ",
      "en": "Hassan II · 100 dirhams · 1985 / AH 1405",
      "es": "Hasán II · 100 dírhams · 1985 / 1405 H."
    }
  }
];

/* Boutique — collector's tools shelf (product photos on white). */
window.BAM_SHOP_TOOLS = [
  {
    "src": "assets/boutique/outils/loupe-socle.webp",
    "alt": {
      "fr": "Loupe à monture dorée posée sur un socle en bois.",
      "ar": "عدسة مكبّرة بإطار ذهبي على قاعدة خشبية.",
      "en": "Gold-rimmed magnifying glass resting on a wooden stand.",
      "es": "Lupa de montura dorada sobre un soporte de madera."
    },
    "caption": {
      "fr": "Loupe sur socle en bois",
      "ar": "عدسة مكبّرة على قاعدة خشبية",
      "en": "Magnifying glass on a wooden stand",
      "es": "Lupa con soporte de madera"
    }
  },
  {
    "src": "assets/boutique/outils/pied-a-coulisse.webp",
    "alt": {
      "fr": "Pied à coulisse numérique à écran, pour mesurer le diamètre et l’épaisseur des pièces.",
      "ar": "قدمة قنوية رقمية بشاشة لقياس قطر القطع النقدية وسمكها.",
      "en": "Digital caliper with a display, for measuring the diameter and thickness of coins.",
      "es": "Calibre digital con pantalla para medir el diámetro y el grosor de las monedas."
    },
    "caption": {
      "fr": "Pied à coulisse numérique",
      "ar": "قدمة قنوية رقمية",
      "en": "Digital caliper",
      "es": "Calibre digital"
    }
  },
  {
    "src": "assets/boutique/outils/etuis-carton.webp",
    "alt": {
      "fr": "Étuis en carton blanc à fenêtre transparente, chacun contenant une pièce.",
      "ar": "حوافظ من الكرتون الأبيض بنافذة شفافة، تحتوي كل منها على قطعة نقدية.",
      "en": "White cardboard holders with clear windows, each holding a coin.",
      "es": "Cartones blancos con ventana transparente, cada uno con una moneda."
    },
    "caption": {
      "fr": "Étuis cartonnés pour pièces",
      "ar": "حوافظ كرتونية للقطع النقدية",
      "en": "Cardboard coin holders",
      "es": "Cartones portamonedas"
    }
  },
  {
    "src": "assets/boutique/outils/pochettes.webp",
    "alt": {
      "fr": "Pochettes plastiques transparentes de plusieurs formats, pour billets et documents.",
      "ar": "أغلفة بلاستيكية شفافة بمقاسات مختلفة للأوراق النقدية والوثائق.",
      "en": "Clear plastic sleeves in several sizes, for banknotes and documents.",
      "es": "Fundas de plástico transparente de varios tamaños, para billetes y documentos."
    },
    "caption": {
      "fr": "Pochettes de protection transparentes",
      "ar": "أغلفة حماية شفافة",
      "en": "Clear protective sleeves",
      "es": "Fundas protectoras transparentes"
    }
  },
  {
    "src": "assets/boutique/outils/plateau-velours.webp",
    "alt": {
      "fr": "Plateau en velours noir à alvéoles, garni de pièces dorées.",
      "ar": "صينية من المخمل الأسود بخانات تضم قطعاً نقدية ذهبية.",
      "en": "Black velvet tray with compartments, holding gold-coloured coins.",
      "es": "Bandeja de terciopelo negro con compartimentos y monedas doradas."
    },
    "caption": {
      "fr": "Plateau à monnaies en velours",
      "ar": "صينية مخملية للقطع النقدية",
      "en": "Velvet coin tray",
      "es": "Bandeja de terciopelo para monedas"
    }
  }
];
