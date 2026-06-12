import { type TemplateListItem } from '@/lib/api/templates';

export type BrowseTemplate = {
  id: string;
  name: string;
  tag: string;
  badge: string | null;
  goal: string;
  experience: string;
  durationWeeks: number;
  frequencyPerWeek: number;
  splitType: string;
  accentKey: 'primary' | 'secondary' | 'tertiary';
  description: string;
  days: string[];
  stats: Array<{ label: string; value: string }>;
  featured: boolean;
};

export function mapApiTemplate(template: TemplateListItem): BrowseTemplate {
  const accentKey =
    template.goal.toLowerCase().includes('strength')
      ? 'secondary'
      : template.goal.toLowerCase().includes('power')
        ? 'tertiary'
        : 'primary';

  return {
    id: template.id,
    name: template.name,
    tag: template.primaryFocus,
    badge: template.badge,
    goal: template.goal,
    experience: template.level,
    durationWeeks: parseInt(template.durationWeeks.split('–')[0] ?? template.durationWeeks, 10) || 8,
    frequencyPerWeek: template.daysPerWeek,
    splitType: template.splitStyle,
    accentKey,
    description: template.difficultyWarning
      ? `${template.progressionType}. ${template.difficultyWarning}`
      : `${template.progressionType} template.`,
    days: template.days,
    stats: template.stats,
    featured: template.featured,
  };
}
