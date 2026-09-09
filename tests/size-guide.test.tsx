import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SizeGuide from '@/components/SizeGuide';

async function openGuide() {
  const user = userEvent.setup();
  render(<SizeGuide />);
  await user.click(screen.getByRole('button', { name: /size guide/i }));
  return { user, dialog: screen.getByRole('dialog', { name: /size guide/i }) };
}

describe('size guide', () => {
  test('is closed until the size guide link is clicked', () => {
    render(<SizeGuide />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /size guide/i })).toBeInTheDocument();
  });

  test('shows the trouser, jacket and shirt garment charts, in deck order, with their size runs', async () => {
    const { dialog } = await openGuide();
    expect(within(dialog).getByText(/showroom will be pleased to assist/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/made to order/i)).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole('table').map((t) => t.getAttribute('aria-labelledby'))).toEqual([
      'size-chart-Trouser',
      'size-chart-Jacket',
      'size-chart-Shirts',
    ]);
    const jacket = within(dialog).getByRole('table', { name: /jacket/i });
    for (const size of ['44', '46', '48', '50', '52', '54', '56', '58']) {
      expect(within(jacket).getByRole('columnheader', { name: size })).toBeInTheDocument();
    }
    const trouser = within(dialog).getByRole('table', { name: /trouser/i });
    for (const size of ['44', '46', '48', '50', '52', '54', '56', '58']) {
      expect(within(trouser).getByRole('columnheader', { name: size })).toBeInTheDocument();
    }
    const shirts = within(dialog).getByRole('table', { name: /shirt/i });
    for (const size of ['XS', 'S', 'M', 'L', 'XL', 'XXL']) {
      expect(within(shirts).getByRole('columnheader', { name: size })).toBeInTheDocument();
    }
    for (const row of ['Shoulders', 'Half Waist', 'Sleeve Length', 'Back Length']) {
      expect(within(jacket).getByRole('rowheader', { name: row })).toBeInTheDocument();
    }
    for (const row of ['Waist Size', 'Inseam', 'Outseam', 'Bottom Width']) {
      expect(within(trouser).getByRole('rowheader', { name: row })).toBeInTheDocument();
    }
    for (const row of ['Neck', 'Point to Point', 'Sleeve Length', 'Back Length']) {
      expect(within(shirts).getByRole('rowheader', { name: row })).toBeInTheDocument();
    }
  });

  test('measurements read as plain inch fractions without unit marks, and convert to whole centimetres', async () => {
    const { user, dialog } = await openGuide();
    expect(within(dialog).getByRole('radio', { name: /inch/i })).toBeChecked();
    const jacket = within(dialog).getByRole('table', { name: /jacket/i });
    // Jacket 46 shoulders: 18 1/2 inches, written without a " mark.
    expect(within(jacket).getAllByText('18 1/2').length).toBeGreaterThan(0);
    expect(within(jacket).queryAllByText(/"/)).toHaveLength(0);
    const shirts = within(dialog).getByRole('table', { name: /shirt/i });
    expect(within(shirts).getByText('15')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: /cm/i }));
    // 18.5 in → 47 cm; 15 in → 38 cm.
    expect(within(jacket).getAllByText('47 cm').length).toBeGreaterThan(0);
    expect(within(shirts).getByText('38 cm')).toBeInTheDocument();
    expect(within(shirts).queryByText('15')).not.toBeInTheDocument();
  });

  test('trouser waist sizes are plain size numbers, not measurements, in either unit', async () => {
    const { user, dialog } = await openGuide();
    const trouser = within(dialog).getByRole('table', { name: /trouser/i });
    const waistCells = () =>
      within(within(trouser).getByRole('rowheader', { name: 'Waist Size' }).closest('tr')!)
        .getAllByRole('cell')
        .map((c) => c.textContent);
    expect(waistCells()).toEqual(['28', '30', '32', '34', '36', '38', '40', '42']);
    await user.click(within(dialog).getByRole('radio', { name: /cm/i }));
    expect(waistCells()).toEqual(['28', '30', '32', '34', '36', '38', '40', '42']);
    // Real measurements on the same table do convert.
    expect(within(trouser).getAllByText('81 cm').length).toBeGreaterThan(0);
  });

  test('the close button dismisses the guide', async () => {
    const { user } = await openGuide();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
