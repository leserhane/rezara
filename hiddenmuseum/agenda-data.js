/* Agenda culturel: temporary exhibitions and milestones, newest first.
   Dates are ISO (start/end); items without dates are listed as archives.
   type: 'expo' (temporary exhibition) or 'milestone' (temps fort).
   desc is always shown; more (optional) opens under "Read more". */
window.BAM_AGENDA = [
  {
    id: 'noun', type: 'expo', start: '2026-07-16', end: '2026-09-30',
    title: {
      fr: 'Noun, une odyssée du regard',
      en: 'Noun, an odyssey of the gaze',
      ar: 'نون، رحلة النظرة',
      es: 'Noun, una odisea de la mirada'
    },
    place: { fr: 'Dar Al-Kadi', en: 'Dar Al-Kadi', ar: 'دار القاضي', es: 'Dar Al-Kadi' },
    desc: {
      fr: 'Il y a dans la lettre « Noun » une promesse. Celle d’un pluriel longtemps tu, d’une présence longtemps regardée sans jamais regarder en retour.',
      en: 'The letter “Noun” holds a promise: that of a plural long kept silent, of a presence long looked at without ever looking back.',
      ar: 'في حرف «النون» وعدٌ: وعدُ جمعٍ طال صمته، وحضورٍ طالما نُظر إليه دون أن يردّ النظر.',
      es: 'En la letra «Noun» hay una promesa: la de un plural largamente silenciado, la de una presencia mirada durante mucho tiempo sin devolver nunca la mirada.'
    },
    more: {
      fr: 'Cette exposition est née de ce renversement fondamental : ici, la femme marocaine tient l’objectif. Elle cadre, elle choisit, elle nomme. Elle n’est plus l’objet d’un regard exotique ou colonial venu de l’extérieur — elle est le sujet actif qui capture, documente et réinvente sa propre réalité.',
      en: 'This exhibition was born of that fundamental reversal: here, the Moroccan woman holds the camera. She frames, she chooses, she names. She is no longer the object of an exotic or colonial gaze from outside — she is the active subject who captures, documents and reinvents her own reality.',
      ar: 'وُلد هذا المعرض من هذا الانقلاب الجوهري: هنا تمسك المرأة المغربية بالعدسة. هي من تؤطّر، وهي من تختار، وهي من تسمّي. لم تعد موضوعاً لنظرة غرائبية أو استعمارية آتية من الخارج، بل صارت الذاتَ الفاعلة التي تلتقط واقعها وتوثّقه وتعيد ابتكاره.',
      es: 'Esta exposición nace de ese giro fundamental: aquí, la mujer marroquí sostiene el objetivo. Encuadra, elige, nombra. Ya no es objeto de una mirada exótica o colonial venida de fuera: es el sujeto activo que capta, documenta y reinventa su propia realidad.'
    }
  },
  {
    id: 'confluences', type: 'expo', start: '2026-06-25', end: '2027-05-31',
    title: {
      fr: 'Confluences Tangéroises',
      en: 'Confluences Tangéroises',
      ar: 'ملتقيات طنجية',
      es: 'Confluences Tangéroises'
    },
    place: { fr: 'Borj Ennaâm · Tanger', en: 'Borj Ennaâm · Tangier', ar: 'برج النعام · طنجة', es: 'Borj Ennaâm · Tánger' }
  },
  {
    id: 'anniv20', type: 'milestone', year: 2022,
    title: {
      fr: 'Le Musée de Bank Al-Maghrib fête ses 20 ans',
      en: 'The Bank Al-Maghrib Museum turns 20',
      ar: 'متحف بنك المغرب يحتفل بذكراه العشرين',
      es: 'El Museo de Bank Al-Maghrib cumple 20 años'
    },
    desc: {
      fr: 'Une célébration à travers quatre expositions, dont trois hors les murs.',
      en: 'Celebrated through four exhibitions, three of them beyond the museum’s walls.',
      ar: 'احتفاء عبر أربعة معارض، ثلاثة منها خارج أسوار المتحف.',
      es: 'Una celebración a través de cuatro exposiciones, tres de ellas fuera del museo.'
    }
  },
  {
    id: 'virtual', type: 'milestone', year: 2020,
    title: {
      fr: 'Une présence virtuelle renforcée',
      en: 'A stronger online presence',
      ar: 'حضور رقمي معزَّز',
      es: 'Una presencia virtual reforzada'
    }
  },
  {
    id: 'au-dela-des-murs', type: 'expo', start: '2019-12-15', end: '2020-03-01',
    title: {
      fr: 'Créations d’au-delà des murs, ou Quand l’art libère',
      en: 'Creations from beyond the walls, or When art sets free',
      ar: 'إبداعات من وراء الأسوار، أو حين يحرّر الفن',
      es: 'Creaciones de más allá de los muros, o Cuando el arte libera'
    },
    desc: {
      fr: 'En partenariat avec le CNDH et la DGAPR.',
      en: 'In partnership with the CNDH and the DGAPR.',
      ar: 'بشراكة مع المجلس الوطني لحقوق الإنسان والمندوبية العامة لإدارة السجون وإعادة الإدماج.',
      es: 'En colaboración con el CNDH y la DGAPR.'
    },
    more: {
      fr: 'Convaincu que l’art représente un des moyens pour préparer le détenu à une réinsertion dans les tissus économique et social, le Musée s’est naturellement impliqué, aux côtés du CNDH, engagé fermement dans la défense des droits des personnes privées de liberté, et de la DGAPR qui déploie tous ses efforts pour soutenir la création culturelle dans le milieu carcéral, dans ce projet aux dimensions humaine et sociale pour offrir une vitrine aux personnes ayant trouvé dans l’art.',
      en: 'Convinced that art is one of the ways to prepare prisoners for their return to economic and social life, the Museum naturally joined this human and social project alongside the CNDH, firmly committed to defending the rights of people deprived of liberty, and the DGAPR, which spares no effort to support cultural creation in prisons — offering a showcase to people who have found a voice in art.',
      ar: 'إيماناً منه بأن الفن من بين الوسائل التي تهيّئ النزيل لإعادة الاندماج في النسيج الاقتصادي والاجتماعي، انخرط المتحف بشكل طبيعي في هذا المشروع ذي البعدين الإنساني والاجتماعي، إلى جانب المجلس الوطني لحقوق الإنسان، الملتزم بقوة بالدفاع عن حقوق الأشخاص المحرومين من حريتهم، والمندوبية العامة لإدارة السجون وإعادة الإدماج التي تبذل كل جهودها لدعم الإبداع الثقافي داخل المؤسسات السجنية، ليقدّم واجهة للأشخاص الذين وجدوا في الفن متنفّساً.',
      es: 'Convencido de que el arte es uno de los medios para preparar a las personas reclusas para su reinserción en el tejido económico y social, el Museo se implicó de forma natural en este proyecto de dimensión humana y social junto al CNDH, firmemente comprometido con la defensa de los derechos de las personas privadas de libertad, y a la DGAPR, que no escatima esfuerzos para apoyar la creación cultural en el medio penitenciario, ofreciendo un escaparate a quienes han encontrado en el arte una voz.'
    }
  },
  {
    id: 'fes', type: 'milestone', year: 2019,
    title: {
      fr: 'Mise en place du Musée régional de Fès',
      en: 'The Fez regional museum opens',
      ar: 'إحداث المتحف الجهوي بفاس',
      es: 'Creación del Museo regional de Fez'
    },
    place: { fr: 'Fès', en: 'Fez', ar: 'فاس', es: 'Fez' }
  },
  {
    id: 'miroir-collectif', type: 'expo', start: '2019-06-20', end: '2019-09-01',
    title: {
      fr: 'Miroir Collectif : comment explorer nos liens dans la différence ?',
      en: 'Collective Mirror: how can we explore our bonds through difference?',
      ar: 'مرآة جماعية: كيف نستكشف روابطنا في ظل الاختلاف؟',
      es: 'Espejo colectivo: ¿cómo explorar nuestros vínculos en la diferencia?'
    },
    desc: {
      fr: 'En partenariat avec le Comptoir des Mines.',
      en: 'In partnership with the Comptoir des Mines.',
      ar: 'بشراكة مع «كونتوار دي مين».',
      es: 'En colaboración con el Comptoir des Mines.'
    }
  },
  {
    id: 'aghmat', type: 'expo',
    title: {
      fr: 'Aghmat : passé rayonnant d’une cité marocaine',
      en: 'Aghmat: the radiant past of a Moroccan city',
      ar: 'أغمات: الماضي المشرق لمدينة مغربية',
      es: 'Aghmat: el pasado radiante de una ciudad marroquí'
    }
  },
  {
    id: 'sijilmassa', type: 'expo',
    title: {
      fr: 'Sijilmassa, carrefour de civilisations et de commerce',
      en: 'Sijilmassa, a crossroads of civilisations and trade',
      ar: 'سجلماسة، ملتقى الحضارات والتجارة',
      es: 'Siyilmasa, encrucijada de civilizaciones y comercio'
    }
  },
  {
    id: 'saladi', type: 'expo',
    title: {
      fr: 'Hommage à Abbès Saladi',
      en: 'A tribute to Abbès Saladi',
      ar: 'تكريم عباس صلادي',
      es: 'Homenaje a Abbès Saladi'
    }
  },
  {
    id: 'labied', type: 'expo',
    title: {
      fr: 'Miloud Labied',
      en: 'Miloud Labied',
      ar: 'ميلود الأبيض',
      es: 'Miloud Labied'
    }
  }
];
