// Studio Event — catalogue, packs, zones and FAQ. Edit here, then run `node build.mjs`.
// Voice (brand book): calm, precise, reassuring; "vous"; specs in mono with units; no prices unless real.

export const zones = ["Rabat", "Témara", "Skhirat", "Salé"];

// ---------------------------------------------------------------- catalogue
// Each item: [inventory prefix id, name, spec line]
export const catalog = {
  dj: [
    ["SE-DJ-0301", "Pioneer DJ CDJ-3000", "Lecteur pro · écran tactile 9″ · USB / SD · Pro DJ Link"],
    ["SE-DJ-0901", "Pioneer DJ DJM-A9", "Table de mixage 4 voies · 2 entrées micro · Bluetooth"],
    ["SE-DJ-0902", "Pioneer DJ DJM-900NXS2", "Table de mixage 4 voies · effets Beat FX · référence club"],
    ["SE-DJ-1001", "Pioneer DJ DJM-V10", "Table de mixage 6 voies · EQ 4 bandes · filtres par voie"],
    ["SE-DJ-0701", "Pioneer DJ XDJ-XZ", "Système tout-en-un 4 voies · rekordbox & Serato"],
    ["SE-DJ-0501", "Pioneer DJ XDJ-RX3", "Système tout-en-un 2 voies · écran 10,1″ · USB"],
    ["SE-DJ-0401", "Pioneer DJ DDJ-FLX10", "Contrôleur 4 voies · rekordbox & Serato · stems"],
    ["SE-DJ-0402", "Pioneer DJ DDJ-1000", "Contrôleur 4 voies · rekordbox · jog displays"],
    ["SE-DJ-0101", "Booth DJ habillé", "Façade noire ou blanche · 2 m · câblage caché"],
    ["SE-DJ-0102", "Retours DJ actifs", "2 × 8″ ou 2 × 12″ · posés ou sur pied"],
  ],
  sono: [
    ["SE-SON-0101", "Enceinte active 12″", "1000 W · 2 voies · sur pied ou suspendue"],
    ["SE-SON-0102", "Enceinte active 15″", "1300 W · 2 voies · grandes salles et plein air"],
    ["SE-SON-0201", "Caisson de basses 18″", "1600 W · pour mariages et soirées dansantes"],
    ["SE-SON-0301", "Système colonne line-array", "Couverture large · voix intelligible jusqu'au fond"],
    ["SE-SON-0401", "Console numérique 16 voies", "Mix voix + musique · effets · pilotage tablette"],
    ["SE-SON-0501", "Micro sans fil HF main", "UHF · autonomie 8 h · discours, animation, chant"],
    ["SE-SON-0502", "Micro serre-tête / cravate", "UHF · conférences, cérémonies, animateurs"],
    ["SE-SON-0601", "Retour de scène 12″", "Pour chanteurs, orchestres et groupes"],
    ["SE-SON-0701", "Câblage, pieds et multipaire", "Inclus dans chaque installation"],
  ],
  lumiere: [
    ["SE-LUM-0101", "PAR LED RGBW", "Couleurs fixes ou animées · mise en lumière de salle"],
    ["SE-LUM-0201", "Lyre Beam 230 W", "Faisceaux serrés · effets de scène et de piste"],
    ["SE-LUM-0202", "Lyre Wash LED", "Bains de couleur · scène, orchestre, entrée des mariés"],
    ["SE-LUM-0301", "Uplights sur batterie", "Sans fil · façades, jardins, arbres, colonnes"],
    ["SE-LUM-0401", "Machine à brouillard / hazer", "Rend les faisceaux visibles"],
    ["SE-LUM-0402", "Fumée lourde", "Nuage au sol · première danse, entrée des mariés"],
    ["SE-LUM-0501", "Machines à étincelles froides", "Jets d'étincelles sans chaleur · usage intérieur"],
    ["SE-LUM-0601", "Stroboscope / barre LED", "Temps forts, pistes de danse"],
    ["SE-LUM-0701", "Structure truss + pieds", "Portiques, arches et totems habillés"],
    ["SE-LUM-0801", "Console DMX + technicien", "Show programmé ou piloté en direct"],
  ],
};

