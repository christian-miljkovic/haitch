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

  test('shows the ready-to-wear conversion table with HAITCH and US sizes', async () => {
    const { dialog } = await openGuide();
    expect(within(dialog).getByText(/ready to wear/i)).toBeInTheDocument();
    for (const size of ['XS', 'S', 'M', 'L', 'XL', 'XXL']) {
      expect(within(dialog).getAllByText(size).length).toBeGreaterThan(0);
    }
    expect(within(dialog).getByText(/us size/i)).toBeInTheDocument();
  });

  test('switching the conversion table changes the converted sizes', async () => {
    const { user, dialog } = await openGuide();
    expect(within(dialog).getByText(/us size/i)).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText(/conversion table/i), 'EUROPE');
    expect(within(dialog).getByText(/eu size/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/us size/i)).not.toBeInTheDocument();
  });

  test('body measurements toggle between cm and inches', async () => {
    const { user, dialog } = await openGuide();
    expect(within(dialog).getByText(/body measurement/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /cm/i })).toBeChecked();
    expect(within(dialog).getByText('100')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: /inch/i }));
    expect(within(dialog).queryByText('100')).not.toBeInTheDocument();
    expect(within(dialog).getByText('39.5')).toBeInTheDocument();
  });

  test('shows the denim waist table', async () => {
    const { dialog } = await openGuide();
    expect(within(dialog).getByRole('heading', { name: /denim/i })).toBeInTheDocument();
    for (const waist of ['28', '30', '32', '34', '36']) {
      expect(within(dialog).getAllByText(waist).length).toBeGreaterThan(0);
    }
  });

  test('the close button dismisses the guide', async () => {
    const { user } = await openGuide();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
