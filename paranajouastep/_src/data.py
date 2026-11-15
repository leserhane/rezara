# -*- coding: utf-8 -*-
"""All shop content lives here: store details, delivery rates, categories, products.

Edit this file, then run:  python3 _src/build.py
Every page (French + Arabic), the sitemap and the cart catalogue are regenerated.

!! Values marked TODO are placeholders — replace them with the real ones before going live.
"""

# ---------------------------------------------------------------- store
STORE = {
    'name': 'ParaNajouaStep',
    'site_url': 'https://www.titsuit.com/paranajouastep',  # change if the shop moves to its own domain (no trailing slash)
    'phone_display': '+212 6 00 00 00 00',         # TODO
    'phone_tel': '+212600000000',                  # TODO
    'whatsapp': '212600000000',                    # TODO international format, digits only
    'email': 'contact@paranajouastep.ma',          # TODO
    'street_fr': 'Avenue Mohammed V, Centre-ville',  # TODO exact address
    'street_ar': 'شارع محمد الخامس، وسط المدينة',      # TODO
    'city': 'Kénitra',
    'postal_code': '14000',
    'region': 'Rabat-Salé-Kénitra',
    'lat': 34.2610, 'lng': -6.5802,                # TODO exact shop coordinates
    'instagram': 'https://www.instagram.com/paranajouastep',  # TODO
    'facebook': 'https://www.facebook.com/paranajouastep',    # TODO
    # Opening hours, schema.org style
    'hours': [('Mo-Sa', '09:00', '21:00'), ('Su', '10:00', '14:00')],  # TODO
    'hours_fr': 'Lundi – Samedi : 9h00 – 21h00 · Dimanche : 10h00 – 14h00',
    'hours_ar': 'من الإثنين إلى السبت: 9:00 – 21:00 · الأحد: 10:00 – 14:00',
}

# ---------------------------------------------------------------- delivery (DH)
# key, fee, free-from amount, delay FR, delay AR
SHIPPING = [
    ('kenitra', 'Kénitra', 'القنيطرة', 20, 300, 'Le jour même ou sous 24h', 'في نفس اليوم أو خلال 24 ساعة'),
    ('rabat', 'Rabat', 'الرباط', 35, 500, 'Sous 24h', 'خلال 24 ساعة'),
    ('sale', 'Salé', 'سلا', 35, 500, 'Sous 24h', 'خلال 24 ساعة'),
    ('temara', 'Témara', 'تمارة', 35, 500, 'Sous 24h', 'خلال 24 ساعة'),
    ('sidi-kacem', 'Sidi Kacem', 'سيدي قاسم', 40, 500, '24 à 48h', '24 إلى 48 ساعة'),
    ('sidi-slimane', 'Sidi Slimane', 'سيدي سليمان', 40, 500, '24 à 48h', '24 إلى 48 ساعة'),
    ('autre', 'Autre ville au Maroc', 'مدينة أخرى بالمغرب', 45, 700, '24 à 72h', '24 إلى 72 ساعة'),
    ('retrait', 'Retrait en boutique (Kénitra)', 'الاستلام من المحل (القنيطرة)', 0, 0, 'Prêt en 1h', 'جاهز خلال ساعة'),
]

