import api from '@/lib/api/client';
import { templatesApi, type TemplateListItem } from '@/lib/api/templates';

export async function loadRecommendedPrograms(): Promise<TemplateListItem[]> {
  const [recRes, userRes] = await Promise.all([
    templatesApi.recommended(),
    api.get('/api/v1/users/me'),
  ]);

  const rec = recRes.data as {
    recommended?: TemplateListItem;
    alternatives?: TemplateListItem[];
  };
  const user = userRes.data as {
    goalMode?: string;
    experienceLevel?: string;
    daysPerWeek?: number;
  };

  const collected: TemplateListItem[] = [];
  const seen = new Set<string>();

  function add(t: TemplateListItem | undefined | null) {
    if (!t || seen.has(t.id) || collected.length >= 3) return;
    seen.add(t.id);
    collected.push(t);
  }

  add(rec.recommended ?? null);
  for (const alt of rec.alternatives ?? []) add(alt);

  if (collected.length < 3) {
    const goal = user.goalMode ?? undefined;
    const level = user.experienceLevel ?? undefined;
    const filteredRes = await templatesApi.all({
      ...(goal ? { goal } : {}),
      ...(level ? { level } : {}),
    });
    const filtered = Array.isArray(filteredRes.data) ? (filteredRes.data as TemplateListItem[]) : [];
    for (const t of filtered) {
      add(t);
      if (collected.length >= 3) break;
    }
  }

  return collected;
}
