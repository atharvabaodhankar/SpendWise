import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect Component
 *
 * Replaces the operating system's native <select> popup with an in-DOM Quiet Ledger dropdown.
 * - Sits on --surface with 1px --line border and --shadow-pop.
 * - Subdued hover states using --sunken (never harsh OS blue).
 * - Active option highlighted with --accent-soft and Check indicator.
 * - Keyboard navigable (Esc closes, Enter/Space toggles).
 * - Click outside detection.
 * - Embeds a hidden native <select> to maintain form compatibility and DOM test queries.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  menuClassName = '',
  id,
  name,
  'aria-label': ariaLabel,
  disabled = false,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options from options prop or JSX children (<option>)
  const normalizedOptions = useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return { value: String(opt), label: String(opt) };
        }
        return { value: String(opt.value), label: String(opt.label ?? opt.value) };
      });
    }

    if (children) {
      const parsed = [];
      const childrenArray = Array.isArray(children) ? children : [children];
      childrenArray.flat().forEach((child) => {
        if (child && child.props) {
          parsed.push({
            value: String(child.props.value ?? child.props.children),
            label: String(child.props.children ?? child.props.value),
          });
        }
      });
      return parsed;
    }

    return [];
  }, [options, children]);

  // Find currently selected option
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || value || 'Select');

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: val, name } });
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left w-full sm:w-auto">
      {/* Hidden native select for form serialization & DOM tests */}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
      >
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Trigger Button */}
      <button
        type="button"
        id={`${selectId}-button`}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`field flex items-center justify-between gap-2 px-3 text-xs bg-[var(--surface)] text-[var(--ink)] cursor-pointer select-none transition-colors ${
          isOpen ? 'border-[var(--accent)] shadow-[0_0_0_1.5px_var(--accent)]' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--sunken)]' : ''} ${className}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--ink-3)] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[var(--accent)]' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-1 min-w-full w-max max-w-[280px] max-h-60 overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-[8px] shadow-[var(--shadow-pop)] py-1 focus:outline-none ${menuClassName}`}
          style={{ right: 0 }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`px-3 py-2 text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                    : 'text-[var(--ink)] hover:bg-[var(--sunken)]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
