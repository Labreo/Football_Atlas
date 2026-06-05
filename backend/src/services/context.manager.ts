import { ConversationContext } from '@football-atlas/shared';
import { ComplexityLevel } from '@football-atlas/shared';

export interface SessionContext {
  conversation_id: string;
  last_questions: string[];
  last_answers: string[];
  served_example_ids: string[];
  user_level: ComplexityLevel;
  context: ConversationContext;
}

export class ContextManager {
  private static instance: ContextManager;
  private conversationMemory: Record<string, SessionContext> = {};

  private constructor() {}

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Resolves or initializes session memory.
   */
  public getOrCreateSessionContext(conversationId: string): SessionContext {
    if (!this.conversationMemory[conversationId]) {
      this.conversationMemory[conversationId] = {
        conversation_id: conversationId,
        last_questions: [],
        last_answers: [],
        served_example_ids: [],
        user_level: ComplexityLevel.BEGINNER,
        context: {
          active_concept: null,
          previous_concepts: [],
          active_match: null,
          active_breakdown: null,
          active_example: null,
          conversation_summary: '',
          user_intent: null,
          conversation_depth: 0,
        },
      };
    }
    return this.conversationMemory[conversationId];
  }

  /**
   * Retrieves the raw structural conversation context.
   */
  public getContext(conversationId: string): ConversationContext {
    return this.getOrCreateSessionContext(conversationId).context;
  }

  /**
   * Safely updates the context state.
   */
  public updateContext(conversationId: string, updates: Partial<ConversationContext>): void {
    const session = this.getOrCreateSessionContext(conversationId);
    
    // If the active concept is changing, save it to the history list
    if (updates.active_concept && updates.active_concept !== session.context.active_concept) {
      if (session.context.active_concept && !session.context.previous_concepts.includes(session.context.active_concept)) {
        session.context.previous_concepts.push(session.context.active_concept);
      }
    }

    session.context = {
      ...session.context,
      ...updates,
    };
  }

  /**
   * Records a user/assistant exchange.
   */
  public addTurn(conversationId: string, question: string, answer: string): void {
    const session = this.getOrCreateSessionContext(conversationId);
    session.last_questions.push(question);
    session.last_answers.push(answer);
    session.context.conversation_depth = session.last_questions.length;

    // Enforce minimum of 10 turns history, prune older turns
    if (session.last_questions.length > 20) {
      session.last_questions.shift();
      session.last_answers.shift();
    }
  }

  /**
   * Resets context memory for a given session.
   */
  public clearContext(conversationId: string): void {
    delete this.conversationMemory[conversationId];
  }
}

export const contextManager = ContextManager.getInstance();
