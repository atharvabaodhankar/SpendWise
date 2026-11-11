import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CustomSelect from '../../../src/components/CustomSelect';

describe('Tier 1: CustomSelect Dropdown Popover (CustomSelect.jsx)', () => {
  const options = [
    { value: 'all', label: 'All time' },
    { value: '2026-11', label: 'November 2026' },
    { value: '2026-10', label: 'October 2026' },
  ];

  it('renders trigger button with selected option label', () => {
    render(<CustomSelect value="all" options={options} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('All time');
  });

  it('opens custom in-DOM listbox popover on click', () => {
    render(<CustomSelect value="all" options={options} />);
    const button = screen.getByRole('combobox');

    // Initially closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Custom options rendered in DOM
    const optionElements = screen.getAllByRole('option');
    expect(optionElements.length).toBe(3);
    expect(optionElements[0]).toHaveTextContent('All time');
    expect(optionElements[1]).toHaveTextContent('November 2026');
  });

  it('triggers onChange and closes menu when an option is selected', () => {
    const handleChange = vi.fn();
    render(<CustomSelect value="all" options={options} onChange={handleChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    const optionElements = screen.getAllByRole('option');
    fireEvent.click(optionElements[1]);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: '2026-11' }),
      })
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape key press', () => {
    render(<CustomSelect value="all" options={options} />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
