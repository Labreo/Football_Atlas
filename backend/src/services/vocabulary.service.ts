export interface ConceptVocabulary {
  conceptId: string;
  translations: Record<string, string[]>; // Map language code ('en', 'de', etc.) to keywords
}

export class ConceptVocabularyService {
  private vocabularies: ConceptVocabulary[] = [
    {
      conceptId: 'false_9',
      translations: {
        en: ['false 9', 'false nine', 'dropping striker', 'messi dropping deep', 'dropping center-forward'],
        de: ['falsche neun', 'falscher neuner', 'abkippender stürmer', 'abkippenden stürmer', 'mitspielender stürmer'],
        es: ['falso nueve', 'delantero mentiroso', 'falso 9', 'nueve mentiroso'],
        fr: ['faux neuf', 'faux 9', 'attaquant de soutien', 'neuf menteur'],
        it: ['falso nove', 'falso 9', 'attaccante di raccordo', 'centravanti di manovra']
      }
    },
    {
      conceptId: 'high_press',
      translations: {
        en: ['high press', 'pressing high', 'gegenpress', 'pressing trigger', 'counter-press'],
        de: ['gegenpressing', 'hohes pressen', 'pressingauslöser', 'gegenpress', 'hohes gegenpressing'],
        es: ['presión alta', 'presión en bloque alto', 'presion alta', 'presionar arriba'],
        fr: ['pressing haut', 'contre-pressing', 'pressing en bloc haut', 'contre pressing'],
        it: ['pressing alto', 'riaggressione', 'pressione alta', 'pressing ultra-offensivo']
      }
    },
    {
      conceptId: 'pressing_trap',
      translations: {
        en: ['pressing trap', 'trap on the touchline', 'funneling', 'pressing bait'],
        de: ['pressingfalle', 'seitenlinienfalle', 'leitung', 'pressingfalle stellen'],
        es: ['trampa de presión', 'trampa lateral', 'embudo de presión', 'trampa de presion'],
        fr: ['piège de pressing', 'zone de pressing', 'piège sur la ligne', 'piege de pressing'],
        it: ['trappola di pressing', 'trappola laterale', 'imbuto di pressing', 'trappola del pressing']
      }
    },
    {
      conceptId: 'counter_attack',
      translations: {
        en: ['counter attack', 'counter-attack', 'transition goal', 'offensive transition', 'counterattack'],
        de: ['konter', 'umschaltspiel', 'umschaltmoment', 'konterangriff', 'gegenangriff'],
        es: ['contraataque', 'transición ofensiva', 'contragolpe', 'transicion ofensiva'],
        fr: ['contre-attaque', 'transition offensive', 'contre attaque'],
        it: ['contropiede', 'transizione offensiva', 'ripartenza']
      }
    },
    {
      conceptId: 'midfield_overload',
      translations: {
        en: ['midfield overload', 'numerical superiority in midfield', 'midfield diamond', 'overloading midfield'],
        de: ['mittelfeldüberzahl', 'überzahl im mittelfeld', 'mittelfelddiamant', 'mittelfeld überzahl'],
        es: ['sobrecarga de mediocampo', 'superioridad numérica en mediocampo', 'superioridad en el medio', 'sobrecarga del centro'],
        fr: ['surcharge au milieu', 'supériorité numérique au milieu', 'surcharge du milieu'],
        it: ['sovraccarico a centrocampo', 'superiorità numerica a centrocampo', 'sovraccarico in mezzo']
      }
    },
    {
      conceptId: 'low_block',
      translations: {
        en: ['low block', 'deep defense', 'flat defensive shape', 'screen zonal passing', 'parking the bus'],
        de: ['tiefes abwehrblock', 'tiefer block', 'zonaler schutz', 'bus parken'],
        es: ['bloque bajo', 'defensa profunda', 'repliegue bajo', 'aparcar el autobús'],
        fr: ['bloc bas', 'défense basse', 'repli bas', 'garer le bus'],
        it: ['blocco basso', 'difesa posizionale bassa', 'difesa bassa', 'autobus davanti alla porta']
      }
    },
    {
      conceptId: 'defensive_block',
      translations: {
        en: ['defensive block', 'compact block', 'compact defense', 'defensive shape', 'compactness shape', 'midfield defensive block'],
        de: ['abwehrblock', 'kompakter block', 'defensivblock', 'kompakter abwehrblock'],
        es: ['bloque defensivo', 'bloque compacto', 'bloque defensivo compacto', 'organización defensiva'],
        fr: ['bloc défensif', 'bloc compact', 'bloc defensif', 'organisation défensive'],
        it: ['blocco difensivo', 'blocco compatto', 'blocco difensivo compatto', 'fase difensiva di blocco']
      }
    },
    {
      conceptId: 'inverted_winger',
      translations: {
        en: ['inverted winger', 'winger cutting inside', 'wingers inside'],
        de: ['inverser außenspieler', 'inverser winger', 'nach innen ziehender winger', 'inversem flügelspieler'],
        es: ['extremo invertido', 'extremo que engancha hacia dentro', 'extremo cambiado'],
        fr: ['ailier inversé', 'ailier faux-pied', 'ailier rentrant'],
        it: ['esterno invertito', 'ala invertita', 'esterno con piede invertito']
      }
    },
    {
      conceptId: 'back_three_wing_back',
      translations: {
        en: ['back three', 'three at the back', 'back 3', 'three central defenders'],
        de: ['dreierkette', 'drei innenverteidiger', 'dreierkette abwehr', 'back 3'],
        es: ['línea de tres', 'linea de tres', 'tres centrales', 'defensa de tres'],
        fr: ['défense à trois', 'defense a trois', 'trois défenseurs centraux'],
        it: ['difesa a tre', 'tre difensori centrali', 'difesa a 3']
      }
    },
    {
      conceptId: 'third_man_run',
      translations: {
        en: ['third man run', 'third man combination', 'third-man run'],
        de: ['lauf des dritten mannes', 'dritter mann kombination', 'laufweg des dritten mannes'],
        es: ['tercer hombre', 'desmarque del tercer hombre', 'tercer hombre combinacion'],
        fr: ['troisième homme', 'course du troisième homme', 'troisieme homme'],
        it: ['terzo uomo', 'corsa del terzo uomo', 'combinazione terzo uomo']
      }
    },
    {
      conceptId: 'compactness',
      translations: {
        en: ['compactness', 'staying compact', 'compact block', 'horizontal alignment'],
        de: ['kompaktheit', 'kompakter block', 'kompakt stehen', 'kompakte staffelung'],
        es: ['compacidad', 'bloque compacto', 'mantenerse compacto', 'compactos en bloque'],
        fr: ['compacité', 'bloc compact', 'rester compact'],
        it: ['compattezza', 'blocco compatto', 'squadra compatta', 'compattezza difensiva']
      }
    }
  ];

