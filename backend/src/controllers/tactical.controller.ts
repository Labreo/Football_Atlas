import { Request, Response } from 'express';
import { GraniteService } from '../services/granite.service';

const graniteService = new GraniteService();

export const getConcepts = async (req: Request, res: Response) => {
  try {
    const concepts = await graniteService.getAllTacticalConcepts();
    res.json(concepts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch concepts' });
  }
};

export const getConceptById = async (req: Request, res: Response) => {
  try {
    const concept = await graniteService.getTacticalConcept(req.params.id);
    if (!concept) {
      return res.status(404).json({ error: 'Tactical concept not found' });
    }
    res.json(concept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch concept' });
  }
};

export const askTutor = async (req: Request, res: Response) => {
  try {
    const { prompt, history = [] } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const response = await graniteService.queryTutor(prompt, history);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Tutor service error' });
  }
};
