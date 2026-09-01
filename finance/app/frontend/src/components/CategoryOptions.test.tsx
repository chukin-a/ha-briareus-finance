import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryOptions } from './CategoryOptions';

describe('CategoryOptions', () => {
  it('renders the category tree compactly with parents before children', () => {
    render(<select><CategoryOptions type="expense" categories={[
      { id: 'food', name: 'Продукти', type: 'expense', parentId: null, icon: 'circle', color: '#fff', sortOrder: 1 },
      { id: 'child', name: 'Молочне', type: 'expense', parentId: 'food', icon: 'circle', color: '#fff', sortOrder: 2 },
      { id: 'other', name: 'Інше', type: 'expense', parentId: null, icon: 'circle', color: '#fff', sortOrder: 3 },
    ]}/></select>);
    const options = screen.getAllByRole('option');
    expect(options.map(option => option.textContent)).toEqual(['Продукти', '\u00a0\u00a0Молочне', 'Інше']);
  });
});