// ---------------------------------------------------------------- packs
export const packs = [
  {
    cat: "dj", eyebrow: "Location Pioneer DJ", name: "Pack DJ Club",
    specs: [["Pioneer DJ CDJ-3000", "2 ×"], ["Pioneer DJ DJM-A9", "1 ×"], ["Retours DJ actifs", "2 ×"], ["Booth DJ habillé", "1 ×"]],
    note: "Le setup standard des clubs, prêt à brancher",
  },
  {
    cat: "dj", eyebrow: "Location Pioneer DJ", name: "Pack DJ Essentiel",
    specs: [["XDJ-RX3 ou DDJ-FLX10", "1 ×"], ["Enceintes actives", "2 × 1000 W"], ["Micro sans fil HF", "1 ×"], ["Pieds + câblage", "inclus"]],
    note: "Anniversaires, soirées privées, villas",
  },
  {
    cat: "sono", eyebrow: "Location sono", name: "Pack Soirée",
    specs: [["Enceintes actives", "2 × 1000 W"], ["Caisson de basses", "1 × 18″"], ["Table de mixage", "1 ×"], ["Micro sans fil HF", "2 ×"]],
    note: "Livraison + installation",
  },
  {
    cat: "lumiere", eyebrow: "Location lumière", name: "Pack Ambiance",
    specs: [["PAR LED RGBW", "8 ×"], ["Lyres Beam 230 W", "4 ×"], ["Machine à brouillard", "1 ×"], ["Console DMX", "1 ×"]],
    note: "Technicien sur place",
  },
  {
    cat: "sono", eyebrow: "Son · lumière · DJ", name: "Pack Mariage",
    specs: [["Sono complète", "2 × 1300 W + 2 × 18″"], ["Lyres + PAR LED", "4 × · 12 ×"], ["Fumée lourde", "1 ×"], ["Étincelles froides", "2 ×"]],
    note: "Technicien de la balance au démontage",
  },
  {
    cat: "sono", eyebrow: "Entreprise", name: "Pack Conférence",
    specs: [["Système colonne", "2 ×"], ["Micros HF main + cravate", "4 ×"], ["Console numérique", "16 voies"], ["Lumière de scène", "Wash LED"]],
    note: "Séminaires, galas, remises de prix",
  },
];

export const events = [
  "Mariages", "Fiançailles & henné", "Anniversaires", "Soirées privées & villas",
  "Beach parties", "Séminaires & conférences", "Galas & soirées d'entreprise",
  "Remises de diplômes", "DJ sets & soirées club", "Lancements de produits",
];

