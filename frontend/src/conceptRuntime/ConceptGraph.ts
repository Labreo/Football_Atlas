import { conceptLoader } from './ConceptLoader';

// ────────────────────────────────────────────────────────────
// CONCEPT GRAPH
// Relationship traversal built from loaded manifest data.
// ────────────────────────────────────────────────────────────

export interface ConceptGraphNode {
  concept_id: string;
  display_name: string;
  category: string;
  complexity: string;
  prerequisites: string[];
  related_concepts: string[];
  follow_up_concepts: string[];
}

export class ConceptGraph {
  private nodeCache: Map<string, ConceptGraphNode> | null = null;

  /**
   * Builds or retrieves the cached graph from loaded manifests.
   */
  private getNodes(): Map<string, ConceptGraphNode> {
    if (this.nodeCache) return this.nodeCache;

    this.nodeCache = new Map();
    const manifests = conceptLoader.getLoadedManifests();

    for (const manifest of manifests) {
      this.nodeCache.set(manifest.concept_id, {
        concept_id: manifest.concept_id,
        display_name: manifest.display_name,
        category: manifest.category,
        complexity: manifest.complexity,
        prerequisites: manifest.teaching_metadata.prerequisites,
        related_concepts: manifest.related_concepts,
        follow_up_concepts: manifest.teaching_metadata.follow_up_concepts,
      });
    }

    return this.nodeCache;
  }

  /**
   * Returns concepts that should be learned before this one.
   */
  public getPrerequisites(conceptId: string): ConceptGraphNode[] {
    const nodes = this.getNodes();
    const node = nodes.get(conceptId);
    if (!node) return [];

    return node.prerequisites
      .map((id) => nodes.get(id))
      .filter((n): n is ConceptGraphNode => n !== undefined);
  }

  /**
   * Returns sibling/adjacent concepts.
   */
  public getRelatedConcepts(conceptId: string): ConceptGraphNode[] {
    const nodes = this.getNodes();
    const node = nodes.get(conceptId);
    if (!node) return [];

    return node.related_concepts
      .map((id) => nodes.get(id))
      .filter((n): n is ConceptGraphNode => n !== undefined);
  }

  /**
   * Returns logical follow-up concepts to explore next.
   */
  public getNextConcepts(conceptId: string): ConceptGraphNode[] {
    const nodes = this.getNodes();
    const node = nodes.get(conceptId);
    if (!node) return [];

    return node.follow_up_concepts
      .map((id) => nodes.get(id))
      .filter((n): n is ConceptGraphNode => n !== undefined);
  }

  /**
   * Breadth-first traversal of the concept graph starting from a concept.
   * Returns an ordered chain of concepts up to the specified depth.
   */
  public getConceptChain(startId: string, depth: number = 3): ConceptGraphNode[] {
    const nodes = this.getNodes();
    const visited = new Set<string>();
    const queue: Array<{ id: string; level: number }> = [{ id: startId, level: 0 }];
    const result: ConceptGraphNode[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) || current.level > depth) continue;

      visited.add(current.id);
      const node = nodes.get(current.id);
      if (!node) continue;

      if (current.id !== startId) {
        result.push(node);
      }

      // Enqueue neighbors: follow-ups first, then related, then prerequisites
      const neighbors = [
        ...node.follow_up_concepts,
        ...node.related_concepts,
        ...node.prerequisites,
      ];

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, level: current.level + 1 });
        }
      }
    }

    return result;
  }

  /**
   * Returns all nodes in the graph.
   */
  public getAllNodes(): ConceptGraphNode[] {
    return Array.from(this.getNodes().values());
  }

  /**
   * Returns a node by concept ID.
   */
  public getNode(conceptId: string): ConceptGraphNode | undefined {
    return this.getNodes().get(conceptId);
  }

  /**
   * Invalidates the cache (call when packages are hot-loaded).
   */
  public invalidateCache(): void {
    this.nodeCache = null;
  }
}

export const conceptGraph = new ConceptGraph();
