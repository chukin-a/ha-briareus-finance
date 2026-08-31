import type { Category } from '../types/finance';

export function CategoryOptions({ categories, type }: { categories: Category[]; type: Category['type'] }) {
  const matching = categories.filter(category => category.type === type);
  const ids = new Set(matching.map(category => category.id));
  const children = new Map<string | null, Category[]>();

  for (const category of matching) {
    const parentId = category.parentId && ids.has(category.parentId) ? category.parentId : null;
    children.set(parentId, [...(children.get(parentId) || []), category]);
  }

  const rows: Array<{ category: Category; depth: number }> = [];
  const visited = new Set<string>();
  const append = (parentId: string | null, depth: number) => {
    for (const category of children.get(parentId) || []) {
      if (visited.has(category.id)) continue;
      visited.add(category.id);
      rows.push({ category, depth });
      append(category.id, depth + 1);
    }
  };

  append(null, 0);
  for (const category of matching) {
    if (!visited.has(category.id)) rows.push({ category, depth: 0 });
  }

  return rows.map(({ category, depth }) => (
    <option key={category.id} value={category.id}>
      {`${'\u00a0\u00a0'.repeat(depth)}${category.name}`}
    </option>
  ));
}