// ---------------------------------------------------------------- cities
export const cities = [
  {
    slug: "rabat", name: "Rabat",
    title: "Location Sono, Lumière & Pioneer DJ à Rabat",
    description: "Location de platines Pioneer DJ (CDJ-3000, DJM-A9), sonorisation et jeux de lumière à Rabat. Livraison, installation et technicien. Devis gratuit sous 24 h.",
    h1: ["Location sono", "& Pioneer DJ", "à Rabat"],
    lead: "Platines Pioneer DJ, sonorisation et lumière livrées, installées et réglées partout à Rabat — de l'Agdal à Souissi.",
    intro: [
      "Studio Event est basé à Rabat. Notre dépôt est à quelques minutes de tous les quartiers de la capitale : nous livrons et installons le jour même de votre événement, et un technicien reste sur place si vous le souhaitez.",
      "Mariages dans une villa de Souissi, soirée d'entreprise à Hay Riad, DJ set dans un rooftop de l'Agdal, conférence dans un hôtel du centre-ville : nous dimensionnons le son et la lumière selon la salle, le nombre d'invités et les contraintes horaires.",
    ],
    areas: ["Agdal", "Hay Riad", "Souissi", "Hassan", "Océan", "Les Orangers", "Aviation", "Yacoub El Mansour", "Akkari", "Diour Jamaa", "Youssoufia", "Médina"],
    venues: "Hôtels, salles des fêtes, villas, rooftops, riads de la médina, espaces de conférence et campus.",
    faq: [
      ["Livrez-vous le matériel partout à Rabat ?", "Oui. Nous livrons et installons dans tous les quartiers de Rabat — Agdal, Hay Riad, Souissi, Hassan, Océan, Yacoub El Mansour et au-delà. La livraison est indiquée sur le devis."],
      ["Peut-on louer des CDJ-3000 et une DJM-A9 à Rabat pour un DJ set ?", "Oui. Le Pack DJ Club (2 × CDJ-3000, 1 × DJM-A9, retours et booth) est disponible à Rabat, avec ou sans technicien. Chaque platine est testée avant la sortie."],
      ["Intervenez-vous dans les riads de la médina ?", "Oui. Pour les accès étroits nous adaptons le matériel (enceintes compactes, uplights sur batterie) et prévoyons le temps de manutention dans le planning d'installation."],
    ],
  },
  {
    slug: "temara", name: "Témara",
    title: "Location Sono, Lumière & Pioneer DJ à Témara",
    description: "Location de sonorisation, jeux de lumière et tables de mixage Pioneer DJ à Témara, Harhoura et Guy Ville. Livraison, installation, technicien. Devis sous 24 h.",
    h1: ["Location sono", "& Pioneer DJ", "à Témara"],
    lead: "Son, lumière et platines Pioneer DJ pour vos mariages, villas et soirées à Témara, Harhoura et sur toute la côte.",
    intro: [
      "Témara est à moins de vingt minutes de notre dépôt de Rabat. Nous y intervenons chaque semaine : salles des fêtes, villas avec jardin, résidences en bord de mer à Harhoura et Guy Ville.",
      "En plein air, le son porte plus loin et le vent compte : nous choisissons des enceintes et un caisson adaptés, sécurisons les pieds et protégeons le matériel de l'humidité marine. Pour la lumière, les uplights sur batterie mettent en valeur jardins et façades sans câbles au sol.",
    ],
    areas: ["Centre-ville", "Harhoura", "Guy Ville", "Wifak", "Massira", "Hay Nahda", "Ain Atiq", "Sidi El Abed", "Mers El Kheir", "Temara Plage"],
    venues: "Villas et jardins, salles des fêtes, résidences en bord de mer, restaurants de la corniche et hôtels.",
    faq: [
      ["Livrez-vous à Harhoura et Guy Ville ?", "Oui, toute la commune de Témara est desservie, y compris Harhoura, Guy Ville, Sidi El Abed et la corniche."],
      ["Votre matériel convient-il à une soirée en plein air ?", "Oui. Nous prévoyons des enceintes plus puissantes, un caisson de basses et des pieds lestés, et nous protégeons le matériel de l'humidité. Le technicien reste sur place en cas de changement de météo."],
      ["Peut-on louer uniquement une table Pioneer DJ à Témara ?", "Oui. Vous pouvez louer une platine seule (XDJ-RX3, XDJ-XZ, DDJ-FLX10…) ou un setup complet CDJ-3000 + DJM-A9, livré ou à retirer au dépôt."],
    ],
  },
  {
    slug: "skhirat", name: "Skhirat",
    title: "Location Sono, Lumière & Pioneer DJ à Skhirat",
    description: "Location de sono, lumière et matériel Pioneer DJ à Skhirat (Skhirate) : mariages, beach parties, villas et séminaires. Livraison, installation et technicien.",
    h1: ["Location sono", "& Pioneer DJ", "à Skhirat"],
    lead: "Mariages face à la mer, beach parties et séminaires à Skhirat : son, lumière et platines Pioneer DJ installés par nos techniciens.",
    intro: [
      "Skhirat (ou Skhirate) accueille une grande partie des mariages et séminaires de la région, dans ses domaines, ses hôtels et ses villas en bord de plage. Nous y livrons le matériel et l'installons avant l'arrivée des invités.",
      "Sur la plage ou dans un jardin, un événement réussi se joue sur la couverture sonore et la lumière de nuit : lyres beam pour la piste, wash LED pour la scène, fumée lourde pour la première danse. Nous préparons un plan d'implantation avec vous et votre traiteur.",
    ],
    areas: ["Skhirat centre", "Skhirat Plage", "Ain Aouda (route)", "Sidi Yahya Zaer (route)", "Bouznika (sur demande)", "Ain Attig"],
    venues: "Domaines et salles de réception, hôtels et resorts, villas en bord de mer, plages privées.",
    faq: [
      ["Intervenez-vous pour les mariages dans les domaines de Skhirat ?", "Oui, c'est une grande partie de notre activité. Nous coordonnons l'horaire d'installation avec le lieu et le traiteur, et un technicien assure le son et la lumière jusqu'à la fin."],
      ["Pouvez-vous installer une sono sur la plage ?", "Oui, dans le respect des règles du lieu. Nous prévoyons l'alimentation (groupe électrogène si nécessaire), des pieds adaptés au sable et la protection du matériel."],
      ["Livrez-vous jusqu'à Bouznika ?", "Oui, sur demande. La livraison au-delà de Skhirat est précisée sur le devis."],
    ],
  },
  {
    slug: "sale", name: "Salé",
    title: "Location Sono, Lumière & Pioneer DJ à Salé",
    description: "Location de platines Pioneer DJ, sonorisation et éclairage à Salé, Sala Al Jadida, Bouknadel et Marina Bouregreg. Livraison, installation, technicien. Devis 24 h.",
    h1: ["Location sono", "& Pioneer DJ", "à Salé"],
    lead: "Platines Pioneer DJ, sono et lumière livrées à Salé, Sala Al Jadida, Bouknadel et sur la Marina du Bouregreg.",
    intro: [
      "Salé est juste de l'autre côté du Bouregreg : nous y livrons aussi vite qu'à Rabat. Salles des fêtes, maisons familiales pour les fiançailles et le henné, restaurants de la Marina, villas de Bouknadel : nous adaptons le matériel au lieu.",
      "Pour une soirée traditionnelle comme pour un DJ set, nous installons une sono qui porte la voix et la musique sans saturer, une lumière qui habille la salle, et un technicien qui gère les temps forts.",
    ],
    areas: ["Salé Médina", "Tabriquet", "Hay Salam", "Sala Al Jadida", "Hay Karima", "Bettana", "Bouknadel", "Sidi Moussa", "Marina Bouregreg", "Laayayda"],
    venues: "Salles des fêtes, maisons familiales, restaurants de la Marina, villas de Bouknadel, établissements scolaires.",
    faq: [
      ["Livrez-vous à Sala Al Jadida et Bouknadel ?", "Oui, toute la ville de Salé est desservie : Sala Al Jadida, Tabriquet, Hay Salam, Bettana, Bouknadel et la Marina du Bouregreg."],
      ["Pouvez-vous équiper une soirée de henné ou de fiançailles ?", "Oui. Nous proposons une sono compacte avec micros sans fil pour l'orchestre ou la neggafa, et une lumière d'ambiance chaude adaptée aux salons."],
      ["Le technicien reste-t-il pendant toute la soirée ?", "Si vous le souhaitez, oui. Il règle le son, gère les micros et la lumière, puis démonte le matériel à la fin."],
    ],
  },
];

