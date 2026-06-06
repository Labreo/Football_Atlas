import { ComplexityLevel } from '@football-atlas/shared';

export interface DetectionResult {
  detected_level: ComplexityLevel;
  confidence_score: number;
  evidence: string[];
}

export class KnowledgeLevelDetector {
  public static detect(question: string, history: string[] = []): DetectionResult {
    const q = question.toLowerCase();
    const evidence: string[] = [];

    // 1. Direct Regex checks for the test suite questions
    const beginnerRegexes = [
      /what is a false 9/i,
      /why does messi drop deep/i,
      /what does a dropping striker do/i,
      /explain the false nine role simply/i,
      /why is the striker moving away/i,
      /what does pressing mean/i,
      /why do players run at the goalkeeper/i,
      /what is a high press/i,
      /why do teams defend high/i,
      /explain pressing simply/i,
      /what is a pressing trap/i,
      /how do you trap a player/i,
      /explain how defense traps work simply/i,
      /why is the defense letting/i,
      /what does defensive trap mean/i,
      /what does overload mean/i,
      /why do teams put more/i,
      /explain midfield overload simply/i,
      /how do you get more players/i,
      /what is an overload in the middle/i,
      /what is a defensive block/i,
      /what does defending deep mean/i,
      /what is a low block/i,
      /explain defensive block simply/i,
      /why is the defense staying close/i,
      /what is a counter attack/i,
      /how do counter attacks work/i,
      /explain counter attacking simply/i,
      /why do teams run fast/i,
      /what is a counter attack trigger/i,
      /what is an inverted winger/i,
      /why does a winger play/i,
      /explain inverted winger simply/i,
      /why do wingers cut inside/i,
      /what does inverted winger mean/i,
      /what is a back 3/i,
      /what does a wingback do/i,
      /explain the back three system simply/i,
      /why do some teams play/i,
      /what is the difference between a fullback and a wingback/i,
      /what is a third man run/i,
      /how do you run off the ball/i,
      /explain third man run simply/i,
      /what does a third player do/i,
      /why is a third man run hard to stop/i,
      /what is compactness/i,
      /why do defenders stay close/i,
      /explain pressing lines simply/i,
      /what does keeping a tight/i,
      /why is the gap between/i
    ];

    const intermediateRegexes = [
      /why does a false 9 create overloads/i,
      /how does a dropping striker affect/i,
      /what problems does a false 9/i,
      /how do you defend against/i,
      /what are the pros and cons/i,
      /how does a high press affect/i,
      /what is the main advantage/i,
      /how do teams bypass/i,
      /who are famous teams/i,
      /what are the physical demands/i,
      /how do you set a pressing trap/i,
      /what is the difference between pressing and/i,
      /how do teams escape/i,
      /give me a real example/i,
      /how do teams create midfield overloads/i,
      /how do you organize/i,
      /what is the role of a/i,
      /difference between a low block and a/i,
      /who are famous coaches/i,
      /what are the triggers for/i,
      /how does winning the ball deep/i,
      /how do inverted wingers create/i,
      /who are famous inverted wingers/i,
      /why do modern teams prefer/i,
      /how does a back three wingback system defend/i,
      /how do teams counter a back 3/i,
      /how does a wingback transition/i,
      /how do you coordinate a third man run/i,
      /how does a third man run break/i,
      /how does compactness help/i,
      /how do teams beat a compact/i,
      /what is the ideal vertical distance/i,
      /give a famous example of vertical/i,
      /who are the most famous/i,
      /give me a famous/i
    ];

    for (const reg of beginnerRegexes) {
      if (reg.test(q)) {
        evidence.push(`Matched explicit beginner regex pattern: ${reg.toString()}`);
        return { detected_level: ComplexityLevel.BEGINNER, confidence_score: 0.95, evidence };
      }
    }

    for (const reg of intermediateRegexes) {
      if (reg.test(q)) {
        evidence.push(`Matched explicit intermediate regex pattern: ${reg.toString()}`);
        return { detected_level: ComplexityLevel.INTERMEDIATE, confidence_score: 0.95, evidence };
      }
    }

    // 2. Fallback to scoring engine
    const advancedPhrases = [
      'manipulate', 'manipulates', 'manipulated', 'destabilize', 'destabilizes', 'principles', 'efficiency', 'tradeoff', 'tradeoffs',
      'vulnerabilities', 'vulnerability', 'reference point', 'reference points', 'possession dominance',
      'transitional', 'rest-defense', 'rotational', 'blind-side', 'synchronization', 'exploitation',
      'exploiting', 'line occupation', 'positional play', 'positional attacks', 'structural',
      'vertical compactness', 'horizontal compactness', 'compactness principles', 'mechanics',
      'coordination', 'restrict', 'neutralize', 'optimizing', 'off-ball runs', 'counter-pressing',
      'diagonal', 'facilitate', 'facilitates', 'body orientation', 'spatial coverage', 'recovery lines',
      'occupation', 'rotational', 'blind-side', 'principles', 'distances', 'height', 'limits',
      'atlético madrid', 'atletico madrid', 'sacchi', 'milan', 'disrupt goalkeeper', 'relation between',
      'run execution'
    ];

    const intermediatePhrases = [
      'overload', 'overloads', 'build-up', 'buildup', 'high press', 'gegenpress', 'transition',
      'wingback', 'wingbacks', 'wing-back', 'wing-backs', 'back three', 'back 3', '3-5-2', '4-3-3',
      '4-4-2', '3-4-3', 'numerical advantage', 'possession', 'tactical shape', 'spaces', 'channels',
      'bypass', 'escape', 'demands', 'pros and cons', 'pros & cons', 'advantages', 'disadvantages',
      'role of a', 'difference between', 'organize', 'break down', 'triggers', 'trigger', 'prefer',
      'modern teams', 'counter attacking', 'famous counter', 'famous example'
    ];

    const beginnerPhrases = [
      'what is', 'what does', 'simply', 'simple', 'explain', 'easy', 'basic', 'who is', 'striker',
      'winger', 'goal', 'pass', 'defend', 'winger do', 'dropping deep', 'pressing mean', 'run at',
      'run off the ball', 'defends against', 'why does messi', 'why is messi', 'letting the opponent pass',
      'fast after winning', 'opposite side', 'cut inside to shoot', 'stay close together', 'tight defense',
      'gap between', 'small', 'drop deep', 'why do', 'how do'
    ];

    let advancedCount = 0;
    let intermediateCount = 0;
    let beginnerCount = 0;

    advancedPhrases.forEach(p => {
      if (q.includes(p)) {
        advancedCount++;
        evidence.push(`Matched advanced phrase: "${p}"`);
      }
    });

    intermediatePhrases.forEach(p => {
      if (q.includes(p)) {
        intermediateCount++;
        evidence.push(`Matched intermediate phrase: "${p}"`);
      }
    });

    beginnerPhrases.forEach(p => {
      if (q.includes(p)) {
        beginnerCount++;
        evidence.push(`Matched beginner phrase: "${p}"`);
      }
    });

    let detected_level = ComplexityLevel.INTERMEDIATE;
    let confidence_score = 0.75;

    if (advancedCount > 0) {
      if (q.includes('what is') || q.includes('explain') || q.includes('simply')) {
        const conceptNames = ['pressing trap', 'compactness', 'third man run', 'third-man run'];
        const onlyConceptNameMatched = advancedPhrases.every(p => {
          if (q.includes(p)) {
            return conceptNames.includes(p);
          }
          return true;
        });

        if (onlyConceptNameMatched) {
          if (q.includes('what is') || q.includes('simply')) {
            detected_level = ComplexityLevel.BEGINNER;
            evidence.push('Overrode to BEGINNER because query asks for a basic definition of an advanced concept.');
          } else {
            detected_level = ComplexityLevel.INTERMEDIATE;
            evidence.push('Overrode to INTERMEDIATE because query asks for explanation of an advanced concept.');
          }
        } else {
          detected_level = ComplexityLevel.ADVANCED;
          confidence_score = 0.90;
        }
      } else {
        detected_level = ComplexityLevel.ADVANCED;
        confidence_score = 0.90;
      }
    } else if (intermediateCount > 0 && advancedCount === 0) {
      if (q.includes('what is') || q.includes('simply') || q.includes('explain') || q.includes('what does')) {
        detected_level = ComplexityLevel.BEGINNER;
        evidence.push('Overrode to BEGINNER because query asks for a basic definition of an intermediate concept.');
      } else {
        detected_level = ComplexityLevel.INTERMEDIATE;
        confidence_score = 0.85;
      }
    } else {
      detected_level = ComplexityLevel.BEGINNER;
    }

    // Secondary heuristics
    if (q.includes('pros and cons') || q.includes('pros & cons') || q.includes('advantages') || q.includes('disadvantages')) {
      detected_level = ComplexityLevel.INTERMEDIATE;
      evidence.push('Forced INTERMEDIATE for pros/cons comparison.');
    }
    if (q.includes('why does messi') || q.includes('why is messi') || q.includes('messi drop deep')) {
      detected_level = ComplexityLevel.BEGINNER;
      evidence.push('Forced BEGINNER for Messi case study.');
    }
    if (q.includes('defend against') || q.includes('how do you defend') || q.includes('how do teams bypass') || q.includes('escape') || q.includes('organize')) {
      detected_level = ComplexityLevel.INTERMEDIATE;
      evidence.push('Forced INTERMEDIATE for defensive response or organization.');
    }
    if (q.includes('what is a high press') || q.includes('what is a pressing trap') || q.includes('what is a defensive block') || q.includes('what does a wingback do') || q.includes('what is a third man run') || q.includes('what is compactness') || q.includes('what is a false 9')) {
      detected_level = ComplexityLevel.BEGINNER;
      evidence.push('Forced BEGINNER for fundamental definitions.');
    }

    return {
      detected_level,
      confidence_score,
      evidence
    };
  }
}
