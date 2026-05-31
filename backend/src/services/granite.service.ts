import { TacticalConcept, TutorResponse, ComplexityLevel, ConversationTurn } from '@football-atlas/shared';
import { DoclingService } from './docling.service';

const doclingService = new DoclingService();

export class GraniteService {
  private concepts: Record<string, TacticalConcept> = {
    false_9: {
      concept_id: 'false_9',
      concept_name: 'False 9',
      category: 'Attacking Shape',
      complexity: 'Intermediate',
      core_explanation: 'A centre-forward who drops deep into the space between the opponent\'s defensive line and midfield (Zone 14). This movement creates a numerical overload in central midfield, dragging center-backs out of position and opening space behind for wingers or attacking midfielders to exploit.',
      key_principles: [
        'Dropping deep to create a midfield diamond or overload.',
        'Dragging central defenders out of their structure.',
        'Creating passing lanes for inside forwards running into channels.',
        'Serving as a technical connector between lines.'
      ],
      defensive_response: 'Opponents often counter by employing a defensive midfielder to screen the space, or using strict zonal marking where center-backs do not follow the dropping run.',
      animation_module: 'false9',
      historical_examples: [
        {
          match: 'Real Madrid 2-6 Barcelona',
          season: '2008-09',
          teams: 'Real Madrid vs. Barcelona',
          description: 'Pep Guardiola deployed Lionel Messi as a False 9. Messi dropped deep into midfield, leaving Cannavaro and Metzelder without a direct player to mark, opening space for Henry and Eto\'o.'
        }
      ],
      related_concepts: ['third_man_run', 'midfield_overload'],
      docling_chunks: doclingService.getChunksForConcept('false_9')
    },
    high_press: {
      concept_id: 'high_press',
      concept_name: 'High Press',
      category: 'Out-of-Possession',
      complexity: 'Intermediate',
      core_explanation: 'A collective defensive tactic where a team applies immediate pressure high up the pitch, close to the opponent\'s penalty area. The goal is to disrupt buildup play, force passing errors, and win possession close to the target goal.',
      key_principles: [
        'Aggressive high pressure on the ball-playing center-backs/goalkeeper.',
        'Using cover shadows to block backward and horizontal passing lanes.',
        'Maintaining a compact team shape to compress the playing area.',
        'Forcing play wide towards the touchlines.'
      ],
      defensive_response: 'Utilizing a deep lying playmaker, sweeping goalkeeper, or direct long-ball passes to target target-men in space.',
      animation_module: 'highPress',
      historical_examples: [
        {
          match: 'Liverpool 4-3 Manchester City',
          season: '2017-18',
          teams: 'Liverpool vs. Manchester City',
          description: 'Jurgen Klopp\'s Liverpool applied a relentless high counter-press, forcing errors from Ederson and John Stones to score three quick-fire second-half goals.'
        }
      ],
      related_concepts: ['pressing_trap', 'compactness_pressing'],
      docling_chunks: doclingService.getChunksForConcept('high_press')
    },
    pressing_trap: {
      concept_id: 'pressing_trap',
      concept_name: 'Pressing Trap',
      category: 'Out-of-Possession',
      complexity: 'Advanced',
      core_explanation: 'A defensive mechanism where a team intentionally leaves a passing lane open, inviting the opponent to play the ball into a specific zone (the trap). Once the target receives the ball, adjacent players immediately close in, blocking all escape routes to force a turnover.',
      key_principles: [
        'Passive positioning to invite a specific forward or sideways pass.',
        'Simultaneous closure of space by 2-3 players upon the reception trigger.',
        'Using the touchline or a player\'s weak foot as an additional boundary.'
      ],
      defensive_response: 'Switching play quickly to the opposite side or using quick, one-touch vertical combinations to break out of the trapping zone.',
      animation_module: 'pressingTrap',
      historical_examples: [
        {
          match: 'Barcelona 1-0 Inter Milan',
          season: '2009-10',
          teams: 'Barcelona vs. Inter Milan',
          description: 'Jose Mourinho\'s Inter setup traps in the half-spaces, funneling Barca\'s possession wide and closing down Messi with double-teams immediately upon entry.'
        }
      ],
      related_concepts: ['high_press', 'compactness_pressing'],
      docling_chunks: doclingService.getChunksForConcept('pressing_trap')
    },
    midfield_overload: {
      concept_id: 'midfield_overload',
      concept_name: 'Overload in Midfield',
      category: 'Attacking Transition',
      complexity: 'Advanced',
      core_explanation: 'Creating numerical superiority in central zones of the pitch to control possession, bypass the opponent\'s pressing lines, and create free players to carry the ball forward.',
      key_principles: [
        'Positioning players between opposition lines to create triangles.',
        'Rotating midfielders to draw markers and free up passing options.',
        'Using fullbacks tucking inside (inverted fullbacks) to create midfield overloads.'
      ],
      defensive_response: 'Shifting defensive lines horizontally to stay compact, or matching midfield numbers with an extra central defender stepping up.',
      animation_module: 'midfieldOverload',
      historical_examples: [
        {
          match: 'Manchester City 4-0 Real Madrid',
          season: '2022-23',
          teams: 'Manchester City vs. Real Madrid',
          description: 'John Stones moved from center-back into central midfield, creating a 3-2 buildup box that completely overloaded Madrid\'s midfield trio.'
        }
      ],
      related_concepts: ['false_9', 'third_man_run'],
      docling_chunks: doclingService.getChunksForConcept('midfield_overload')
    },
    low_block: {
      concept_id: 'low_block',
      concept_name: 'Defensive Block (Low Block)',
      category: 'Defensive Shape',
      complexity: 'Beginner',
      core_explanation: 'A deep, compact defensive shape where the entire team drops close to their own box, minimizing the space behind them and focusing on protecting central corridors.',
      key_principles: [
        'Staying horizontally and vertically compact, leaving no room between defense and midfield.',
        'Forcing the opponent to play wide, cross-heavy deliveries.',
        'Protecting the space in front of the box (Zone 14).'
      ],
      defensive_response: 'Countered by rapid horizontal ball circulation, stretching the defense, or individual dribbles that draw players out of position.',
      animation_module: 'lowBlock',
      historical_examples: [
        {
          match: 'Barcelona 2-2 Chelsea',
          season: '2011-12',
          teams: 'Barcelona vs. Chelsea',
          description: 'Chelsea defended with 10 players inside their own defensive third, maintaining a low block that blocked central passing lines and secured their Champions League final spot.'
        }
      ],
      related_concepts: ['counter_trigger', 'compactness_pressing'],
      docling_chunks: doclingService.getChunksForConcept('low_block')
    },
    counter_trigger: {
      concept_id: 'counter_trigger',
      concept_name: 'Counter-Attack Trigger',
      category: 'Transition',
      complexity: 'Intermediate',
      core_explanation: 'The immediate shift from defense to attack the moment possession is won. Triggers identify vertical channels and exploit space vacated by the opponent\'s advanced shapes.',
      key_principles: [
        'First pass directed vertically out of the pressure zone.',
        'Explosive forward runs by wide attackers into channels.',
        'Taking advantage of disorganized defensive transitions.'
      ],
      defensive_response: 'Counter-pressing immediately upon losing possession, or committing tactical fouls to break momentum.',
      animation_module: 'counterTrigger',
      historical_examples: [
        {
          match: 'Leicester City 2-0 Liverpool',
          season: '2015-16',
          teams: 'Leicester City vs. Liverpool',
          description: 'Leicester won possession deep, and instantly sent a long pass to Jamie Vardy who scored a famous looping volley, exploiting Liverpool\'s high line.'
        }
      ],
      related_concepts: ['low_block', 'inverted_winger'],
      docling_chunks: doclingService.getChunksForConcept('counter_trigger')
    },
    inverted_winger: {
      concept_id: 'inverted_winger',
      concept_name: 'Inverted Winger',
      category: 'Attacking Shape',
      complexity: 'Beginner',
      core_explanation: 'A wide attacking player positioned on the side opposite of their dominant foot (e.g. left-footed winger playing on the right), allowing them to cut inside to shoot or combine, rather than stay wide to cross.',
      key_principles: [
        'Dribbling diagonally inwards towards the penalty area.',
        'Opening up passing angles to combine with central midfielders or the striker.',
        'Creating space for overlapping fullbacks on the outside flank.'
      ],
      defensive_response: 'Fullbacks showing the winger onto their weaker, outside foot, or double-teaming them with wide midfielders.',
      animation_module: 'invertedWinger',
      historical_examples: [
        {
          match: 'Bayern Munich 2-1 Borussia Dortmund',
          season: '2012-13',
          teams: 'Bayern Munich vs. Borussia Dortmund',
          description: 'Arjen Robben cut inside repeatedly from the right wing using his dominant left foot, culminating in the winning goal in the UCL final.'
        }
      ],
      related_concepts: ['false_9', 'counter_trigger'],
      docling_chunks: doclingService.getChunksForConcept('inverted_winger')
    },
    back_3_wingbacks: {
      concept_id: 'back_3_wingbacks',
      concept_name: 'Back 3 / Wing-Back System',
      category: 'Formation Mechanics',
      complexity: 'Intermediate',
      core_explanation: 'A tactical system using three central defenders and two high-positioned wing-backs. This offers defensive solidity with five at the back out of possession, while morphing into a wide attacking shape with the wing-backs acting as wingers.',
      key_principles: [
        'Wide central defenders pushing out to cover the half-spaces.',
        'Wing-backs providing the primary attacking width and depth.',
        'Dynamic transition between a 3-5-2 or 3-4-3 and a 5-3-2 or 5-4-1.'
      ],
      defensive_response: 'Exploiting the space behind the wing-backs during quick transitions before the defensive five can form.',
      animation_module: 'back3Wingbacks',
      historical_examples: [
        {
          match: 'Chelsea 5-0 Everton',
          season: '2016-17',
          teams: 'Chelsea vs. Everton',
          description: 'Antonio Conte\'s 3-4-3 system overloaded the flanks, with wing-backs Marcos Alonso and Victor Moses dominating the width.'
        }
      ],
      related_concepts: ['midfield_overload', 'low_block'],
      docling_chunks: doclingService.getChunksForConcept('back_3_wingbacks')
    },
    third_man_run: {
      concept_id: 'third_man_run',
      concept_name: 'Off-Ball Movement & Third Man Run',
      category: 'Attacking Mechanics',
      complexity: 'Advanced',
      core_explanation: 'An attacking combination where Player A passes to Player B to draw the defense\'s attention, while Player C (the third man) makes a blind run into space to receive a first-time pass from Player B.',
      key_principles: [
        'Player A acts as the initiator, passing to a wall player (Player B).',
        'Player B acts as the connector, returning the ball in one touch.',
        'Player C makes an off-ball run, moving behind the defensive line.'
      ],
      defensive_response: 'Maintaining focus on off-ball runners and dropping defenders deep to track runners instead of ball watching.',
      animation_module: 'thirdManRun',
      historical_examples: [
        {
          match: 'Barcelona 5-0 Real Madrid',
          season: '2010-11',
          teams: 'Barcelona vs. Real Madrid',
          description: 'Xavi, Messi, and Villa executed continuous third-man combinations, bypassing Madrid\'s central defenders before they could react.'
        }
      ],
      related_concepts: ['false_9', 'midfield_overload'],
      docling_chunks: doclingService.getChunksForConcept('third_man_run')
    },
    compactness_pressing: {
      concept_id: 'compactness_pressing',
      concept_name: 'Compactness & Pressing Lines',
      category: 'Defensive Organization',
      complexity: 'Intermediate',
      core_explanation: 'The defensive principle of reducing the distance between the front line (strikers) and the back line (defenders) to restrict the opponent\'s passing options in central channels.',
      key_principles: [
        'Restricting the vertical distance between lines to 10-15 meters.',
        'Moving the defensive line high up the pitch when the team presses.',
        'Shifting laterally as a single unit relative to the ball position.'
      ],
      defensive_response: 'Countered by direct passes over the defense or switching the play with long cross-field balls to isolate players.',
      animation_module: 'compactnessPressing',
      historical_examples: [
        {
          match: 'Atletico Madrid 1-0 Barcelona',
          season: '2015-16',
          teams: 'Atletico Madrid vs. Barcelona',
          description: 'Diego Simeone\'s Atletico maintained absolute defensive compactness, leaving zero space between lines and keeping Barcelona quiet.'
        }
      ],
      related_concepts: ['high_press', 'low_block'],
      docling_chunks: doclingService.getChunksForConcept('compactness_pressing')
    }
  };