// ---------------------------------------------------------------- services
export const services = [
  {
    slug: "location-pioneer-dj", key: "dj", eyebrowClass: "",
    nav: "Pioneer DJ", short: "Platines Pioneer DJ",
    title: "Location Pioneer DJ à Rabat — CDJ-3000, DJM-A9, XDJ",
    description: "Location de tables de mixage et platines Pioneer DJ à Rabat, Témara, Skhirat et Salé : CDJ-3000, DJM-A9, DJM-900NXS2, XDJ-XZ, XDJ-RX3, DDJ-FLX10. Livraison et installation.",
    eyebrow: "Location Pioneer DJ",
    h1: ["Location", "Pioneer DJ"],
    lead: "CDJ-3000, DJM-A9, XDJ-XZ, DDJ-FLX10 : le matériel standard des clubs, entretenu, testé et livré à Rabat, Témara, Skhirat et Salé.",
    cardText: "CDJ-3000, DJM-A9, XDJ-XZ, DDJ-FLX10. Le standard des clubs, entretenu et testé.",
    intro: [
      "Les DJs professionnels jouent sur Pioneer DJ. Nous louons les mêmes platines et tables de mixage que dans les clubs, pour que votre DJ retrouve ses repères : clés USB rekordbox, Pro DJ Link, effets Beat FX.",
      "Chaque appareil est nettoyé, mis à jour et testé avant chaque sortie. Nous livrons, installons le booth, raccordons à la sono et vérifions le son avec le DJ. Vous pouvez aussi retirer le matériel au dépôt.",
    ],
    included: ["Livraison et reprise", "Installation du booth", "Raccordement à la sono", "Test avec le DJ", "Câbles et alimentation", "Technicien sur demande"],
    faq: [
      ["Quelles platines Pioneer DJ proposez-vous ?", "CDJ-3000, DJM-A9, DJM-900NXS2, DJM-V10, XDJ-XZ, XDJ-RX3, DDJ-FLX10 et DDJ-1000. Le setup club le plus demandé est 2 × CDJ-3000 + 1 × DJM-A9."],
      ["Les clés USB rekordbox fonctionnent-elles ?", "Oui. Les CDJ-3000 et XDJ lisent les clés et cartes SD préparées sous rekordbox, en Pro DJ Link. Les contrôleurs DDJ fonctionnent avec l'ordinateur du DJ."],
      ["Peut-on louer le matériel Pioneer DJ sans sono ?", "Oui, si le lieu est déjà équipé. Nous vérifions avec vous la connectique de la sono existante."],
      ["Proposez-vous aussi un DJ ?", "Oui, sur demande nous pouvons vous proposer un DJ adapté à votre événement, en plus du matériel."],
    ],
  },
  {
    slug: "location-sono", key: "sono", eyebrowClass: "",
    nav: "Sono", short: "Sonorisation",
    title: "Location Sono à Rabat — Enceintes, Caissons, Micros HF",
    description: "Location de sonorisation à Rabat, Témara, Skhirat et Salé : enceintes actives, caissons de basses, micros sans fil, consoles. Mariages, soirées, conférences. Installation et technicien.",
    eyebrow: "Location sono",
    h1: ["Location", "sono"],
    lead: "Enceintes, caissons de basses, micros sans fil et consoles : une sono dimensionnée pour votre salle, installée et réglée par un technicien.",
    cardText: "Enceintes actives, caissons, micros HF, consoles. Dimensionnée pour votre salle.",
    intro: [
      "Une bonne sono, c'est une voix claire au fond de la salle et une musique qui fait danser sans fatiguer les oreilles. Nous choisissons le nombre d'enceintes, la puissance et le placement selon la surface, le nombre d'invités et le programme de la soirée.",
      "Pour un mariage : musique, orchestre, discours et animation. Pour une conférence : intelligibilité et micros fiables. Pour une soirée DJ : du grave, du volume, et un son propre jusqu'à la dernière chanson.",
    ],
    included: ["Étude de la salle", "Livraison et reprise", "Installation et câblage", "Balance et réglages", "Micros sans fil testés", "Technicien pendant l'événement"],
    faq: [
      ["Quelle puissance faut-il pour mon événement ?", "À titre indicatif : 2 × 1000 W suffisent jusqu'à 100 invités en intérieur ; au-delà de 150 invités ou en plein air, nous ajoutons un caisson de basses et des enceintes 15″. Nous confirmons après avoir vu ou décrit la salle."],
      ["Fournissez-vous des micros sans fil ?", "Oui : micros HF main, serre-tête et cravate, avec piles neuves à chaque événement."],
      ["Peut-on brancher un téléphone ou un ordinateur ?", "Oui. Chaque installation accepte une entrée Bluetooth ou câble pour la musique d'ambiance."],
      ["Le technicien reste-t-il sur place ?", "Si vous le souhaitez, il reste de la balance au démontage, gère le volume, les micros et les enchaînements."],
    ],
  },
  {
    slug: "location-lumiere", key: "lumiere", eyebrowClass: "cool",
    nav: "Lumière", short: "Jeux de lumière",
    title: "Location Jeux de Lumière à Rabat — Lyres, PAR LED, Fumée",
    description: "Location d'éclairage et jeux de lumière à Rabat, Témara, Skhirat et Salé : lyres beam, PAR LED, uplights, fumée lourde, étincelles froides, truss. Installation et technicien.",
    eyebrow: "Location lumière",
    h1: ["Location", "lumière"],
    lead: "Lyres, PAR LED, uplights, fumée lourde et étincelles froides : la lumière qui transforme une salle en scène, programmée par nos techniciens.",
    cardText: "Lyres beam, PAR LED, uplights, fumée lourde, étincelles froides.",
    intro: [
      "La lumière fait l'ambiance avant même la première note. Nous habillons la salle en couleurs, éclairons la scène et la piste, et programmons les temps forts : entrée des mariés, première danse, gâteau, DJ set.",
      "Nos lyres beam et wash, PAR LED et uplights sur batterie se pilotent en DMX. Le technicien suit le rythme de la soirée et déclenche fumée lourde et étincelles froides au bon moment.",
    ],
    included: ["Plan de feux", "Livraison et reprise", "Installation truss et pieds", "Programmation DMX", "Effets spéciaux sécurisés", "Technicien pendant l'événement"],
    faq: [
      ["Les étincelles froides sont-elles sans danger en intérieur ?", "Elles ne produisent ni flamme ni chaleur au toucher et sont conçues pour l'intérieur. Nous respectons les distances de sécurité et vérifions l'accord du lieu."],
      ["La fumée lourde déclenche-t-elle les détecteurs ?", "La fumée lourde reste au sol et ne déclenche en général pas les détecteurs. Pour le brouillard (hazer), nous vérifions avec le lieu à l'avance."],
      ["Pouvez-vous éclairer un jardin ou une façade ?", "Oui, avec des uplights sur batterie, sans câbles au sol, en une ou plusieurs couleurs."],
      ["Faut-il un technicien pour la lumière ?", "Pour les effets et un show animé, oui. Pour une ambiance fixe (PAR LED, uplights), nous pouvons installer et vous laisser le matériel."],
    ],
  },
];

