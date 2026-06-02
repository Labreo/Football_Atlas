export class ConversationContextManager {
  private memoryLimit: number = 5;
  private lastQuestions: string[] = [];
  private activeConcept: string | null = null;
  private followUpChain: string[] = [];
  private recentExplanations: string[] = [];

  /**
   * Records a learning loop turn in the conversation memory.
   */
  public addTurn(question: string, explanation: string, conceptId?: string | null): void {
    this.lastQuestions.push(question);
    if (this.lastQuestions.length > this.memoryLimit) {
      this.lastQuestions.shift();
    }

    this.recentExplanations.push(explanation);
    if (this.recentExplanations.length > this.memoryLimit) {
      this.recentExplanations.shift();
    }

    if (conceptId) {
      if (this.activeConcept === conceptId) {
        this.followUpChain.push(question);
      } else {
        this.activeConcept = conceptId;
        this.followUpChain = [question];
      }
    } else {
      // Clear context if question does not resolve to a concept
      this.activeConcept = null;
      this.followUpChain = [];
    }
  }

  public getActiveConcept(): string | null {
    return this.activeConcept;
  }

  public getHistory() {
    return {
      questions: [...this.lastQuestions],
      explanations: [...this.recentExplanations],
      activeConcept: this.activeConcept
    };
  }

  /**
   * Simple heuristic classifier checking if the question refers to the current concept.
   */
  public isFollowUp(question: string): boolean {
    if (!this.activeConcept) return false;

    const q = question.toLowerCase();
    const followUpKeywords = [
      'what if', 'how about', 'why does he', 'what does she', 'if they', 
      'instead of', 'does it work', 'why is that', 'and what about', 
      'what if the', 'how do you', 'counters this', 'does this work',
      'this block', 'this press', 'that striker', 'him', 'following'
    ];

    const containsKeyword = followUpKeywords.some(keyword => q.includes(keyword));
    const isShortQuestion = q.split(' ').length <= 4;

    return containsKeyword || isShortQuestion;
  }

  public clear(): void {
    this.lastQuestions = [];
    this.activeConcept = null;
    this.followUpChain = [];
    this.recentExplanations = [];
  }
}
export const conversationContextManager = new ConversationContextManager();