  /**
   * Returns list of all supported concept IDs dynamically.
   */
  public getSupportedConceptIds(): string[] {
    return this.vocabularies.map((v) => v.conceptId);
  }

  /**
   * Returns list of translations/terms for a specific concept ID and language.
   */
  public getKeywordsForConcept(conceptId: string, language: string): string[] {
    const vocab = this.vocabularies.find((v) => v.conceptId === conceptId);
    if (!vocab) return [];
    return vocab.translations[language] || [];
  }

  /**
   * Returns list of Zod-like RegExp patterns for vocabulary checking in a language.
   */
  public getRegexesForLanguage(language: string): { conceptId: string; regexes: RegExp[] }[] {
    return this.vocabularies.map((vocab) => {
      const terms = vocab.translations[language] || vocab.translations['en']; // Fallback to EN
      const regexes = terms.map((term) => {
        // Escapes regex tokens and converts to bounded word boundaries
        const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i');
      });
      return {
        conceptId: vocab.conceptId,
        regexes
      };
    });
  }

  /**
   * Retrieves all keywords across all languages for a given concept.
   */
  public getAllKeywordsForConcept(conceptId: string): string[] {
    const vocab = this.vocabularies.find((v) => v.conceptId === conceptId);
    if (!vocab) return [];

    const allWords: string[] = [];
    Object.values(vocab.translations).forEach((words) => {
      allWords.push(...words);
    });
    return Array.from(new Set(allWords));
  }

  /**
   * Finds any concept matching a query.
   */
  public detectConceptFromQuery(query: string): string | undefined {
    const cleanQuery = query.toLowerCase();
    for (const vocab of this.vocabularies) {
      for (const [_, keywords] of Object.entries(vocab.translations)) {
        for (const keyword of keywords) {
          if (cleanQuery.includes(keyword)) {
            return vocab.conceptId;
          }
        }
      }
    }
    return undefined;
  }
}

export const conceptVocabularyService = new ConceptVocabularyService();
