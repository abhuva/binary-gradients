import { uid } from '../domain/random.js';

export function makeBuiltinLuts() {
  return {
    spectral: {
      id: 'spectral',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#00bfff', kind: 'smooth' },
        { id: uid(), index: 43, color: '#00ff80', kind: 'smooth' },
        { id: uid(), index: 85, color: '#ffff30', kind: 'smooth' },
        { id: uid(), index: 128, color: '#ff6030', kind: 'smooth' },
        { id: uid(), index: 170, color: '#ff40b0', kind: 'smooth' },
        { id: uid(), index: 213, color: '#7040ff', kind: 'smooth' },
        { id: uid(), index: 255, color: '#00bfff', kind: 'smooth' },
      ],
    },
    fire: {
      id: 'fire',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#000000', kind: 'smooth' },
        { id: uid(), index: 56, color: '#4a0900', kind: 'smooth' },
        { id: uid(), index: 120, color: '#dd3d00', kind: 'smooth' },
        { id: uid(), index: 190, color: '#ffd050', kind: 'smooth' },
        { id: uid(), index: 255, color: '#ffffff', kind: 'smooth' },
      ],
    },
    'candy-vga': {
      id: 'candy-vga',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#ea52b4', kind: 'smooth' },
        { id: uid(), index: 64, color: '#f5d547', kind: 'smooth' },
        { id: uid(), index: 128, color: '#37b9f1', kind: 'smooth' },
        { id: uid(), index: 192, color: '#7be06f', kind: 'smooth' },
        { id: uid(), index: 255, color: '#ea52b4', kind: 'smooth' },
      ],
    },
    mono: {
      id: 'mono',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#000000', kind: 'smooth' },
        { id: uid(), index: 255, color: '#ffffff', kind: 'smooth' },
      ],
    },
    amber: {
      id: 'amber',
      length: 256,
      points: [
        { id: uid(), index: 0, color: '#000000', kind: 'smooth' },
        { id: uid(), index: 110, color: '#9c4b00', kind: 'smooth' },
        { id: uid(), index: 190, color: '#ffb12c', kind: 'smooth' },
        { id: uid(), index: 255, color: '#fff2a0', kind: 'smooth' },
      ],
    },
  };
}