# ---------------------------------------------------------------- categories
CATEGORIES = [
    {
        'slug': 'soins-visage',
        'fr': 'Soins visage', 'ar': 'العناية بالوجه',
        'intro_fr': "Crèmes hydratantes, sérums et soins apaisants des grandes marques dermo-cosmétiques "
                    "(Avène, SVR, Vichy, CeraVe…), sélectionnés par notre parapharmacie à Kénitra et livrés à Rabat, Salé et Témara.",
        'intro_ar': "كريمات مرطبة وسيرومات وعلاجات مهدئة من أشهر ماركات التجميل الجلدي (Avène، SVR، Vichy، CeraVe…) "
                    "يختارها لكم البارافارماسي ديالنا في القنيطرة مع التوصيل إلى الرباط وسلا وتمارة.",
        'cover': 'vichy-mineral-89',
    },
    {
        'slug': 'nettoyants-demaquillants',
        'fr': 'Nettoyants & démaquillants', 'ar': 'المنظفات ومزيلات المكياج',
        'intro_fr': "Eaux micellaires et gels nettoyants pour peaux sensibles, mixtes ou grasses : le premier geste d'une routine efficace.",
        'intro_ar': "مياه ميسيلار وجل منظف للبشرة الحساسة والمختلطة والدهنية: الخطوة الأولى لروتين فعال.",
        'cover': 'bioderma-sensibio-h2o',
    },
    {
        'slug': 'protection-solaire',
        'fr': 'Protection solaire', 'ar': 'الحماية من الشمس',
        'intro_fr': "Écrans SPF 50+ adaptés au soleil marocain, du littoral de Mehdia aux plages de Rabat : textures légères, sans traces blanches.",
        'intro_ar': "واقيات شمس SPF 50+ مناسبة لشمس المغرب، من شاطئ المهدية إلى شواطئ الرباط: قوام خفيف وبدون أثر أبيض.",
        'cover': 'isdin-fotoprotector-fusion-water-spf50',
    },
    {
        'slug': 'soins-cheveux',
        'fr': 'Soins cheveux', 'ar': 'العناية بالشعر',
        'intro_fr': "Shampooings traitants anti-pelliculaires pour un cuir chevelu sain et apaisé.",
        'intro_ar': "شامبوهات علاجية ضد القشرة لفروة رأس صحية ومرتاحة.",
        'cover': 'dercos-vichy-shampooing-antipelliculaire',
    },
    {
        'slug': 'corps-peaux-sensibles',
        'fr': 'Corps & peaux sensibles', 'ar': 'الجسم والبشرة الحساسة',
        'intro_fr': "Laits, lotions et crèmes relipidantes pour les peaux sèches, réactives ou à tendance atopique, adultes et enfants.",
        'intro_ar': "حليب ولوسيون وكريمات مغذية للبشرة الجافة والحساسة أو المعرضة للأتوبيا، للكبار والصغار.",
        'cover': 'uriage-xemose-creme-relipidante',
    },
]

