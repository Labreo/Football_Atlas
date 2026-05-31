import { Router } from 'express';
import { getConcepts, getConceptById, askTutor } from '../controllers/tactical.controller';

const router = Router();

router.get('/concepts', getConcepts);
router.get('/concepts/:id', getConceptById);
router.post('/tutor', askTutor);

export default router;
