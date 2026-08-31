export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string;
  color: string;
  sortOrder: number;
}
