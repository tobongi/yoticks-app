export type SpokenGuidance = {
  language: 'fr-FR';
  text: string;
  rate: number;
};

export function buildSpokenGuidance(instruction: string): SpokenGuidance {
  const text = instruction.trim();
  if (!text) throw new Error('A spoken instruction is required.');
  return { language: 'fr-FR', text, rate: 0.86 };
}
