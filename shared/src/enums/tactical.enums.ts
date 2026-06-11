export enum TacticalCategory {
  ATTACKING_SHAPE = 'ATTACKING_SHAPE',
  DEFENSIVE_SHAPE = 'DEFENSIVE_SHAPE',
  TRANSITION = 'TRANSITION',
  PRESSING = 'PRESSING',
  FORMATION = 'FORMATION',
  SPATIAL_CONTROL = 'SPATIAL_CONTROL'
}

export enum ComplexityLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum RequiredOverlay {
  PASSING_LANES = 'PASSING_LANES',
  PRESSING_ZONES = 'PRESSING_ZONES',
  MOVEMENT_ARROWS = 'MOVEMENT_ARROWS',
  SPACE_CONTROL = 'SPACE_CONTROL',
  DEFENSIVE_LINES = 'DEFENSIVE_LINES'
}

/**
 * AudienceMode — the lens through which an explanation is framed.
 * CASUAL_FAN:      story, players, emotion, plain football language.
 * TACTICAL_STUDENT: structure, spatial relationships, tactical vocabulary.
 * Same animation always plays; only the narration voice changes.
 */
export enum AudienceMode {
  CASUAL_FAN = 'CASUAL_FAN',
  TACTICAL_STUDENT = 'TACTICAL_STUDENT'
}