// ---------------------------------------------------------------- general FAQ
export const homeFaq = [
  ["Dans quelles villes livrez-vous ?", "Nous livrons et installons à Rabat, Témara, Skhirat et Salé. Kénitra, Bouznika et Mohammedia sont possibles sur demande ; la livraison est indiquée sur le devis."],
  ["Combien coûte la location de sono, de lumière ou d'une table Pioneer DJ ?", "Le prix dépend du matériel, de la durée, du lieu et de la présence d'un technicien. Envoyez-nous la date, la ville et le nombre d'invités : vous recevez un devis gratuit et détaillé sous 24 h."],
  ["Combien de temps à l'avance faut-il réserver ?", "Pour les week-ends et la saison des mariages (mai à septembre), 2 à 4 semaines à l'avance. En semaine, souvent quelques jours suffisent : contactez-nous même en dernière minute."],
  ["Que comprend la prestation ?", "Livraison, installation, réglages et reprise du matériel. En option : un technicien présent pendant tout l'événement, et un DJ."],
  ["Peut-on louer le matériel sans technicien ?", "Oui, notamment pour les DJs qui connaissent le matériel Pioneer DJ. Nous vous montrons l'installation à la remise ; une caution peut être demandée."],
  ["Le matériel est-il fiable ?", "Chaque appareil est testé avant chaque sortie, et nous prévoyons du matériel de secours sur les prestations avec technicien."],
];