  public async getAllTacticalConcepts(): Promise<TacticalConcept[]> {
    return Object.values(this.concepts);
  }

  public async getTacticalConcept(conceptId: string): Promise<TacticalConcept | null> {
    return this.concepts[conceptId] || null;
  }

  public async queryTutor(prompt: string, conversationHistory: ConversationTurn[]): Promise<TutorResponse> {
    const lowercasePrompt = prompt.toLowerCase();
    
    // Simple concept detection rules
    let matchedId = '';
    if (lowercasePrompt.includes('false 9') || lowercasePrompt.includes('false9') || lowercasePrompt.includes('messi')) {
      matchedId = 'false_9';
    } else if (lowercasePrompt.includes('high press') || lowercasePrompt.includes('klopp') || lowercasePrompt.includes('gegenpress')) {
      matchedId = 'high_press';
    } else if (lowercasePrompt.includes('trap')) {
      matchedId = 'pressing_trap';
    } else if (lowercasePrompt.includes('overload') || lowercasePrompt.includes('numerical superiority')) {
      matchedId = 'midfield_overload';
    } else if (lowercasePrompt.includes('low block') || lowercasePrompt.includes('defensive block') || lowercasePrompt.includes('chelsea')) {
      matchedId = 'low_block';
    } else if (lowercasePrompt.includes('counter') || lowercasePrompt.includes('transition') || lowercasePrompt.includes('vardy')) {
      matchedId = 'counter_trigger';
    } else if (lowercasePrompt.includes('inverted') || lowercasePrompt.includes('winger') || lowercasePrompt.includes('robben')) {
      matchedId = 'inverted_winger';
    } else if (lowercasePrompt.includes('wing') || lowercasePrompt.includes('back') || lowercasePrompt.includes('conte')) {
      matchedId = 'back_3_wingbacks';
    } else if (lowercasePrompt.includes('third man') || lowercasePrompt.includes('blind run') || lowercasePrompt.includes('xavi')) {
      matchedId = 'third_man_run';
    } else if (lowercasePrompt.includes('compact') || lowercasePrompt.includes('simeone') || lowercasePrompt.includes('lines')) {
      matchedId = 'compactness_pressing';
    }

    // Determine user knowledge level based on terms used
    let level: ComplexityLevel = 'Beginner';
    if (lowercasePrompt.includes('half-space') || lowercasePrompt.includes('zone 14') || lowercasePrompt.includes('tactical periodization')) {
      level = 'Advanced';
    } else if (lowercasePrompt.includes('trigger') || lowercasePrompt.includes('compact') || lowercasePrompt.includes('transition')) {
      level = 'Intermediate';
    }

    if (matchedId) {
      const concept = this.concepts[matchedId];
      let explanation = '';

      if (level === 'Beginner') {
        explanation = `Hello! Let's talk about the **${concept.concept_name}**. In simple terms, this is when ${concept.core_explanation.toLowerCase()} Think of it as a tactical tool to give your team an advantage. You can see how this works on the 3D pitch on your screen. Notice the player positions and movement patterns.`;
      } else if (level === 'Intermediate') {
        explanation = `Analyzing the **${concept.concept_name}** at an intermediate level. This concept belongs to the **${concept.category}** category. The main goal is: ${concept.core_explanation} Key indicators include: ${concept.key_principles.slice(0,2).join(' and ')}. Look at the animated visualization: we've highlighted the passing channels and defensive shapes.`;
      } else {
        explanation = `Deconstructing the tactical mechanics of the **${concept.concept_name}**. This system requires strict positioning: ${concept.key_principles.join(' | ')}. Grounded in modern literature processed via IBM Docling, this is highly effective. To counter it, the defensive unit must implement: ${concept.defensive_response}`;
      }

      return {
        explanation,
        concept_id: matchedId,
        detected_level: level,
        follow_up_suggestions: concept.related_concepts.map(id => `Tell me more about ${this.concepts[id]?.concept_name || id}`)
      };
    }

    // Fallback response
    return {
      explanation: "I couldn't match that query directly to our tactical handbook. Try asking about 'False 9', 'High Press', 'Pressing Trap', 'Midfield Overloads', or 'Defensive Blocks' to trigger a detailed visualization on our 3D Pitch!",
      detected_level: 'Beginner',
      follow_up_suggestions: [
        "Explain the False 9 role",
        "How does a High Press work?",
        "What is a Pressing Trap?"
      ]
    };
  }
}
