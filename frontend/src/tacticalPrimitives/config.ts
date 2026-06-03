export const PRIMITIVE_STYLE_CONFIG = {
  colors: {
    attack: '#1D4ED8', // Royal Blue
    defend: '#DC2626', // Crimson Red
    highlight: '#39FF14', // Neon Green
    danger: '#FF0055', // Magenta/Red
    numericalAdvantage: '#00F3FF', // Neon Cyan
    passingLane: '#00F3FF', // Neon Cyan
    pressingArea: '#DC2626', // Crimson Red
    compactness: '#FFCC00', // Neon Amber
  },
  opacities: {
    default: 0.2,
    light: 0.15,
    heavy: 0.25,
  },
  arrows: {
    movement: {
      color: '#39FF14',
      width: 3,
      dashSpeed: 1.0,
      dashSize: 1.5,
      gapSize: 1.0,
    },
    passing: {
      color: '#00F3FF',
      width: 2.5,
      dashSpeed: 0.0, // Solid arrow
    },
    pressing: {
      color: '#DC2626',
      width: 2,
      dashSpeed: 1.2,
      dashSize: 1.0,
      gapSize: 1.0,
    },
    rotation: {
      color: '#FFCC00',
      width: 2.5,
      curved: true,
    },
    support: {
      color: '#39FF14',
      width: 2.5,
      dashSpeed: 0.8,
    },
    counter: {
      color: '#00F3FF',
      width: 3,
      dashSpeed: 1.5,
    },
  },
};
