# -*- coding: utf-8 -*-
# Source of truth for the museum translations (build: python3 tools/i18n/build.py).
# HTML: (key, en_innerHTML_exactly_as_in_index.html, fr, ar, es)
# ATTR: (key, attribute, en_value_exactly_as_in_index.html, fr, ar, es)
# JS:   (key, en, fr, ar, es)   — used by app.js through t(key, vars)

HTML = [
 # header / nav
 ("nav.menu", "Menu", "Menu", "القائمة", "Menú"),
 ("nav.exhibition", "Exhibition", "Exposition", "المعرض", "Exposición"),
 ("nav.stories", "Stories", "Récits", "حكايات", "Historias"),
 ("nav.collection", "Collection", "Collections", "المجموعات", "Colecciones"),
 ("nav.boutique", "Boutique", "Boutique", "المتجر", "Tienda"),
 ("nav.visit", "Visit", "Visiter", "الزيارة", "Visitar"),
 ("nav.events", "Events", "Agenda", "الفعاليات", "Agenda"),
 ("nav.tickets", "Tickets", "Billets", "التذاكر", "Entradas"),
 ("skip", "Skip to content", "Aller au contenu", "انتقل إلى المحتوى", "Ir al contenido"),

 # hero
 ("hero.eyebrow", "Rabat &nbsp;·&nbsp; Numismatics &nbsp;·&nbsp; Arts &nbsp;·&nbsp; Boutique",
  "Rabat &nbsp;·&nbsp; Numismatique &nbsp;·&nbsp; Arts &nbsp;·&nbsp; Boutique",
  "الرباط &nbsp;·&nbsp; المسكوكات &nbsp;·&nbsp; الفنون &nbsp;·&nbsp; المتجر",
  "Rabat &nbsp;·&nbsp; Numismática &nbsp;·&nbsp; Artes &nbsp;·&nbsp; Tienda"),
 ("hero.title", "Where a nation’s memory is <em>struck in metal</em> and kept in light.",
  "Là où la mémoire d’une nation est <em>frappée dans le métal</em> et gardée dans la lumière.",
  "حيث تُسكّ ذاكرة أمّة <em>في المعدن</em> وتُصان في النور.",
  "Donde la memoria de una nación se <em>acuña en metal</em> y se guarda en la luz."),
 ("hero.plan", "Plan your visit", "Préparer votre visite", "خطّط لزيارتك", "Planifica tu visita"),
 ("hero.explore", "Explore the collections", "Explorer les collections", "استكشف المجموعات", "Explora las colecciones"),
 ("hero.caption", "Bimetallic blanks, before the strike", "Flans bimétalliques, avant la frappe", "أقراص ثنائية المعدن قبل السكّ", "Cospeles bimetálicos, antes de la acuñación"),

 # houses
 ("houses.eyebrow", "One building, three wings", "Un bâtiment, trois ailes", "مبنى واحد، ثلاثة أجنحة", "Un edificio, tres alas"),
 ("houses.title", "Money, art and financial culture.", "La monnaie, l’art et la culture financière.", "النقود والفن والثقافة المالية.", "El dinero, el arte y la cultura financiera."),
 ("houses.num", "Numismatics", "Numismatique", "المسكوكات", "Numismática"),
 ("houses.num.text", "From the first mints of the Maghreb to the dirham in your pocket — the story of Morocco told coin by coin, note by note.",
  "Des premiers ateliers monétaires du Maghreb au dirham de votre poche : l’histoire du Maroc racontée pièce après pièce, billet après billet.",
  "من أولى دور السكّ في المغرب الكبير إلى الدرهم الذي في جيبك: تاريخ المغرب يُروى قطعةً قطعة وورقةً ورقة.",
  "De las primeras cecas del Magreb al dírham de tu bolsillo: la historia de Marruecos contada moneda a moneda, billete a billete."),
 ("houses.arts", "Arts", "Arts", "الفنون", "Artes"),
 ("houses.arts.text", "The Bank Al-Maghrib collection of Moroccan painting and sculpture, shown in rotating hangs across the upper galleries.",
  "La collection de peinture et de sculpture marocaines de Bank Al-Maghrib, présentée par accrochages successifs dans les galeries supérieures.",
  "مجموعة بنك المغرب من الرسم والنحت المغربيين، تُعرض بالتناوب في القاعات العليا.",
  "La colección de pintura y escultura marroquíes de Bank Al-Maghrib, presentada en montajes rotativos en las galerías superiores."),
 ("houses.shop.text", "Catalogues, faithful replicas and objects made to be kept — every purchase supports the museum’s education programme.",
  "Catalogues, répliques fidèles et objets faits pour durer : chaque achat soutient le programme éducatif du musée.",
  "كتالوجات ونسخ أمينة وقطع صُنعت لتُقتنى: كل عملية شراء تدعم البرنامج التربوي للمتحف.",
  "Catálogos, réplicas fieles y objetos hechos para durar: cada compra apoya el programa educativo del museo."),

 # exhibition
 ("ex.eyebrow", "Current exhibition &nbsp;·&nbsp; Until 28 February 2027", "Exposition en cours &nbsp;·&nbsp; Jusqu’au 28 février 2027", "المعرض الحالي &nbsp;·&nbsp; إلى غاية 28 فبراير 2027", "Exposición actual &nbsp;·&nbsp; Hasta el 28 de febrero de 2027"),
 ("ex.title", "Struck in <em>Paris</em>", "Frappé à <em>Paris</em>", "ضُرب <em>بباريس</em>", "Acuñado en <em>París</em>"),
 ("ex.lede", "The coinage of Sultan Moulay al-Hassan I — five pieces, one vitrine, and the reform that tried to give Morocco a single, modern currency.",
  "Le monnayage du sultan Moulay al-Hassan Ier : cinq pièces, une vitrine, et la réforme qui voulut doter le Maroc d’une monnaie unique et moderne.",
  "مسكوكات السلطان مولاي الحسن الأول: خمس قطع في واجهة واحدة، وإصلاحٌ سعى إلى منح المغرب عملةً موحّدة وحديثة.",
  "La moneda del sultán Mulay al-Hasan I: cinco piezas, una vitrina y la reforma que quiso dar a Marruecos una moneda única y moderna."),
 ("ex.cap1", "The vitrine — five coins, obverse above reverse.", "La vitrine : cinq pièces, l’avers au-dessus du revers.", "الواجهة: خمس قطع، الوجه فوق الظهر.", "La vitrina: cinco monedas, el anverso sobre el reverso."),
 ("ex.p1.title", "A reform in metal", "Une réforme dans le métal", "إصلاحٌ في المعدن", "Una reforma en metal"),
 ("ex.p1.text", "In the 1880s, Moulay al-Hassan I set out to replace a patchwork of foreign and local coins with a currency bearing Morocco’s own name. The new pieces — silver for the treasury, bronze for the market — were ordered from the most precise mints in Europe.",
  "Dans les années 1880, Moulay al-Hassan Ier entreprit de remplacer une mosaïque de monnaies étrangères et locales par une monnaie portant le nom du Maroc. Les nouvelles pièces – l’argent pour le trésor, le bronze pour le marché – furent commandées aux ateliers les plus précis d’Europe.",
  "في ثمانينيات القرن التاسع عشر، سعى مولاي الحسن الأول إلى تعويض خليط من العملات الأجنبية والمحلية بعملة تحمل اسم المغرب. وقد طُلبت القطع الجديدة – الفضة للخزينة والبرونز للأسواق – من أدقّ دور السكّ في أوروبا.",
  "En la década de 1880, Mulay al-Hasan I se propuso sustituir un mosaico de monedas extranjeras y locales por una moneda con el nombre de Marruecos. Las nuevas piezas –plata para el tesoro, bronce para el mercado– se encargaron a las cecas más precisas de Europa."),
 ("ex.p2.title", "“Struck in Paris”", "« Frappé à Paris »", "«ضُرب بباريس»", "«Acuñado en París»"),
 ("ex.p2.text", "Look at the centre of the largest coin. The calligraphy reads <span lang=\"ar\" dir=\"rtl\" class=\"ar\">ضرب بباريس</span> — <em>struck in Paris</em>. A sultan’s coin announcing, without apology, where it was made: modernity was a thing you could commission.",
  "Regardez le centre de la plus grande pièce. La calligraphie se lit <span lang=\"ar\" dir=\"rtl\" class=\"ar\">ضرب بباريس</span> – <em>frappé à Paris</em>. Une monnaie de sultan qui annonce sans détour où elle a été fabriquée : la modernité pouvait se commander.",
  "تأمّل وسط القطعة الكبرى، حيث يُقرأ الخط: <span class=\"ar\">ضرب بباريس</span>. عملة سلطانية تعلن دون تحفّظ مكان صنعها: كانت الحداثة شيئاً يمكن طلبه.",
  "Mira el centro de la moneda más grande. La caligrafía dice <span lang=\"ar\" dir=\"rtl\" class=\"ar\">ضرب بباريس</span>: <em>acuñado en París</em>. Una moneda de sultán que anuncia sin rodeos dónde se hizo: la modernidad podía encargarse."),
 ("ex.p3.title", "Counting in another calendar", "Compter dans un autre calendrier", "العدّ بتقويمٍ آخر", "Contar en otro calendario"),
 ("ex.p3.text", "On the reverse, <span lang=\"ar\" dir=\"rtl\" class=\"ar\">عام ١٣٠٦</span> — the year 1306 of the Hijra, 1888–89 in the Gregorian calendar. The numerals are set in European type, the word for “year” in flowing Maghrebi script. Two worlds on a single face.",
  "Au revers, <span lang=\"ar\" dir=\"rtl\" class=\"ar\">عام ١٣٠٦</span> – l’an 1306 de l’Hégire, soit 1888-1889 du calendrier grégorien. Les chiffres sont en caractères européens, le mot « année » en écriture maghrébine. Deux mondes sur une même face.",
  "على الظهر: <span class=\"ar\">عام ١٣٠٦</span> للهجرة، أي 1888–1889 بالتقويم الميلادي. الأرقام بحروف أوروبية، وكلمة «عام» بالخط المغربي الانسيابي. عالمان على وجه واحد.",
  "En el reverso, <span lang=\"ar\" dir=\"rtl\" class=\"ar\">عام ١٣٠٦</span>: el año 1306 de la Hégira, 1888-1889 del calendario gregoriano. Las cifras van en tipografía europea; la palabra «año», en escritura magrebí. Dos mundos en una sola cara."),
 ("ex.p4.title", "Change for the souk", "La monnaie du souk", "صرفُ السوق", "Cambio para el zoco"),
 ("ex.p4.text", "The smallest bronze in the case was the one that travelled furthest — from palm to palm, stall to stall. Its warm red patina is the residue of a century of ordinary lives.",
  "Le plus petit bronze de la vitrine est celui qui a le plus voyagé, de main en main, d’étal en étal. Sa chaude patine rouge est le dépôt d’un siècle de vies ordinaires.",
  "أصغر قطعة برونزية في الواجهة هي التي سافرت أبعد: من كفٍّ إلى كفّ ومن دكّانٍ إلى دكّان. وزنجارها الأحمر الدافئ أثرُ قرنٍ من الحياة اليومية.",
  "El bronce más pequeño de la vitrina fue el que más viajó, de mano en mano, de puesto en puesto. Su cálida pátina roja es el poso de un siglo de vidas corrientes."),
 ("ex.p5.title", "The last silver", "Le dernier argent", "آخرُ الفضّة", "La última plata"),
 ("ex.p5.text", "Dated 1311 — 1893–94 — this worn silver piece belongs to the final year of the reign. Its softened edges are a record of use, and of how quickly a reform can become simply money.",
  "Datée de 1311 (1893-1894), cette pièce d’argent usée appartient à la dernière année du règne. Ses bords adoucis témoignent de l’usage, et de la rapidité avec laquelle une réforme devient simplement de la monnaie.",
  "تحمل هذه القطعة الفضية البالية تاريخ 1311 (1893–1894)، آخر سنة من العهد. وحوافّها الملساء شاهدة على التداول، وعلى سرعة تحوّل الإصلاح إلى مجرّد نقود.",
  "Fechada en 1311 (1893-1894), esta gastada pieza de plata pertenece al último año del reinado. Sus bordes suavizados son un registro del uso, y de lo rápido que una reforma se convierte simplemente en dinero."),
 ("ex.book", "Book to see it in person <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Réserver pour la voir en vrai <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "احجز لتراها عن قرب <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Reserva para verla en persona <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>"),

 # stories
 ("st.eyebrow", "Stories", "Récits", "حكايات", "Historias"),
 ("st.title", "Every object is a <em>small biography.</em>", "Chaque objet est une <em>petite biographie.</em>", "لكل قطعة <em>سيرةٌ صغيرة.</em>", "Cada objeto es una <em>pequeña biografía.</em>"),
 ("st.meta.bp1306", "Bronze · Paris · AH 1306", "Bronze · Paris · 1306 H.", "برونز · باريس · 1306 هـ", "Bronce · París · 1306 H."),
 ("st.meta.s1311", "Silver · AH 1311", "Argent · 1311 H.", "فضة · 1311 هـ", "Plata · 1311 H."),
 ("st.meta.1310", "AH 1310", "1310 H.", "1310 هـ", "1310 H."),
 ("st.meta.b1306", "Bronze · AH 1306", "Bronze · 1306 H.", "برونز · 1306 هـ", "Bronce · 1306 H."),
 ("st.meta.blanks", "Bimetallic blanks · today", "Flans bimétalliques · aujourd’hui", "أقراص ثنائية المعدن · اليوم", "Cospeles bimetálicos · hoy"),
 ("st.1.title", "The widest voice", "La voix la plus large", "الصوت الأوسع", "La voz más amplia"),
 ("st.1.text", "The largest bronze of the series, made to be seen across a market stall.", "Le plus grand bronze de la série, fait pour être vu d’un bout à l’autre de l’étal.", "أكبر قطعة برونزية في السلسلة، صُنعت لتُرى من طرف الدكّان إلى طرفه.", "El bronce más grande de la serie, hecho para verse de un extremo a otro del puesto."),
 ("st.1.detail", "Its border of eight-pointed stars echoes the tile work of Fez — a European machine asked to speak in Moroccan ornament.", "Sa bordure d’étoiles à huit branches fait écho aux zelliges de Fès : une machine européenne invitée à parler le langage de l’ornement marocain.", "إطارها من النجوم الثمانية يستحضر زليج فاس: آلة أوروبية طُلب منها أن تتكلّم بلغة الزخرفة المغربية.", "Su orla de estrellas de ocho puntas evoca los zellij de Fez: una máquina europea a la que se pidió hablar el lenguaje del ornamento marroquí."),
 ("st.2.title", "The last silver", "Le dernier argent", "آخرُ الفضّة", "La última plata"),
 ("st.2.text", "Minted in the final year of Moulay al-Hassan I’s reign.", "Frappée la dernière année du règne de Moulay al-Hassan Ier.", "سُكّت في السنة الأخيرة من عهد مولاي الحسن الأول.", "Acuñada en el último año del reinado de Mulay al-Hasan I."),
 ("st.2.detail", "Worn smooth at the rim, the date still stands proud: 1311. Silver is soft; every hand that held it took a little away.", "Le bord est usé, mais la date reste lisible : 1311. L’argent est tendre ; chaque main qui l’a tenue en a emporté un peu.", "حافّتها ملساء من البلى، لكن التاريخ ما زال بارزاً: 1311. الفضة معدن ليّن، وكل يد أمسكتها أخذت منها قليلاً.", "El borde está gastado, pero la fecha sigue en relieve: 1311. La plata es blanda; cada mano que la sostuvo se llevó un poco."),
 ("st.3.title", "A darker skin", "Une peau plus sombre", "بشرةٌ أدكن", "Una piel más oscura"),
 ("st.3.text", "Same design, different century of weather.", "Même dessin, autre siècle d’intempéries.", "التصميم نفسه، وقرنٌ آخر من تقلّبات الزمن.", "El mismo diseño, otro siglo de intemperie."),
 ("st.3.detail", "Patina is not damage but biography — oxygen, sweat and time, written as a thin dark film over the metal.", "La patine n’est pas un dommage mais une biographie : l’oxygène, la sueur et le temps, inscrits en un mince film sombre sur le métal.", "الزنجار ليس تلفاً بل سيرة: الأكسجين والعرق والزمن، مكتوبةً غشاءً داكناً رقيقاً على المعدن.", "La pátina no es un daño sino una biografía: oxígeno, sudor y tiempo, escritos como una fina película oscura sobre el metal."),
 ("st.4.title", "A border of stars", "Une bordure d’étoiles", "إطارٌ من النجوم", "Una orla de estrellas"),
 ("st.4.text", "A ring of arabesques that frames the date like a doorway.", "Un anneau d’arabesques qui encadre la date comme une porte.", "حلقة من الزخارف تؤطّر التاريخ كما يؤطّر القوسُ الباب.", "Un anillo de arabescos que enmarca la fecha como una puerta."),
 ("st.4.detail", "Look closely and each star is slightly different — the engraver’s hand survives even inside an industrial die.", "Regardez de près : chaque étoile est légèrement différente. La main du graveur survit jusque dans un coin industriel.", "تأمّلها عن قرب تجد كل نجمة مختلفة قليلاً: يدُ النقّاش حاضرة حتى في قالبٍ صناعي.", "Mira de cerca: cada estrella es ligeramente distinta. La mano del grabador sobrevive incluso en un cuño industrial."),
 ("st.5.title", "Change for the souk", "La monnaie du souk", "صرفُ السوق", "Cambio para el zoco"),
 ("st.5.text", "The smallest coin here, and the busiest.", "La plus petite pièce ici, et la plus affairée.", "أصغر قطعة هنا، وأكثرها تداولاً.", "La moneda más pequeña aquí, y la más ajetreada."),
 ("st.5.detail", "Small change is where a currency becomes real. Bread, mint tea, a ride across the river: this is the coin that paid for them.", "C’est dans la petite monnaie qu’une devise devient réelle. Le pain, le thé à la menthe, une traversée du fleuve : c’est cette pièce qui les payait.", "في الصرف الصغير تصبح العملة حقيقية. الخبز، وأتاي بالنعناع، وعبور النهر: هذه هي القطعة التي كانت تدفع ثمنها.", "En el cambio menudo una moneda se vuelve real. El pan, el té con hierbabuena, cruzar el río: esta es la moneda que los pagaba."),
 ("st.6.title", "Before the strike", "Avant la frappe", "قبل السكّ", "Antes de la acuñación"),
 ("st.6.text", "A coin begins as a blank — a ring and a core, pressed together, waiting for a face.", "Une pièce commence par un flan : un anneau et un cœur assemblés, qui attendent un visage.", "تبدأ القطعة النقدية قرصاً خاماً: حلقة وقلب مضغوطان معاً، في انتظار وجه.", "Una moneda empieza siendo un cospel: un anillo y un núcleo unidos, esperando un rostro."),
 ("st.6.detail", "A single strike of the press, in a fraction of a second, gives the blank its design, its edge and its value.", "Un seul coup de presse, en une fraction de seconde, donne au flan son dessin, sa tranche et sa valeur.", "ضربة واحدة من المكبس، في جزء من الثانية، تمنح القرص رسمه وحافّته وقيمته.", "Un solo golpe de prensa, en una fracción de segundo, da al cospel su diseño, su canto y su valor."),
 ("st.7.title", "Two metals, one coin", "Deux métaux, une pièce", "معدنان، قطعة واحدة", "Dos metales, una moneda"),
 ("st.7.text", "Gold-coloured ring, silver-coloured heart — the hardest coin to counterfeit is the one made of two.", "Anneau doré, cœur argenté : la pièce la plus difficile à contrefaire est celle qui est faite de deux.", "حلقة ذهبية اللون وقلب فضي اللون: أصعب القطع تزويراً هي المصنوعة من معدنين.", "Anillo dorado, corazón plateado: la moneda más difícil de falsificar es la que está hecha de dos."),
 ("st.7.detail", "The two alloys respond differently to machines that test them, turning metallurgy itself into a security feature.", "Les deux alliages réagissent différemment aux machines qui les testent : la métallurgie devient elle-même un élément de sécurité.", "تستجيب السبيكتان بشكل مختلف للآلات التي تفحصهما، فتصبح علوم المعادن نفسها عنصراً من عناصر الأمان.", "Las dos aleaciones responden de forma distinta a las máquinas que las comprueban: la metalurgia misma se convierte en un elemento de seguridad."),

 # collections
 ("col.eyebrow", "The collections", "Les collections", "المجموعات", "Las colecciones"),
 ("col.title", "Held up to the <em>light.</em>", "Tenues à la <em>lumière.</em>", "مرفوعةٌ إلى <em>النور.</em>", "Al trasluz de la <em>luz.</em>"),
 ("col.lede", "Two collections under one roof: the story of money in Morocco, from the first exchanges to today’s dirham, and the Bank’s collection of Moroccan art.",
  "Deux collections sous un même toit : l’histoire de la monnaie au Maroc, des premiers échanges au dirham d’aujourd’hui, et la collection d’art marocain de la Banque.",
  "مجموعتان تحت سقف واحد: تاريخ النقود في المغرب من أولى المبادلات إلى درهم اليوم، ومجموعة البنك من الفن المغربي.",
  "Dos colecciones bajo un mismo techo: la historia del dinero en Marruecos, de los primeros intercambios al dírham de hoy, y la colección de arte marroquí del Banco."),
 ("col.tab.num", "Numismatique", "Numismatique", "المسكوكات", "Numismática"),
 ("col.tab.art", "Artistique", "Artistique", "الفنون", "Artística"),
 ("col.noscript", "The timeline needs JavaScript to display.", "La frise chronologique nécessite JavaScript.", "يتطلّب الخط الزمني تفعيل JavaScript.", "La cronología necesita JavaScript."),
 ("art.eyebrow", "Collection artistique", "Collection artistique", "المجموعة الفنية", "Colección artística"),
 ("art.lede", "Two ways of seeing Morocco: the European Orientalist painters who discovered it, and the Moroccan artists who invented its modern art, from the pioneers to today.",
  "Deux regards sur le Maroc : celui des peintres orientalistes européens qui l’ont découvert, et celui des artistes marocains qui ont inventé son art moderne, des pionniers à aujourd’hui.",
  "نظرتان إلى المغرب: نظرة الرسامين المستشرقين الأوروبيين الذين اكتشفوه، ونظرة الفنانين المغاربة الذين ابتكروا فنه الحديث، من الرواد إلى اليوم.",
  "Dos miradas sobre Marruecos: la de los pintores orientalistas europeos que lo descubrieron y la de los artistas marroquíes que inventaron su arte moderno, de los pioneros a hoy."),
 ("art.soon", "Photo à venir", "Photo à venir", "الصورة قريباً", "Foto próximamente"),

 # boutique
 ("shop.eyebrow", "The Boutique", "La Boutique", "المتجر", "La Tienda"),
 ("shop.title", "Take a piece of the <em>collection</em> home.", "Emportez un morceau de la <em>collection</em>.", "خذ معك قطعةً من <em>المجموعة</em>.", "Llévate a casa un trozo de la <em>colección</em>."),
 ("shop.lede", "Five departments, from coins struck for the nation’s great moments to the books that tell their story.",
  "Cinq rayons, des pièces frappées pour les grands moments de la nation aux ouvrages qui en racontent l’histoire.",
  "خمسة أقسام، من القطع المسكوكة لأبرز لحظات الأمة إلى الكتب التي تروي قصتها.",
  "Cinco secciones, desde las monedas acuñadas para los grandes momentos de la nación hasta los libros que cuentan su historia."),
 ("shop.1", "Pièces commémoratives", "Pièces commémoratives", "القطع النقدية التذكارية", "Monedas conmemorativas"),
 ("shop.1.text", "Coins struck to mark the great moments of the Kingdom, in proof and uncirculated finishes.", "Des pièces frappées pour marquer les grands moments du Royaume, en qualité belle épreuve et fleur de coin.", "قطع سُكّت احتفاءً باللحظات الكبرى للمملكة، بجودة «بروف» وغير متداولة.", "Monedas acuñadas para celebrar los grandes momentos del Reino, en calidad proof y sin circular."),
 ("shop.2", "Billets démonétisés et commémoratifs", "Billets démonétisés et commémoratifs", "الأوراق النقدية الملغاة والتذكارية", "Billetes desmonetizados y conmemorativos"),
 ("shop.2.text", "Withdrawn series and commemorative notes, presented and certified for collectors.", "Séries retirées de la circulation et billets commémoratifs, présentés et certifiés pour les collectionneurs.", "سلاسل سُحبت من التداول وأوراق تذكارية، مقدّمة ومصادق عليها لهواة الجمع.", "Series retiradas y billetes conmemorativos, presentados y certificados para coleccionistas."),
 ("shop.3", "Outils pour collectionneurs", "Outils pour collectionneurs", "أدوات هواة الجمع", "Herramientas para coleccionistas"),
 ("shop.3.text", "Loupes, capsules, albums and gloves — everything to study and protect a collection.", "Loupes, capsules, albums et gants : tout pour étudier et protéger une collection.", "عدسات مكبّرة وكبسولات وألبومات وقفازات: كل ما يلزم لدراسة المجموعة وحمايتها.", "Lupas, cápsulas, álbumes y guantes: todo para estudiar y proteger una colección."),
 ("shop.4", "Articles souvenirs", "Articles souvenirs", "التذكارات", "Recuerdos"),
 ("shop.4.text", "Objects inspired by the collections, made to be kept and given.", "Des objets inspirés des collections, faits pour être gardés et offerts.", "قطع مستوحاة من المجموعات، صُنعت لتُقتنى وتُهدى.", "Objetos inspirados en las colecciones, hechos para guardar y regalar."),
 ("shop.5", "Ouvrages", "Ouvrages", "الإصدارات", "Publicaciones"),
 ("shop.5.text", "Catalogues, numismatic studies and art books published by the museum.", "Catalogues, études numismatiques et livres d’art publiés par le musée.", "كتالوجات ودراسات في علم المسكوكات وكتب فنية من إصدار المتحف.", "Catálogos, estudios numismáticos y libros de arte publicados por el museo."),

 # visit
 ("visit.eyebrow", "Plan your visit", "Préparer votre visite", "خطّط لزيارتك", "Planifica tu visita"),
 ("visit.title", "Come slowly. <em>Stay long.</em>", "Venez sans hâte. <em>Restez longtemps.</em>", "تعالَ على مهل. <em>وأطِل البقاء.</em>", "Ven sin prisa. <em>Quédate mucho.</em>"),
 ("visit.hours", "Hours", "Horaires", "أوقات الزيارة", "Horario"),
 ("visit.tuesat", "Tuesday – Saturday", "Mardi – samedi", "الثلاثاء – السبت", "Martes – sábado"),
 ("visit.sun", "Sunday", "Dimanche", "الأحد", "Domingo"),
 ("visit.mon", "Monday &amp; public holidays", "Lundi et jours fériés", "الاثنين والعطل الرسمية", "Lunes y festivos"),
 ("visit.closed", "Closed", "Fermé", "مغلق", "Cerrado"),
 ("visit.last", "Last entry 45 minutes before closing.", "Dernière entrée 45 minutes avant la fermeture.", "آخر دخول قبل 45 دقيقة من الإغلاق.", "Última entrada 45 minutos antes del cierre."),
 ("visit.location", "Location", "Accès", "الموقع", "Ubicación"),
 ("visit.tram", "Tram line 1 · Station Mohammed V – Gare de Rabat Ville, 4 minutes on foot.", "Tramway ligne 1 · Station Mohammed V – Gare de Rabat Ville, à 4 minutes à pied.", "الترامواي الخط 1 · محطة محمد الخامس – محطة الرباط المدينة، على بعد 4 دقائق مشياً.", "Tranvía línea 1 · Parada Mohammed V – Estación Rabat Ville, a 4 minutos a pie."),
 ("visit.maps", "Open in maps <span aria-hidden=\"true\">↗</span>", "Ouvrir dans un plan <span aria-hidden=\"true\">↗</span>", "افتح في الخريطة <span aria-hidden=\"true\">↗</span>", "Abrir en el mapa <span aria-hidden=\"true\">↗</span>"),
 ("visit.admission", "Admission", "Tarifs", "التذاكر والأسعار", "Tarifas"),
 ("visit.adult", "Adult", "Adulte", "بالغ", "Adulto"),
 ("visit.reduced", "Reduced <small>students, 60+</small>", "Réduit <small>étudiants, 60 ans et +</small>", "مخفّض <small>الطلبة، 60 سنة فما فوق</small>", "Reducida <small>estudiantes, mayores de 60</small>"),
 ("visit.under18", "Under 18", "Moins de 18 ans", "أقل من 18 سنة", "Menores de 18"),
 ("visit.free", "Free", "Gratuit", "مجاني", "Gratis"),
 ("visit.tour", "Guided tour <small>add-on</small>", "Visite guidée <small>en option</small>", "جولة بمرافقة مرشد <small>اختيارية</small>", "Visita guiada <small>opcional</small>"),

 # tickets
 ("tix.title", "Book tickets", "Réserver des billets", "احجز تذاكرك", "Reservar entradas"),
 ("tix.s1", "<span class=\"steps__num\">1</span> Date", "<span class=\"steps__num\">1</span> Date", "<span class=\"steps__num\">1</span> التاريخ", "<span class=\"steps__num\">1</span> Fecha"),
 ("tix.s2", "<span class=\"steps__num\">2</span> Tickets", "<span class=\"steps__num\">2</span> Billets", "<span class=\"steps__num\">2</span> التذاكر", "<span class=\"steps__num\">2</span> Entradas"),
 ("tix.s3", "<span class=\"steps__num\">3</span> Confirm", "<span class=\"steps__num\">3</span> Confirmation", "<span class=\"steps__num\">3</span> التأكيد", "<span class=\"steps__num\">3</span> Confirmar"),
 ("tix.day", "Choose a day <span class=\"step__sub\">Closed on Mondays</span>", "Choisissez un jour <span class=\"step__sub\">Fermé le lundi</span>", "اختر يوماً <span class=\"step__sub\">مغلق يوم الاثنين</span>", "Elige un día <span class=\"step__sub\">Cerrado los lunes</span>"),
 ("tix.noscript", "Booking requires JavaScript. Please call the museum or buy tickets on site.", "La réservation nécessite JavaScript. Appelez le musée ou achetez vos billets sur place.", "يتطلّب الحجز تفعيل JavaScript. يرجى الاتصال بالمتحف أو شراء التذاكر في عين المكان.", "La reserva necesita JavaScript. Llama al museo o compra las entradas en taquilla."),
 ("tix.entry", "Entry time", "Heure d’entrée", "وقت الدخول", "Hora de entrada"),
 ("tix.who", "Who’s coming? <span class=\"step__sub\">Children under 18 enter free</span>", "Qui vient ? <span class=\"step__sub\">Entrée gratuite pour les moins de 18 ans</span>", "من سيحضر؟ <span class=\"step__sub\">الدخول مجاني لمن هم دون 18 سنة</span>", "¿Quién viene? <span class=\"step__sub\">Entrada gratuita para menores de 18</span>"),
 ("tix.adult.price", "20 MAD", "20 MAD", "20 درهم", "20 MAD"),
 ("tix.reduced.price", "10 MAD · students, 60+", "10 MAD · étudiants, 60 ans et +", "10 دراهم · الطلبة، 60 سنة فما فوق", "10 MAD · estudiantes, mayores de 60"),
 ("tix.reduced", "Reduced", "Réduit", "مخفّض", "Reducida"),
 ("tix.addtour", "Add a guided tour <small>+30 MAD per group · 60 minutes</small>", "Ajouter une visite guidée <small>+30 MAD par groupe · 60 minutes</small>", "أضف جولة بمرافقة مرشد <small>+30 درهماً للمجموعة · 60 دقيقة</small>", "Añadir una visita guiada <small>+30 MAD por grupo · 60 minutos</small>"),
 ("tix.where", "Where should we send your tickets?", "Où devons-nous envoyer vos billets ?", "إلى أين نرسل تذاكرك؟", "¿Adónde enviamos tus entradas?"),
 ("tix.name", "Full name", "Nom complet", "الاسم الكامل", "Nombre completo"),
 ("tix.email", "Email", "E-mail", "البريد الإلكتروني", "Correo electrónico"),
 ("tix.confirmed", "Booking confirmed", "Réservation confirmée", "تم تأكيد الحجز", "Reserva confirmada"),
 ("tix.ics", "Add to calendar", "Ajouter à l’agenda", "أضف إلى التقويم", "Añadir al calendario"),
 ("tix.again", "Book another visit", "Réserver une autre visite", "احجز زيارة أخرى", "Reservar otra visita"),
 ("tix.back", "Back", "Retour", "رجوع", "Atrás"),
 ("tix.yourvisit", "Your visit", "Votre visite", "زيارتك", "Tu visita"),
 ("tix.sum.date", "Date", "Date", "التاريخ", "Fecha"),
 ("tix.sum.entry", "Entry", "Entrée", "الدخول", "Entrada"),
 ("tix.sum.tickets", "Tickets", "Billets", "التذاكر", "Entradas"),
 ("tix.total", "Total", "Total", "المجموع", "Total"),

 # events
 ("ev.eyebrow", "What’s on", "À l’affiche", "البرنامج", "Programación"),
 ("ev.title", "Events <em>calendar</em>", "Agenda <em>culturel</em>", "أجندة <em>الفعاليات</em>", "Agenda <em>cultural</em>"),
 ("ev.all", "All", "Tout", "الكل", "Todo"),
 ("ev.talks", "Talks", "Conférences", "محاضرات", "Conferencias"),
 ("ev.tours", "Tours", "Visites", "جولات", "Visitas"),
 ("ev.workshops", "Workshops", "Ateliers", "ورشات", "Talleres"),
 ("ev.family", "Family", "Famille", "العائلة", "Familia"),
 ("ev.music", "Music", "Musique", "موسيقى", "Música"),
 ("ev.t.talk", "Talk", "Conférence", "محاضرة", "Conferencia"),
 ("ev.t.tour", "Tour", "Visite", "جولة", "Visita"),
 ("ev.t.workshop", "Workshop", "Atelier", "ورشة", "Taller"),
 ("ev.1.title", "Struck in Paris: the curator’s view", "Frappé à Paris : le regard du commissaire", "«ضُرب بباريس»: رؤية المندوب", "Acuñado en París: la mirada del comisario"),
 ("ev.1.desc", "The exhibition’s curator on commissioning a currency abroad.", "Le commissaire de l’exposition raconte la commande d’une monnaie à l’étranger.", "مندوب المعرض يتحدّث عن طلب سكّ عملة في الخارج.", "El comisario de la exposición sobre el encargo de una moneda en el extranjero."),
 ("ev.2.title", "Design your own coin", "Dessine ta propre pièce", "صمّم قطعتك النقدية", "Diseña tu propia moneda"),
 ("ev.2.desc", "Rubbings, stamps and clay for ages 6–12. Parents welcome.", "Frottages, tampons et argile pour les 6-12 ans. Parents bienvenus.", "نسخ بالفرك وأختام وصلصال للأطفال من 6 إلى 12 سنة. الآباء مرحَّب بهم.", "Calcos, sellos y arcilla para niños de 6 a 12 años. Padres bienvenidos."),
 ("ev.3.title", "Twelve centuries in sixty minutes", "Douze siècles en soixante minutes", "اثنا عشر قرناً في ستين دقيقة", "Doce siglos en sesenta minutos"),
 ("ev.3.desc", "A guided walk through the numismatics galleries.", "Une visite guidée des galeries de numismatique.", "جولة مصحوبة بمرشد في قاعات المسكوكات.", "Un recorrido guiado por las salas de numismática."),
 ("ev.4.title", "Reading Maghrebi calligraphy on coins", "Lire la calligraphie maghrébine sur les monnaies", "قراءة الخط المغربي على النقود", "Leer la caligrafía magrebí en las monedas"),
 ("ev.4.desc", "Learn to decipher mint names and dates with a magnifier in hand.", "Apprenez à déchiffrer noms d’ateliers et dates, loupe en main.", "تعلّم فكّ أسماء دور السكّ والتواريخ والعدسة في يدك.", "Aprende a descifrar nombres de cecas y fechas, lupa en mano."),
 ("ev.5.title", "Andalusian nights in the galleries", "Nuits andalouses dans les galeries", "ليالٍ أندلسية في القاعات", "Noches andalusíes en las galerías"),
 ("ev.5.desc", "A late opening with a chamber ensemble among the collections.", "Une nocturne avec un ensemble de chambre au milieu des collections.", "فتح ليلي مع فرقة موسيقى الحجرة بين المجموعات.", "Una apertura nocturna con un conjunto de cámara entre las colecciones."),
 ("ev.6.title", "What makes a banknote hard to fake?", "Qu’est-ce qui rend un billet difficile à contrefaire ?", "ما الذي يجعل تزوير الورقة النقدية صعباً؟", "¿Qué hace que un billete sea difícil de falsificar?"),
 ("ev.6.desc", "Security features explained, from watermark to hologram.", "Les signes de sécurité expliqués, du filigrane à l’hologramme.", "شرح عناصر الأمان، من العلامة المائية إلى الصورة المجسّمة.", "Los elementos de seguridad explicados, de la marca de agua al holograma."),
 ("ev.7.title", "Modern Moroccan painting", "La peinture marocaine moderne", "الرسم المغربي الحديث", "La pintura marroquí moderna"),
 ("ev.7.desc", "A walk through the Bank Al-Maghrib art collection.", "Une promenade dans la collection d’art de Bank Al-Maghrib.", "جولة في المجموعة الفنية لبنك المغرب.", "Un paseo por la colección de arte de Bank Al-Maghrib."),
 ("ev.8.title", "Treasure trail", "Chasse au trésor", "البحث عن الكنز", "Búsqueda del tesoro"),
 ("ev.8.desc", "A self-guided hunt through the galleries, with a prize at the Boutique.", "Un parcours en autonomie dans les galeries, avec une récompense à la Boutique.", "مسار ذاتي عبر القاعات، مع جائزة في المتجر.", "Un recorrido libre por las galerías, con premio en la Tienda."),
 ("ev.9.title", "Photographing small objects", "Photographier les petits objets", "تصوير القطع الصغيرة", "Fotografiar objetos pequeños"),
 ("ev.9.desc", "Light, macro lenses and patience — shoot the collection like a pro.", "Lumière, objectifs macro et patience : photographiez la collection comme un pro.", "الضوء والعدسات المقرّبة والصبر: صوّر المجموعة كالمحترفين.", "Luz, objetivos macro y paciencia: fotografía la colección como un profesional."),
 ("ev.10.title", "Oud at dusk", "Oud au crépuscule", "عودٌ عند الغروب", "Laúd al atardecer"),
 ("ev.10.desc", "Solo recital to close the year.", "Un récital en solo pour clore l’année.", "أمسية عزف منفرد لاختتام السنة.", "Un recital en solitario para cerrar el año."),
 ("ev.time.aud1830", "18:30 · Auditorium", "18h30 · Auditorium", "18:30 · قاعة المحاضرات", "18:30 · Auditorio"),
 ("ev.time.studio1030", "10:30 · Learning studio", "10h30 · Atelier pédagogique", "10:30 · الورشة التربوية", "10:30 · Taller educativo"),
 ("ev.time.hall1100", "11:00 · Main hall", "11h00 · Grand hall", "11:00 · البهو الرئيسي", "11:00 · Vestíbulo principal"),
 ("ev.time.studio1400", "14:00 · Learning studio", "14h00 · Atelier pédagogique", "14:00 · الورشة التربوية", "14:00 · Taller educativo"),
 ("ev.time.arts1930", "19:30 · Arts galleries", "19h30 · Galeries des arts", "19:30 · قاعات الفنون", "19:30 · Galerías de arte"),
 ("ev.time.arts1100", "11:00 · Arts galleries", "11h00 · Galeries des arts", "11:00 · قاعات الفنون", "11:00 · Galerías de arte"),
 ("ev.time.allday", "All day · Free with entry", "Toute la journée · Inclus dans le billet", "طوال اليوم · مجاناً مع تذكرة الدخول", "Todo el día · Incluido con la entrada"),
 ("ev.time.hall1900", "19:00 · Main hall", "19h00 · Grand hall", "19:00 · البهو الرئيسي", "19:00 · Vestíbulo principal"),
 ("ev.empty", "No events of this type are scheduled yet — check back soon.", "Aucun événement de ce type n’est encore programmé. Revenez bientôt.", "لا توجد فعاليات من هذا النوع حالياً، عُد قريباً.", "Aún no hay actividades de este tipo. Vuelve pronto."),

 # footer
 ("ft.title", "Letters from the <em>vault.</em>", "Lettres de la <em>chambre forte.</em>", "رسائل من <em>الخزنة.</em>", "Cartas desde la <em>cámara.</em>"),
 ("ft.text", "New exhibitions, events and the occasional story from the collection — once a month, never more.", "Nouvelles expositions, événements et, parfois, une histoire tirée de la collection : une fois par mois, jamais plus.", "معارض جديدة وفعاليات، وأحياناً حكاية من المجموعة: مرة في الشهر، لا أكثر.", "Nuevas exposiciones, actividades y, de vez en cuando, una historia de la colección: una vez al mes, nunca más."),
 ("ft.emaillabel", "Email address", "Adresse e-mail", "البريد الإلكتروني", "Correo electrónico"),
 ("ft.subscribe", "Subscribe", "S’abonner", "اشترك", "Suscribirse"),
 ("ft.a11y", "Accessibility", "Accessibilité", "إمكانية الولوج", "Accesibilidad"),
 ("ft.a11y.1", "Step-free entrance and lifts to every floor", "Entrée de plain-pied et ascenseurs à tous les étages", "مدخل بدون درج ومصاعد إلى جميع الطوابق", "Entrada sin escalones y ascensores a todas las plantas"),
 ("ft.a11y.2", "Wheelchairs available on request", "Fauteuils roulants disponibles sur demande", "كراسٍ متحركة متوفرة عند الطلب", "Sillas de ruedas disponibles bajo petición"),
 ("ft.a11y.3", "Large-print guides and audio descriptions", "Guides en gros caractères et audiodescriptions", "أدلة بخط كبير ووصف صوتي", "Guías en letra grande y audiodescripciones"),
 ("ft.a11y.4", "Assistance dogs welcome", "Chiens d’assistance bienvenus", "كلاب المساعدة مرحَّب بها", "Se admiten perros de asistencia"),
 ("ft.a11y.5", "Free entry for a companion", "Entrée gratuite pour un accompagnateur", "دخول مجاني لمرافق واحد", "Entrada gratuita para un acompañante"),
 ("ft.follow", "Follow", "Suivre", "تابعونا", "Síguenos"),
 ("ft.hours", "Hours &amp; admission", "Horaires et tarifs", "الأوقات والأسعار", "Horario y tarifas"),
 ("ft.book", "Book tickets", "Réserver des billets", "احجز تذاكرك", "Reservar entradas"),
 ("ft.motion", "Reduce motion", "Réduire les animations", "تقليل الحركة", "Reducir animaciones"),
 ("ft.copy", "© 2026 Musées de Bank Al-Maghrib · Rabat", "© 2026 Musées de Bank Al-Maghrib · Rabat", "© 2026 متاحف بنك المغرب · الرباط", "© 2026 Musées de Bank Al-Maghrib · Rabat"),
]

ATTR = [
 ("a.brand", "aria-label", "Musées de Bank Al-Maghrib — back to top", "Musées de Bank Al-Maghrib — retour en haut", "متاحف بنك المغرب — العودة إلى الأعلى", "Musées de Bank Al-Maghrib — volver arriba"),
 ("a.navPrimary", "aria-label", "Primary", "Navigation principale", "التنقل الرئيسي", "Navegación principal"),
 ("a.lookCloser", "data-cursor", "Look closer", "Regarder de près", "انظر عن قرب", "Mirar de cerca"),
 ("a.zoom", "data-cursor", "Zoom", "Zoom", "تكبير", "Zoom"),
 ("a.view", "data-cursor", "View", "Voir", "عرض", "Ver"),
 ("a.heroAlt", "alt", "Hundreds of bimetallic coin blanks — golden rings around silver cores — heaped under warm gallery light.", "Des centaines de flans bimétalliques – anneaux dorés autour de cœurs argentés – amassés sous une lumière chaude.", "مئات الأقراص ثنائية المعدن – حلقات ذهبية حول قلوب فضية – مكدّسة تحت ضوء دافئ.", "Cientos de cospeles bimetálicos –anillos dorados alrededor de núcleos plateados– amontonados bajo una luz cálida."),
 ("a.cue", "aria-label", "Scroll to begin the visit", "Faites défiler pour commencer la visite", "مرّر لبدء الزيارة", "Desplázate para empezar la visita"),
 ("a.vitrineAlt", "alt", "A lit museum vitrine set into a blue wall, displaying five coins of Moulay al-Hassan I.", "Une vitrine éclairée dans un mur bleu, présentant cinq pièces de Moulay al-Hassan Ier.", "واجهة متحفية مضاءة في جدار أزرق تعرض خمس قطع لمولاي الحسن الأول.", "Una vitrina iluminada en una pared azul con cinco monedas de Mulay al-Hasan I."),
 ("a.blanksAlt", "alt", "Close view of gold-ringed coin blanks resting on one another.", "Vue rapprochée de flans à anneau doré posés les uns sur les autres.", "منظر قريب لأقراص بحلقات ذهبية متراكبة.", "Vista cercana de cospeles con anillo dorado apoyados unos sobre otros."),
 ("a.exhibitAlt", "alt", "Vitrine of five Hassani coins, each shown obverse above reverse, labelled in Arabic and French.", "Vitrine de cinq pièces hassanies, chacune montrée avers au-dessus du revers, avec des cartels en arabe et en français.", "واجهة تضم خمس قطع حسنية، يظهر وجه كل منها فوق ظهرها، مع بطاقات بالعربية والفرنسية.", "Vitrina con cinco monedas hasaníes, cada una con el anverso sobre el reverso, con cartelas en árabe y francés."),
 ("a.cap1", "data-caption", "The vitrine — five coins, obverse above reverse.", "La vitrine : cinq pièces, l’avers au-dessus du revers.", "الواجهة: خمس قطع، الوجه فوق الظهر.", "La vitrina: cinco monedas, el anverso sobre el reverso."),
 ("a.cap2", "data-caption", "Obverse — the legend ‘struck in Paris’.", "Avers : la légende « frappé à Paris ».", "الوجه: عبارة «ضُرب بباريس».", "Anverso: la leyenda «acuñado en París»."),
 ("a.cap3", "data-caption", "Reverse — the year 1306 of the Hijra.", "Revers : l’an 1306 de l’Hégire.", "الظهر: عام 1306 للهجرة.", "Reverso: el año 1306 de la Hégira."),
 ("a.cap4", "data-caption", "The smallest bronze in the case.", "Le plus petit bronze de la vitrine.", "أصغر قطعة برونزية في الواجهة.", "El bronce más pequeño de la vitrina."),
 ("a.cap5", "data-caption", "Silver — dated 1311, the final years of the reign.", "Argent : daté de 1311, les dernières années du règne.", "فضة: مؤرّخة بعام 1311، آخر سنوات العهد.", "Plata: fechada en 1311, los últimos años del reinado."),
 ("a.prevStory", "aria-label", "Previous story", "Récit précédent", "الحكاية السابقة", "Historia anterior"),
 ("a.nextStory", "aria-label", "Next story", "Récit suivant", "الحكاية التالية", "Historia siguiente"),
 ("a.z1", "aria-label", "Zoom: Struck in Paris, obverse and reverse", "Agrandir : Frappé à Paris, avers et revers", "تكبير: ضُرب بباريس، الوجه والظهر", "Ampliar: Acuñado en París, anverso y reverso"),
 ("a.z2", "aria-label", "Zoom: The last silver, obverse and reverse", "Agrandir : Le dernier argent, avers et revers", "تكبير: آخر الفضّة، الوجه والظهر", "Ampliar: La última plata, anverso y reverso"),
 ("a.z3", "aria-label", "Zoom: Dark patina, obverse and reverse", "Agrandir : Patine sombre, avers et revers", "تكبير: زنجار داكن، الوجه والظهر", "Ampliar: Pátina oscura, anverso y reverso"),
 ("a.z4", "aria-label", "Zoom: Border of stars, obverse and reverse", "Agrandir : Bordure d’étoiles, avers et revers", "تكبير: إطار من النجوم، الوجه والظهر", "Ampliar: Orla de estrellas, anverso y reverso"),
 ("a.z5", "aria-label", "Zoom: Change for the souk, obverse and reverse", "Agrandir : La monnaie du souk, avers et revers", "تكبير: صرف السوق، الوجه والظهر", "Ampliar: Cambio para el zoco, anverso y reverso"),
 ("a.z6", "aria-label", "Zoom: Before the strike", "Agrandir : Avant la frappe", "تكبير: قبل السكّ", "Ampliar: Antes de la acuñación"),
 ("a.z7", "aria-label", "Zoom: Two metals, one coin", "Agrandir : Deux métaux, une pièce", "تكبير: معدنان، قطعة واحدة", "Ampliar: Dos metales, una moneda"),
 ("a.collections", "aria-label", "Collections", "Collections", "المجموعات", "Colecciones"),
 ("a.periods", "aria-label", "Timeline periods", "Périodes de la frise", "حقب الخط الزمني", "Periodos de la cronología"),
 ("a.artworks", "aria-label", "Artworks — photographs coming soon", "Œuvres — photographies à venir", "الأعمال الفنية — الصور قريباً", "Obras — fotografías próximamente"),
 ("a.steps", "aria-label", "Booking progress", "Étapes de la réservation", "مراحل الحجز", "Pasos de la reserva"),
 ("a.entryTime", "aria-label", "Entry time", "Heure d’entrée", "وقت الدخول", "Hora de entrada"),
 ("a.remAdult", "aria-label", "Remove one adult ticket", "Retirer un billet adulte", "إزالة تذكرة بالغ", "Quitar una entrada de adulto"),
 ("a.addAdult", "aria-label", "Add one adult ticket", "Ajouter un billet adulte", "إضافة تذكرة بالغ", "Añadir una entrada de adulto"),
 ("a.remRed", "aria-label", "Remove one reduced ticket", "Retirer un billet réduit", "إزالة تذكرة مخفّضة", "Quitar una entrada reducida"),
 ("a.addRed", "aria-label", "Add one reduced ticket", "Ajouter un billet réduit", "إضافة تذكرة مخفّضة", "Añadir una entrada reducida"),
 ("a.remChild", "aria-label", "Remove one under-18 ticket", "Retirer un billet moins de 18 ans", "إزالة تذكرة لأقل من 18 سنة", "Quitar una entrada de menor de 18"),
 ("a.addChild", "aria-label", "Add one under-18 ticket", "Ajouter un billet moins de 18 ans", "إضافة تذكرة لأقل من 18 سنة", "Añadir una entrada de menor de 18"),
 ("a.summary", "aria-label", "Booking summary", "Récapitulatif de la réservation", "ملخّص الحجز", "Resumen de la reserva"),
 ("a.filters", "aria-label", "Filter events by type", "Filtrer les événements par type", "تصفية الفعاليات حسب النوع", "Filtrar actividades por tipo"),
 ("a.close", "aria-label", "Close zoom view", "Fermer l’agrandissement", "إغلاق العرض المكبّر", "Cerrar la ampliación"),
 ("a.logo", "alt", "Musée de Bank Al-Maghrib — متحف بنك المغرب", "Musée de Bank Al-Maghrib — متحف بنك المغرب", "متحف بنك المغرب — Musée de Bank Al-Maghrib", "Musée de Bank Al-Maghrib — متحف بنك المغرب"),
]

JS = [
 ("meta.title", "Musées de Bank Al-Maghrib — Numismatics, Arts & Boutique", "Musées de Bank Al-Maghrib — Numismatique, Arts et Boutique", "متاحف بنك المغرب — المسكوكات والفنون والمتجر", "Musées de Bank Al-Maghrib — Numismática, Artes y Tienda"),
 ("meta.desc", "Walk through twelve centuries of Moroccan money and art at the Musées de Bank Al-Maghrib in Rabat. Current exhibitions, collection highlights, events and tickets.", "Parcourez douze siècles de monnaie et d’art marocains aux Musées de Bank Al-Maghrib à Rabat. Expositions, collections, agenda et billetterie.", "رحلة عبر اثني عشر قرناً من النقود والفن المغربيين في متاحف بنك المغرب بالرباط. المعارض والمجموعات والفعاليات والتذاكر.", "Recorre doce siglos de dinero y arte marroquíes en los Musées de Bank Al-Maghrib, en Rabat. Exposiciones, colecciones, agenda y entradas."),
 ("lang.label", "Language", "Langue", "اللغة", "Idioma"),
 ("stories.scroll", "Scroll to travel · select a coin to zoom", "Faites défiler · sélectionnez une pièce pour l’agrandir", "مرّر للتنقّل · اختر قطعة لتكبيرها", "Desplázate · elige una moneda para ampliarla"),
 ("stories.swipe", "Swipe to travel · tap a coin to zoom", "Balayez · touchez une pièce pour l’agrandir", "اسحب للتنقّل · المس قطعة لتكبيرها", "Desliza · toca una moneda para ampliarla"),
 ("coin.alt3d", "The coin, shown in 3D with its obverse and reverse.", "La pièce, présentée en 3D avec son avers et son revers.", "القطعة معروضة بثلاثة أبعاد بوجهها وظهرها.", "La moneda, mostrada en 3D con su anverso y su reverso."),
 ("coin.dragHelp", "Drag or use the arrow keys to turn it.", "Faites-la glisser ou utilisez les flèches pour la tourner.", "اسحبها أو استعمل مفاتيح الأسهم لتدويرها.", "Arrástrala o usa las flechas para girarla."),
 ("coin.side", "Show side", "Afficher la face", "إظهار الجهة", "Mostrar cara"),
 ("coin.obverse", "Obverse", "Avers", "الوجه", "Anverso"),
 ("coin.reverse", "Reverse", "Revers", "الظهر", "Reverso"),
 ("coin.drag", "Drag to turn", "Glisser pour tourner", "اسحب للتدوير", "Arrastra para girar"),
 ("blanks.alt", "Coin blanks, enlarged", "Flans monétaires, agrandis", "أقراص نقدية خام، مكبّرة", "Cospeles, ampliados"),
 ("tl.enlarge", "Enlarge: {x}", "Agrandir : {x}", "تكبير: {x}", "Ampliar: {x}"),
 ("tl.photo", "photo", "photo", "صورة", "foto"),
 ("tl.photoSoon", "Photo à venir", "Photo à venir", "الصورة قريباً", "Foto próximamente"),
 ("tl.descSoon", "Description à venir.", "Description à venir.", "الوصف قريباً.", "Descripción próximamente."),
 ("tl.counts", "{p} photos · {d} descriptions", "{p} photos · {d} descriptions", "{p} صورة · {d} وصفاً", "{p} fotos · {d} descripciones"),
 ("tl.rail", "{label} — {n} of {total} photos available", "{label} — {n} photos disponibles sur {total}", "{label} — {n} من أصل {total} صورة متاحة", "{label} — {n} de {total} fotos disponibles"),
 ("tl.left", "Scroll photos left", "Faire défiler vers la gauche", "تمرير الصور إلى اليسار", "Desplazar fotos a la izquierda"),
 ("tl.right", "Scroll photos right", "Faire défiler vers la droite", "تمرير الصور إلى اليمين", "Desplazar fotos a la derecha"),
 ("tl.descAvail", "{n} of {total} descriptions available.", "{n} descriptions disponibles sur {total}.", "{n} من أصل {total} وصفاً متاحاً.", "{n} de {total} descripciones disponibles."),
 ("tl.phase", "Historical phase", "Phase historique", "الحقبة التاريخية", "Fase histórica"),
 ("tl.to", "to", "à", "إلى", "a"),
 ("motion.on", "Motion reduced", "Animations réduites", "الحركة مقلّصة", "Animaciones reducidas"),
 ("motion.off", "Reduce motion", "Réduire les animations", "تقليل الحركة", "Reducir animaciones"),
 ("motion.system", "Reduced motion is set by your system", "Les animations réduites sont réglées par votre système", "تقليل الحركة مضبوط من نظامك", "Tu sistema tiene activadas las animaciones reducidas"),
 ("cal.prev", "Previous month", "Mois précédent", "الشهر السابق", "Mes anterior"),
 ("cal.next", "Next month", "Mois suivant", "الشهر التالي", "Mes siguiente"),
 ("cal.closed", "{date}, closed", "{date}, fermé", "{date}، مغلق", "{date}, cerrado"),
 ("cal.unavailable", "{date}, unavailable", "{date}, indisponible", "{date}، غير متاح", "{date}, no disponible"),
 ("cal.selected", "Selected {date}.", "{date} sélectionné.", "تم اختيار {date}.", "Seleccionado: {date}."),
 ("tix.adult.one", "{n} adult", "{n} adulte", "بالغ ×{n}", "{n} adulto"),
 ("tix.adult.other", "{n} adults", "{n} adultes", "بالغ ×{n}", "{n} adultos"),
 ("tix.reduced.one", "{n} reduced", "{n} tarif réduit", "مخفّض ×{n}", "{n} reducida"),
 ("tix.reduced.other", "{n} reduced", "{n} tarifs réduits", "مخفّض ×{n}", "{n} reducidas"),
 ("tix.child.one", "{n} under 18", "{n} moins de 18 ans", "أقل من 18 سنة ×{n}", "{n} menor de 18"),
 ("tix.child.other", "{n} under 18", "{n} moins de 18 ans", "أقل من 18 سنة ×{n}", "{n} menores de 18"),
 ("tix.tourItem", "guided tour", "visite guidée", "جولة بمرشد", "visita guiada"),
 ("tix.free", "Free", "Gratuit", "مجاني", "Gratis"),
 ("tix.mad", "{n} MAD", "{n} MAD", "{n} درهم", "{n} MAD"),
 ("tix.continue", "Continue", "Continuer", "متابعة", "Continuar"),
 ("tix.confirm", "Confirm · {total}", "Confirmer · {total}", "تأكيد · {total}", "Confirmar · {total}"),
 ("tix.step", "Step {n} of 3.", "Étape {n} sur 3.", "المرحلة {n} من 3.", "Paso {n} de 3."),
 ("tix.done", "Booking confirmed.", "Réservation confirmée.", "تم تأكيد الحجز.", "Reserva confirmada."),
 ("tix.emailErr", "Please enter a valid email address, e.g. name@example.com.", "Veuillez saisir une adresse e-mail valide, par ex. nom@exemple.com.", "يرجى إدخال بريد إلكتروني صحيح، مثل name@example.com.", "Introduce un correo válido, p. ej. nombre@ejemplo.com."),
 ("done.title", "See you on {date}.", "À bientôt, le {date}.", "نلقاك يوم {date}.", "Nos vemos el {date}."),
 ("done.when", "{date} at {time}", "{date} à {time}", "{date} على الساعة {time}", "{date} a las {time}"),
 ("done.body", "Your reference is {ref}. A confirmation has been sent to {email}.", "Votre référence est {ref}. Une confirmation a été envoyée à {email}.", "رقم حجزك هو {ref}. أُرسل تأكيد إلى {email}.", "Tu referencia es {ref}. Hemos enviado una confirmación a {email}."),
 ("ics.summary", "Visit — Musées de Bank Al-Maghrib", "Visite — Musées de Bank Al-Maghrib", "زيارة — متاحف بنك المغرب", "Visita — Musées de Bank Al-Maghrib"),
 ("ics.booking", "Booking", "Réservation", "حجز", "Reserva"),
 ("ev.shown.one", "{n} event shown.", "{n} événement affiché.", "عدد الفعاليات المعروضة: {n}.", "{n} actividad mostrada."),
 ("ev.shown.other", "{n} events shown.", "{n} événements affichés.", "عدد الفعاليات المعروضة: {n}.", "{n} actividades mostradas."),
 ("news.ok", "Thank you — the first letter arrives next month.", "Merci ! La première lettre arrivera le mois prochain.", "شكراً لك، ستصلك الرسالة الأولى الشهر المقبل.", "¡Gracias! La primera carta llegará el mes que viene."),
 ("news.err", "Please enter a valid email address.", "Veuillez saisir une adresse e-mail valide.", "يرجى إدخال بريد إلكتروني صحيح.", "Introduce un correo electrónico válido."),
 ("addr", "Musées de Bank Al-Maghrib<br>Avenue Mohammed V<br>Rabat, Morocco", "Musées de Bank Al-Maghrib<br>Avenue Mohammed V<br>Rabat, Maroc", "متاحف بنك المغرب<br>شارع محمد الخامس<br>الرباط، المغرب", "Musées de Bank Al-Maghrib<br>Avenida Mohammed V<br>Rabat, Marruecos"),
]

HTML += [
 ("visit.p10", "10 MAD", "10 MAD", "10 دراهم", "10 MAD"),
 ("visit.p30", "+30 MAD", "+30 MAD", "+30 درهماً", "+30 MAD"),
]
for i in range(1, 9):
    HTML.append((f"art.w{i}", f"Œuvre 0{i}", f"Œuvre 0{i}", f"عمل 0{i}", f"Obra 0{i}"))

HTML += [
 ("shop.see", "See the coins <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Voir les pièces <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "اكتشف القطع <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Ver las monedas <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>"),
 ("shelf.title", "Commemorative coins", "Pièces commémoratives", "القطع النقدية التذكارية", "Monedas conmemorativas"),
 ("shelf.lede", "Silver pieces struck for the Kingdom’s great moments. Select a coin to turn it in your hand.", "Des pièces d’argent frappées pour les grands moments du Royaume. Sélectionnez une pièce pour la faire tourner.", "قطع فضية سُكّت احتفاءً باللحظات الكبرى للمملكة. اختر قطعة لتقلّبها بين يديك.", "Piezas de plata acuñadas para los grandes momentos del Reino. Elige una moneda para girarla en tu mano."),
]
ATTR += [
 ("a.railLeft", "aria-label", "Scroll photos left", "Faire défiler vers la gauche", "تمرير الصور إلى اليسار", "Desplazar fotos a la izquierda"),
 ("a.railRight", "aria-label", "Scroll photos right", "Faire défiler vers la droite", "تمرير الصور إلى اليمين", "Desplazar fotos a la derecha"),
]
JS += [
 ("shelf.rail", "Commemorative coins — {n} pieces", "Pièces commémoratives — {n} pièces", "القطع النقدية التذكارية — {n} قطع", "Monedas conmemorativas — {n} piezas"),
]

HTML += [
 ("shop.seeNotes", "See the banknotes <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Voir les billets <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "اكتشف الأوراق النقدية <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Ver los billetes <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>"),
 ("notes.title", "Withdrawn and commemorative banknotes", "Billets démonétisés et commémoratifs", "الأوراق النقدية الملغاة والتذكارية", "Billetes desmonetizados y conmemorativos"),
 ("notes.lede", "Notes from the first series of the dirham onwards, withdrawn from circulation and kept for collectors.", "Des billets depuis la première série du dirham, retirés de la circulation et conservés pour les collectionneurs.", "أوراق نقدية منذ أول سلسلة للدرهم، سُحبت من التداول وحُفظت لهواة الجمع.", "Billetes desde la primera serie del dírham, retirados de la circulación y conservados para coleccionistas."),
]
JS += [
 ("notes.rail", "Banknotes — {n} notes", "Billets — {n} billets", "الأوراق النقدية — {n} أوراق", "Billetes — {n} billetes"),
]

HTML += [
 ("shop.seeTools", "See the tools <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Voir les outils <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "اكتشف الأدوات <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Ver las herramientas <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>"),
 ("tools.title", "Collector’s tools", "Outils pour collectionneurs", "أدوات هواة الجمع", "Herramientas para coleccionistas"),
 ("tools.lede", "Everything to observe, measure, store and protect a collection: loupes, callipers, holders, sleeves, albums, binders and cases.", "Tout pour observer, mesurer, ranger et protéger une collection : loupes, pieds à coulisse, étuis, pochettes, albums, classeurs et coffrets.", "كل ما يلزم لتأمّل المجموعة وقياسها وترتيبها وحمايتها: عدسات مكبّرة وقدمات قنوية وحوافظ وأغلفة وألبومات ومجلّدات وعلب.", "Todo para observar, medir, ordenar y proteger una colección: lupas, calibres, cartones, fundas, álbumes, archivadores y estuches."),
]
JS += [
 ("tools.rail", "Collector’s tools — {n} items", "Outils pour collectionneurs — {n} articles", "أدوات هواة الجمع — {n} منتجات", "Herramientas para coleccionistas — {n} artículos"),
]

HTML += [
 ("shop.seeSouvenirs", "See the souvenirs <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Voir les souvenirs <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "اكتشف التذكارات <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Ver los recuerdos <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>"),
 ("souv.title", "Souvenirs", "Articles souvenirs", "التذكارات", "Recuerdos"),
 ("souv.lede", "Replicas, mugs, bags and clothing inspired by the coins, banknotes and paintings of the collections.", "Répliques, mugs, sacs et vêtements inspirés des pièces, des billets et des peintures des collections.", "نسخ مقلّدة وأكواب وحقائب وملابس مستوحاة من القطع والأوراق النقدية واللوحات في المجموعات.", "Réplicas, tazas, bolsas y ropa inspiradas en las monedas, los billetes y las pinturas de las colecciones."),
]
JS += [
 ("souv.rail", "Souvenirs — {n} items", "Articles souvenirs — {n} articles", "التذكارات — {n} منتجات", "Recuerdos — {n} artículos"),
]

HTML += [
 ("shop.seeBooks", "See the books <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Voir les ouvrages <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "اكتشف الإصدارات <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>", "Ver las publicaciones <span aria-hidden=\"true\" class=\"flip-rtl\">→</span>"),
 ("books.title", "Books", "Ouvrages", "الإصدارات", "Publicaciones"),
 ("books.lede", "Catalogues, exhibition books and studies published by the Bank Al-Maghrib Museum.", "Catalogues, livres d’exposition et études publiés par le Musée de Bank Al-Maghrib.", "كتالوجات وكتب معارض ودراسات من إصدار متحف بنك المغرب.", "Catálogos, libros de exposición y estudios publicados por el Museo de Bank Al-Maghrib."),
]
JS += [
 ("books.rail", "Books — {n} titles", "Ouvrages — {n} titres", "الإصدارات — {n} عناوين", "Publicaciones — {n} títulos"),
 ("book.front", "Cover", "Couverture", "الغلاف", "Cubierta"),
 ("book.back", "Back", "Dos", "الظهر", "Contracubierta"),
]

JS += [
 ("art.nav", "Art collection sections", "Parties de la collection artistique", "أقسام المجموعة الفنية", "Partes de la colección artística"),
 ("art.workSoon", "Work to come", "Œuvre à venir", "عمل قادم", "Obra próximamente"),
 ("art.works", "{label} — {n} of {total} works available", "{label} — {n} œuvres disponibles sur {total}", "{label} — {n} من أصل {total} أعمال متاحة", "{label} — {n} de {total} obras disponibles"),
]

JS += [
 ("art.room", "Room {n}", "Salle {n}", "القاعة {n}", "Sala {n}"),
 ("art.walk", "Scroll to walk through the room", "Faites défiler pour parcourir la salle", "مرّر للتجوّل في القاعة", "Desplázate para recorrer la sala"),
 ("art.swipe", "Swipe to walk through the room", "Balayez pour parcourir la salle", "اسحب للتجوّل في القاعة", "Desliza para recorrer la sala"),
 ("art.prev", "Previous painting", "Œuvre précédente", "العمل السابق", "Obra anterior"),
 ("art.next", "Next painting", "Œuvre suivante", "العمل التالي", "Obra siguiente"),
]

HTML += [
 ("houses.facade", "The Bank Al-Maghrib Museum, Rabat", "Le Musée de Bank Al-Maghrib, Rabat", "متحف بنك المغرب، الرباط", "El Museo de Bank Al-Maghrib, Rabat"),
]
ATTR += [
 ("a.facadeAlt", "alt", "The façade of the Bank Al-Maghrib Museum in Rabat: white walls, carved stone arches and the museum’s name in Arabic, Tifinagh and French.", "La façade du Musée de Bank Al-Maghrib à Rabat : murs blancs, arcs de pierre sculptée et nom du musée en arabe, en tifinagh et en français.", "واجهة متحف بنك المغرب بالرباط: جدران بيضاء وأقواس من الحجر المنحوت واسم المتحف بالعربية والتيفيناغ والفرنسية.", "La fachada del Museo de Bank Al-Maghrib en Rabat: muros blancos, arcos de piedra tallada y el nombre del museo en árabe, tifinagh y francés."),
 ("a.mosaicCoins", "aria-label", "Ancient coins from the collection: Lydia, Persia, Athens, Carthage and Rome.", "Monnaies antiques de la collection : Lydie, Perse, Athènes, Carthage et Rome.", "نقود قديمة من المجموعة: ليديا وفارس وأثينا وقرطاج وروما.", "Monedas antiguas de la colección: Lidia, Persia, Atenas, Cartago y Roma."),
 ("a.mosaicArt", "aria-label", "Paintings from the collection: Edwin Lord Weeks, Jacques Majorelle, Benjamin-Constant, Albert Marquet.", "Tableaux de la collection : Edwin Lord Weeks, Jacques Majorelle, Benjamin-Constant, Albert Marquet.", "لوحات من المجموعة: إدوين لورد ويكس وجاك ماجوريل وبنجامان كونستان وألبير ماركي.", "Cuadros de la colección: Edwin Lord Weeks, Jacques Majorelle, Benjamin-Constant, Albert Marquet."),
 ("a.mosaicShop", "aria-label", "Items from the Boutique: commemorative coins, banknotes, books, mugs, tote bags and a coin case.", "Articles de la Boutique : pièces commémoratives, billets, ouvrages, mugs, sacs en toile et coffret.", "منتجات من المتجر: قطع تذكارية وأوراق نقدية وكتب وأكواب وحقائب قماشية وعلبة.", "Artículos de la Tienda: monedas conmemorativas, billetes, libros, tazas, bolsas de tela y un estuche."),
]

# --- Visit: real hours, address and prices (October 2026) ---
HTML += [
 ("visit.tuesat", "Tuesday – Friday", "Mardi – vendredi", "الثلاثاء – الجمعة", "Martes – viernes"),
 ("visit.sat", "Saturday", "Samedi", "السبت", "Sábado"),
 ("visit.mon", "Monday &amp; religious holidays", "Lundi et fêtes religieuses", "الاثنين والأعياد الدينية", "Lunes y fiestas religiosas"),
 ("visit.reduced", "Group rate <small>from 3 people</small>", "Tarif groupe <small>à partir de 3 personnes</small>", "تعريفة المجموعات <small>ابتداءً من 3 أشخاص</small>", "Tarifa de grupo <small>a partir de 3 personas</small>"),
 ("visit.p10", "10 MAD / person", "10 MAD / personne", "10 دراهم للشخص", "10 MAD / persona"),
 ("visit.students", "Students", "Étudiants", "الطلبة", "Estudiantes"),
 ("visit.tour", "Guided tour", "Visite guidée", "جولة بمرافقة مرشد", "Visita guiada"),
 ("visit.p30", "On reservation (groups)", "Sur réservation (groupes)", "بالحجز المسبق (للمجموعات)", "Con reserva (grupos)"),
 ("tix.who", "Who’s coming? <span class=\"step__sub\">Free for students and under-18s · group rate from 3 people</span>", "Qui vient ? <span class=\"step__sub\">Gratuit pour les étudiants et les moins de 18 ans · tarif groupe dès 3 personnes</span>", "من سيحضر؟ <span class=\"step__sub\">الدخول مجاني للطلبة ولمن هم دون 18 سنة · تعريفة المجموعات ابتداءً من 3 أشخاص</span>", "¿Quién viene? <span class=\"step__sub\">Gratis para estudiantes y menores de 18 · tarifa de grupo desde 3 personas</span>"),
 ("tix.reduced", "Students", "Étudiants", "الطلبة", "Estudiantes"),
 ("tix.reduced.price", "Free · student card", "Gratuit · carte d’étudiant", "مجاني · بطاقة الطالب", "Gratis · carné de estudiante"),
 ("tix.addtour", "Request a guided tour <small>groups of 3 or more, on reservation</small>", "Demander une visite guidée <small>groupes dès 3 personnes, sur réservation</small>", "طلب جولة بمرافقة مرشد <small>للمجموعات ابتداءً من 3 أشخاص، بالحجز المسبق</small>", "Solicitar una visita guiada <small>grupos desde 3 personas, con reserva</small>"),
]
ATTR += [
 ("a.remRed", "aria-label", "Remove one student ticket", "Retirer un billet étudiant", "إزالة تذكرة طالب", "Quitar una entrada de estudiante"),
 ("a.addRed", "aria-label", "Add one student ticket", "Ajouter un billet étudiant", "إضافة تذكرة طالب", "Añadir una entrada de estudiante"),
]
JS += [
 ("addr", "Musées de Bank Al-Maghrib<br>Corner of Avenue Allal Ben Abdellah and Rue Al-Qahira<br>Rabat, Morocco", "Musées de Bank Al-Maghrib<br>Angle Avenue Allal Ben Abdellah et Rue Al-Qahira<br>Rabat, Maroc", "متاحف بنك المغرب<br>زاوية شارع علال بن عبد الله وزنقة القاهرة<br>الرباط، المغرب", "Musées de Bank Al-Maghrib<br>Esquina de la avenida Allal Ben Abdellah y la calle Al-Qahira<br>Rabat, Marruecos"),
 ("tix.reduced.one", "{n} student", "{n} étudiant", "طالب ×{n}", "{n} estudiante"),
 ("tix.reduced.other", "{n} students", "{n} étudiants", "طالب ×{n}", "{n} estudiantes"),
 ("tix.tourItem", "guided tour requested", "visite guidée demandée", "طلب جولة بمرشد", "visita guiada solicitada"),
 ("tix.group", "Group rate applied", "Tarif groupe appliqué", "تم تطبيق تعريفة المجموعات", "Tarifa de grupo aplicada"),
 ("ics.location", "Corner of Avenue Allal Ben Abdellah and Rue Al-Qahira\\, Rabat", "Angle Avenue Allal Ben Abdellah et Rue Al-Qahira\\, Rabat", "زاوية شارع علال بن عبد الله وزنقة القاهرة، الرباط", "Esquina de la avenida Allal Ben Abdellah y la calle Al-Qahira\\, Rabat"),
]

# --- Visit: free Fridays ---
HTML += [
 ("visit.fridays", "Fridays", "Vendredis", "أيام الجمعة", "Viernes"),
]
JS += [
 ("tix.friday", "Free Friday", "Vendredi gratuit", "الجمعة مجانية", "Viernes gratuito"),
]

# --- Guided tours: at most two at the same time ---
JS += [
 ("tix.tourFull", "No guided tour is available at {time}: both guides are already booked. Please choose another time.", "La visite guidée n’est pas disponible pour le créneau de {time} : nos deux guides sont déjà réservés. Merci de choisir un autre horaire.", "الجولة بمرافقة مرشد غير متاحة في موعد {time}: المرشدان محجوزان. يرجى اختيار موعد آخر.", "La visita guiada no está disponible a las {time}: nuestros dos guías ya están reservados. Elija otro horario."),
 ("tix.tourFullNow", "This time slot has just been fully booked for guided tours. Your tickets are kept; choose another time or continue without a guide.", "Ce créneau vient d’être complet pour les visites guidées. Vos billets sont conservés : choisissez un autre horaire ou continuez sans guide.", "اكتمل هذا الموعد للتو بالنسبة للجولات المرشدة. تم الاحتفاظ بتذاكركم: اختاروا موعداً آخر أو تابعوا دون مرشد.", "Este horario acaba de completarse para visitas guiadas. Se conservan sus entradas: elija otro horario o continúe sin guía."),
]