# ---------------------------------------------------------------- products
# price in DH (TODO: confirm every price and size with the shop)
PRODUCTS = [
    {
        'slug': 'cerave-creme-hydratante', 'brand': 'CeraVe', 'cat': 'soins-visage', 'price': 199, 'size': '340 g',
        'featured': True,
        'fr': 'CeraVe Crème Hydratante – Peaux sèches à très sèches',
        'ar': 'CeraVe كريم مرطب – للبشرة الجافة إلى الجافة جداً',
        'short_fr': "Crème riche visage et corps aux 3 céramides essentiels et à l'acide hyaluronique.",
        'short_ar': 'كريم غني للوجه والجسم بثلاثة سيراميدات أساسية وحمض الهيالورونيك.',
        'desc_fr': "Développée avec des dermatologues, la Crème Hydratante CeraVe restaure la barrière cutanée grâce à ses 3 céramides "
                   "essentiels et hydrate durablement grâce à l'acide hyaluronique. Sa technologie MVE diffuse les actifs en continu pendant 24h. "
                   "Non grasse, sans parfum et non comédogène, elle convient au visage comme au corps, chez l'adulte et l'enfant.",
        'desc_ar': 'تم تطوير كريم CeraVe المرطب مع أطباء الجلد، فهو يرمم حاجز البشرة بفضل ثلاثة سيراميدات أساسية ويرطب بعمق '
                   'بفضل حمض الهيالورونيك. تقنية MVE تحرر المكونات النشطة بشكل متواصل لمدة 24 ساعة. غير دهني، بدون عطر '
                   'ولا يسد المسام، يناسب الوجه والجسم للكبار والأطفال.',
        'benefits_fr': ['Hydratation 24h', 'Restaure la barrière cutanée', 'Sans parfum, non comédogène', 'Visage & corps'],
        'benefits_ar': ['ترطيب لمدة 24 ساعة', 'يرمم حاجز البشرة', 'بدون عطر ولا يسد المسام', 'للوجه والجسم'],
        'usage_fr': "Appliquer matin et/ou soir sur peau propre, visage et corps, aussi souvent que nécessaire.",
        'usage_ar': 'يوضع صباحاً و/أو مساءً على بشرة نظيفة، على الوجه والجسم، كلما دعت الحاجة.',
    },
    {
        'slug': 'bioderma-sensibio-h2o', 'brand': 'Bioderma', 'cat': 'nettoyants-demaquillants', 'price': 199, 'size': '500 ml',
        'featured': True,
        'fr': 'Bioderma Sensibio H2O – Eau micellaire démaquillante',
        'ar': 'Bioderma Sensibio H2O – ماء ميسيلار مزيل للمكياج',
        'short_fr': 'La solution micellaire de référence pour démaquiller et apaiser les peaux sensibles.',
        'short_ar': 'محلول الميسيلار المرجعي لإزالة المكياج وتهدئة البشرة الحساسة.',
        'desc_fr': "Sensibio H2O nettoie, démaquille le visage et les yeux et apaise la peau sensible en un seul geste, sans rinçage. "
                   "Sa formule à la composition proche de celle de la peau respecte l'équilibre cutané et sa tolérance est excellente, "
                   "même pour les yeux sensibles et les porteurs de lentilles.",
        'desc_ar': 'ينظف Sensibio H2O ويزيل مكياج الوجه والعينين ويهدئ البشرة الحساسة بحركة واحدة وبدون شطف. '
                   'تركيبته القريبة من مكونات البشرة تحترم توازنها، ويتميز بتحمل ممتاز حتى للعيون الحساسة ومستعملي العدسات.',
        'benefits_fr': ['Démaquille visage & yeux', 'Sans rinçage', 'Apaise les peaux sensibles', 'Très haute tolérance'],
        'benefits_ar': ['يزيل مكياج الوجه والعينين', 'بدون شطف', 'يهدئ البشرة الحساسة', 'تحمل عالٍ جداً'],
        'usage_fr': "Imbiber un coton et nettoyer le visage et les yeux. Renouveler jusqu'à ce que le coton soit propre. Ne pas rincer.",
        'usage_ar': 'بللي قطعة قطن ونظفي الوجه والعينين، وكرري حتى تصبح القطنة نظيفة. لا يحتاج إلى شطف.',
    },
    {
        'slug': 'la-roche-posay-effaclar-gel-moussant', 'brand': 'La Roche-Posay', 'cat': 'nettoyants-demaquillants', 'price': 239, 'size': '400 ml',
        'featured': True,
        'fr': 'La Roche-Posay Effaclar Gel moussant purifiant',
        'ar': 'La Roche-Posay Effaclar جل رغوي منقي',
        'short_fr': 'Gel nettoyant pour peaux grasses et sensibles à tendance acnéique.',
        'short_ar': 'جل منظف للبشرة الدهنية والحساسة المعرضة لحب الشباب.',
        'desc_fr': "Le gel moussant Effaclar élimine en douceur les impuretés et l'excès de sébum sans dessécher. Enrichi en zinc PCA et en "
                   "eau thermale de La Roche-Posay, il purifie, laisse la peau nette et fraîche et prépare aux soins. "
                   "Sans savon, testé sur peaux sensibles.",
        'desc_ar': 'يزيل جل Effaclar الرغوي الشوائب والإفرازات الدهنية الزائدة بلطف ودون تجفيف. غني بـ Zinc PCA وبالمياه الحرارية '
                   'لـ La Roche-Posay، ينقي البشرة ويتركها نظيفة ومنتعشة ومستعدة للعلاجات. بدون صابون ومختبر على البشرة الحساسة.',
        'benefits_fr': ['Élimine l’excès de sébum', 'Purifie sans dessécher', 'Sans savon', 'Peaux grasses sensibles'],
        'benefits_ar': ['يزيل الدهون الزائدة', 'ينقي دون تجفيف', 'بدون صابون', 'للبشرة الدهنية الحساسة'],
        'usage_fr': "Matin et soir, faire mousser sur peau humide en massant délicatement, puis rincer à l'eau claire.",
        'usage_ar': 'صباحاً ومساءً، يدلك برفق على بشرة مبللة حتى يكوّن رغوة، ثم يشطف بالماء.',
    },
    {
        'slug': 'vichy-mineral-89', 'brand': 'Vichy', 'cat': 'soins-visage', 'price': 279, 'size': '50 ml',
        'featured': True,
        'fr': 'Vichy Minéral 89 – Booster quotidien fortifiant',
        'ar': 'Vichy Minéral 89 – بوستر يومي مقوٍّ للبشرة',
        'short_fr': "Booster à 89 % d'eau volcanique de Vichy et acide hyaluronique pour une peau plus forte et repulpée.",
        'short_ar': 'بوستر بنسبة 89% من مياه Vichy البركانية وحمض الهيالورونيك لبشرة أقوى وممتلئة.',
        'desc_fr': "Minéral 89 concentre 89 % d'Eau Volcanique Minéralisante de Vichy et de l'acide hyaluronique d'origine naturelle. "
                   "Ce booster gel ultra-léger fortifie la barrière cutanée, hydrate et repulpe dès la première application. "
                   "Il s'utilise seul ou avant votre crème, sur tous types de peaux, même sensibles.",
        'desc_ar': 'يحتوي Minéral 89 على 89% من مياه Vichy البركانية الغنية بالمعادن وعلى حمض الهيالورونيك من أصل طبيعي. '
                   'هذا البوستر الجل الخفيف جداً يقوي حاجز البشرة ويرطبها ويمنحها امتلاءً من أول استعمال. '
                   'يستعمل وحده أو قبل الكريم، لجميع أنواع البشرة حتى الحساسة.',
        'benefits_fr': ['Fortifie la barrière cutanée', 'Hydrate & repulpe', 'Texture gel ultra-légère', 'Tous types de peaux'],
        'benefits_ar': ['يقوي حاجز البشرة', 'يرطب ويمنح امتلاءً', 'قوام جل خفيف جداً', 'لجميع أنواع البشرة'],
        'usage_fr': "Matin et/ou soir, appliquer 2 gouttes sur le visage et le cou avant la crème habituelle.",
        'usage_ar': 'صباحاً و/أو مساءً، ضعي قطرتين على الوجه والعنق قبل الكريم المعتاد.',
    },
    {
        'slug': 'isdin-fotoprotector-fusion-water-spf50', 'brand': 'ISDIN', 'cat': 'protection-solaire', 'price': 249, 'size': '50 ml',
        'featured': True,
        'fr': 'ISDIN Fotoprotector Fusion Water SPF 50+',
        'ar': 'ISDIN Fotoprotector Fusion Water واقي شمس SPF 50+',
        'short_fr': "Écran solaire visage ultra-léger à base d'eau, haute protection, pour un usage quotidien.",
        'short_ar': 'واقي شمس للوجه خفيف جداً بأساس مائي، حماية عالية للاستعمال اليومي.',
        'desc_fr': "Fusion Water SPF 50+ offre une très haute protection UVA/UVB dans une texture aqueuse qui pénètre instantanément, "
                   "sans laisser de film gras ni de traces blanches. Idéal sous le maquillage, il convient à tous les types de peaux, "
                   "y compris les peaux sensibles — un indispensable sous le soleil de Kénitra et de Rabat.",
        'desc_ar': 'يوفر Fusion Water SPF 50+ حماية عالية جداً من أشعة UVA وUVB بقوام مائي يمتص فوراً دون ترك طبقة دهنية أو أثر أبيض. '
                   'مثالي تحت المكياج ويناسب جميع أنواع البشرة بما فيها الحساسة — ضروري تحت شمس القنيطرة والرباط.',
        'benefits_fr': ['Très haute protection SPF 50+', 'Texture eau, fini invisible', 'Idéal sous maquillage', 'Usage quotidien'],
        'benefits_ar': ['حماية عالية جداً SPF 50+', 'قوام مائي ولمسة غير مرئية', 'مثالي تحت المكياج', 'للاستعمال اليومي'],
        'usage_fr': "Appliquer généreusement avant l'exposition. Renouveler toutes les 2 heures et après la baignade.",
        'usage_ar': 'يوضع بكمية كافية قبل التعرض للشمس، ويعاد وضعه كل ساعتين وبعد السباحة.',
    },
    {
        'slug': 'avene-tolerance-creme-apaisante', 'brand': 'Avène', 'cat': 'soins-visage', 'price': 229, 'size': '40 ml',
        'featured': True,
        'fr': 'Avène Tolérance Crème apaisante – Peaux sensibles',
        'ar': 'Avène Tolérance كريم مهدئ – للبشرة الحساسة',
        'short_fr': "Soin apaisant à formule minimaliste et à l'Eau thermale d'Avène pour peaux hypersensibles.",
        'short_ar': 'علاج مهدئ بتركيبة بسيطة وبمياه Avène الحرارية للبشرة شديدة الحساسية.',
        'desc_fr': "La crème Tolérance d'Avène apaise immédiatement les sensations d'inconfort, d'échauffement et de tiraillement. "
                   "Sa formule ultra-courte, conçue pour les peaux hypersensibles et allergiques, associe l'Eau thermale d'Avène "
                   "à des actifs restaurateurs, sans parfum ni conservateur.",
        'desc_ar': 'يهدئ كريم Tolérance من Avène فوراً الإحساس بعدم الراحة والحرارة والشد. تركيبته القصيرة جداً مصممة '
                   'للبشرة شديدة الحساسية والمعرضة للحساسية، وتجمع بين مياه Avène الحرارية ومكونات مرممة، بدون عطر ولا مواد حافظة.',
        'benefits_fr': ['Apaise immédiatement', 'Formule minimaliste', 'Sans parfum ni conservateur', 'Peaux hypersensibles'],
        'benefits_ar': ['يهدئ فوراً', 'تركيبة بسيطة', 'بدون عطر ولا مواد حافظة', 'للبشرة شديدة الحساسية'],
        'usage_fr': "Appliquer matin et soir sur le visage et le cou parfaitement nettoyés.",
        'usage_ar': 'يوضع صباحاً ومساءً على الوجه والعنق بعد تنظيفهما جيداً.',
    },
    {
        'slug': 'svr-hydraliane-creme-legere', 'brand': 'SVR', 'cat': 'soins-visage', 'price': 189, 'size': '40 ml',
        'featured': False,
        'fr': 'SVR Hydraliane Crème légère',
        'ar': 'SVR Hydraliane كريم خفيف',
        'short_fr': 'Crème hydratante intense à texture légère pour peaux normales à mixtes et déshydratées.',
        'short_ar': 'كريم ترطيب مكثف بقوام خفيف للبشرة العادية إلى المختلطة والمجففة.',
        'desc_fr': "Hydraliane Légère de SVR réhydrate intensément les peaux déshydratées grâce à sa haute concentration d'actifs hydratants. "
                   "Sa texture fondante non grasse pénètre rapidement et laisse la peau souple, confortable et lumineuse toute la journée. "
                   "Excellente base de maquillage.",
        'desc_ar': 'يعيد Hydraliane Légère من SVR الترطيب المكثف للبشرة المجففة بفضل تركيزه العالي من المكونات المرطبة. '
                   'قوامه الذائب وغير الدهني يمتص بسرعة ويترك البشرة ناعمة ومرتاحة ومشرقة طوال اليوم. قاعدة ممتازة للمكياج.',
        'benefits_fr': ['Hydratation intense', 'Texture légère non grasse', 'Teint lumineux', 'Base de maquillage'],
        'benefits_ar': ['ترطيب مكثف', 'قوام خفيف غير دهني', 'إشراقة البشرة', 'قاعدة للمكياج'],
        'usage_fr': "Appliquer matin et/ou soir sur le visage et le cou nettoyés.",
        'usage_ar': 'يوضع صباحاً و/أو مساءً على الوجه والعنق بعد التنظيف.',
    },
    {
        'slug': 'd-white-creme-eclaircissante-spf50', 'brand': 'D White', 'cat': 'soins-visage', 'price': 149, 'size': '',
        'featured': True, 'cats_extra': ['protection-solaire'],
        'fr': 'D White Crème éclaircissante SPF 50+',
        'ar': 'D White كريم مفتح للبشرة SPF 50+',
        'short_fr': 'Crème unifiante qui atténue les taches et protège du soleil avec un SPF 50+.',
        'short_ar': 'كريم يوحد لون البشرة ويخفف البقع ويحمي من الشمس بعامل SPF 50+.',
        'desc_fr': "La crème éclaircissante D White aide à atténuer les taches pigmentaires et à unifier le teint, tout en protégeant la peau "
                   "des UV, principale cause de l'apparition des taches. Le teint paraît plus clair, plus uniforme et plus lumineux, "
                   "jour après jour.",
        'desc_ar': 'يساعد كريم D White المفتح على تخفيف البقع الداكنة وتوحيد لون البشرة، مع حمايتها من الأشعة فوق البنفسجية '
                   'التي تعد السبب الرئيسي لظهور البقع. تصبح البشرة أفتح وأكثر توحداً وإشراقاً يوماً بعد يوم.',
        'benefits_fr': ['Atténue les taches', 'Unifie le teint', 'Protection SPF 50+', 'Éclat au quotidien'],
        'benefits_ar': ['يخفف البقع', 'يوحد لون البشرة', 'حماية SPF 50+', 'إشراقة يومية'],
        'usage_fr': "Appliquer chaque matin sur le visage propre. Renouveler en cas d'exposition prolongée au soleil.",
        'usage_ar': 'يوضع كل صباح على الوجه النظيف، ويعاد وضعه عند التعرض الطويل للشمس.',
    },
    {
        'slug': 'dcp-creme-intense-hydratante', 'brand': 'DCP', 'cat': 'soins-visage', 'price': 99, 'size': '',
        'featured': False, 'cats_extra': ['corps-peaux-sensibles'],
        'fr': 'DCP Crème intense hydratante – Dermo-cosmétique',
        'ar': 'DCP كريم ترطيب مكثف – تجميل جلدي',
        'short_fr': 'Soin hydratant intense pour les peaux sèches et inconfortables, au rapport qualité-prix imbattable.',
        'short_ar': 'علاج ترطيب مكثف للبشرة الجافة وغير المرتاحة، بجودة ممتازة وثمن مناسب.',
        'desc_fr': "La Crème Intense Hydratante DCP nourrit et hydrate en profondeur les peaux sèches. Elle soulage les tiraillements, "
                   "renforce le confort cutané et laisse la peau douce et souple. Sa texture onctueuse s'utilise sur le visage et "
                   "les zones sèches du corps.",
        'desc_ar': 'يغذي كريم DCP للترطيب المكثف البشرة الجافة ويرطبها بعمق. يخفف الإحساس بالشد ويعزز راحة البشرة '
                   'ويتركها ناعمة ومرنة. قوامه الكريمي يستعمل على الوجه والمناطق الجافة من الجسم.',
        'benefits_fr': ['Hydratation intense', 'Soulage les tiraillements', 'Peau douce et souple', 'Visage & zones sèches'],
        'benefits_ar': ['ترطيب مكثف', 'يخفف الشد', 'بشرة ناعمة ومرنة', 'للوجه والمناطق الجافة'],
        'usage_fr': "Appliquer une à deux fois par jour sur peau propre et sèche.",
        'usage_ar': 'يوضع مرة أو مرتين يومياً على بشرة نظيفة وجافة.',
    },
    {
        'slug': 'gleamy-eau-micellaire', 'brand': 'Gleamy', 'cat': 'nettoyants-demaquillants', 'price': 69, 'size': '',
        'featured': False,
        'fr': 'Gleamy Eau micellaire – Peaux sensibles',
        'ar': 'Gleamy ماء ميسيلار – للبشرة الحساسة',
        'short_fr': 'Eau micellaire douce qui nettoie et démaquille sans frotter ni rincer.',
        'short_ar': 'ماء ميسيلار لطيف ينظف ويزيل المكياج بدون فرك ولا شطف.',
        'desc_fr': "L'eau micellaire Gleamy capte le maquillage, les impuretés et la pollution du quotidien en un geste. "
                   "Sa formule douce respecte les peaux sensibles et laisse le visage frais, propre et confortable, sans film gras.",
        'desc_ar': 'يلتقط ماء الميسيلار Gleamy المكياج والشوائب والتلوث اليومي بحركة واحدة. تركيبته اللطيفة تحترم '
                   'البشرة الحساسة وتترك الوجه منتعشاً ونظيفاً ومرتاحاً دون طبقة دهنية.',
        'benefits_fr': ['Nettoie & démaquille', 'Sans rinçage', 'Doux pour les peaux sensibles', 'Fini frais, non gras'],
        'benefits_ar': ['ينظف ويزيل المكياج', 'بدون شطف', 'لطيف على البشرة الحساسة', 'لمسة منعشة غير دهنية'],
        'usage_fr': "Appliquer sur un coton et passer délicatement sur le visage et les yeux, matin et soir.",
        'usage_ar': 'يوضع على قطعة قطن ويمرر بلطف على الوجه والعينين صباحاً ومساءً.',
    },
    {
        'slug': 'eucerin-ph5-lotion', 'brand': 'Eucerin', 'cat': 'corps-peaux-sensibles', 'price': 189, 'size': '400 ml',
        'featured': True,
        'fr': 'Eucerin pH5 Lotion – Peau sensible',
        'ar': 'Eucerin pH5 لوسيون – للبشرة الحساسة',
        'short_fr': 'Lotion corps légère qui renforce la résistance des peaux sensibles et sèches.',
        'short_ar': 'لوسيون خفيف للجسم يقوي مقاومة البشرة الحساسة والجافة.',
        'desc_fr': "Grâce à son pH 5, proche de celui de la peau, la lotion Eucerin pH5 protège les enzymes cutanées et renforce la "
                   "résistance naturelle des peaux sensibles. Sa texture légère pénètre rapidement, hydrate durablement et laisse "
                   "la peau douce, sans effet collant. Convient à toute la famille.",
        'desc_ar': 'بفضل درجة حموضته pH 5 القريبة من حموضة البشرة، يحمي لوسيون Eucerin pH5 أنزيمات الجلد ويقوي المقاومة '
                   'الطبيعية للبشرة الحساسة. قوامه الخفيف يمتص بسرعة ويرطب لمدة طويلة ويترك البشرة ناعمة دون لزوجة. مناسب لكل العائلة.',
        'benefits_fr': ['pH 5 physiologique', 'Renforce la résistance cutanée', 'Pénètre vite, non collant', 'Pour toute la famille'],
        'benefits_ar': ['درجة حموضة pH 5', 'يقوي مقاومة البشرة', 'يمتص بسرعة وغير لزج', 'لكل العائلة'],
        'usage_fr': "Appliquer quotidiennement sur tout le corps, de préférence après la douche.",
        'usage_ar': 'يوضع يومياً على كامل الجسم، ويفضل بعد الاستحمام.',
    },
    {
        'slug': 'uriage-xemose-creme-relipidante', 'brand': 'Uriage', 'cat': 'corps-peaux-sensibles', 'price': 219, 'size': '200 ml',
        'featured': True,
        'fr': 'Uriage Xémose Crème relipidante anti-irritations',
        'ar': 'Uriage Xémose كريم مغذٍّ ضد التهيج',
        'short_fr': 'Crème relipidante pour peaux très sèches à tendance atopique, dès la naissance.',
        'short_ar': 'كريم مغذٍّ للبشرة الجافة جداً المعرضة للأتوبيا، منذ الولادة.',
        'desc_fr': "Xémose relipide intensément, apaise les irritations et les démangeaisons des peaux très sèches à tendance atopique. "
                   "À base d'Eau thermale d'Uriage, elle reconstitue le film hydrolipidique et protège durablement la peau. "
                   "Visage et corps, nourrissons, enfants et adultes.",
        'desc_ar': 'يغذي Xémose البشرة بعمق ويهدئ التهيج والحكة لدى البشرة الجافة جداً المعرضة للأتوبيا. '
                   'بفضل مياه Uriage الحرارية، يعيد بناء الطبقة الدهنية المائية ويحمي البشرة لمدة طويلة. '
                   'للوجه والجسم، للرضع والأطفال والكبار.',
        'benefits_fr': ['Relipide intensément', 'Apaise les démangeaisons', 'Dès la naissance', 'Visage & corps'],
        'benefits_ar': ['تغذية مكثفة', 'يهدئ الحكة', 'منذ الولادة', 'للوجه والجسم'],
        'usage_fr': "Appliquer une à deux fois par jour sur une peau propre et sèche, en massant légèrement.",
        'usage_ar': 'يوضع مرة أو مرتين يومياً على بشرة نظيفة وجافة مع تدليك خفيف.',
    },
    {
        'slug': 'dercos-vichy-shampooing-antipelliculaire', 'brand': 'Vichy Dercos', 'cat': 'soins-cheveux', 'price': 169, 'size': '200 ml',
        'featured': True,
        'fr': 'Vichy Dercos Shampooing anti-pelliculaire',
        'ar': 'Vichy Dercos شامبو ضد القشرة',
        'short_fr': 'Shampooing traitant au sélénium DS qui élimine les pellicules visibles dès la première utilisation.',
        'short_ar': 'شامبو علاجي بالسيلينيوم DS يزيل القشرة الظاهرة من أول استعمال.',
        'desc_fr': "Le shampooing anti-pelliculaire Dercos de Vichy élimine jusqu'à 100 % des pellicules visibles* et aide à prévenir "
                   "leur réapparition grâce au sélénium DS. Il apaise les démangeaisons et laisse les cheveux propres et légers. "
                   "*Test clinique, d'après la marque.",
        'desc_ar': 'يزيل شامبو Dercos من Vichy ضد القشرة حتى 100% من القشرة الظاهرة* ويساعد على منع ظهورها من جديد بفضل '
                   'السيلينيوم DS. يهدئ الحكة ويترك الشعر نظيفاً وخفيفاً. *اختبار سريري حسب الماركة.',
        'benefits_fr': ['Élimine les pellicules', 'Prévient les récidives', 'Apaise les démangeaisons', 'Au sélénium DS'],
        'benefits_ar': ['يزيل القشرة', 'يمنع عودتها', 'يهدئ الحكة', 'بالسيلينيوم DS'],
        'usage_fr': "Appliquer sur cheveux mouillés, masser, laisser poser 1 minute puis rincer. 2 à 3 fois par semaine.",
        'usage_ar': 'يوضع على شعر مبلل مع التدليك، يترك دقيقة واحدة ثم يشطف. 2 إلى 3 مرات في الأسبوع.',
    },
    {
        'slug': 'd-cap-shampooing-antipelliculaire', 'brand': 'D-Cap', 'cat': 'soins-cheveux', 'price': 89, 'size': '',
        'featured': False,
        'fr': 'D-Cap Shampooing anti-pelliculaire',
        'ar': 'D-Cap شامبو ضد القشرة',
        'short_fr': 'Shampooing anti-pelliculaire qui assainit le cuir chevelu et soulage les démangeaisons.',
        'short_ar': 'شامبو ضد القشرة ينقي فروة الرأس ويخفف الحكة.',
        'desc_fr': "Le shampooing D-Cap élimine les pellicules, assainit le cuir chevelu et apaise les démangeaisons. "
                   "Sa formule douce respecte la fibre capillaire : les cheveux restent propres, légers et brillants.",
        'desc_ar': 'يزيل شامبو D-Cap القشرة وينقي فروة الرأس ويهدئ الحكة. تركيبته اللطيفة تحترم ألياف الشعر '
                   'فيبقى الشعر نظيفاً وخفيفاً ولامعاً.',
        'benefits_fr': ['Élimine les pellicules', 'Assainit le cuir chevelu', 'Apaise les démangeaisons', 'Cheveux légers'],
        'benefits_ar': ['يزيل القشرة', 'ينقي فروة الرأس', 'يهدئ الحكة', 'شعر خفيف'],
        'usage_fr': "Appliquer sur cheveux mouillés, faire mousser, laisser agir 2 à 3 minutes puis rincer.",
        'usage_ar': 'يوضع على شعر مبلل، يدلك حتى يكوّن رغوة، يترك 2 إلى 3 دقائق ثم يشطف.',
    },
]
