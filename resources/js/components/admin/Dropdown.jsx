import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export default function Dropdown({
    value,
    onChange,
    options = [],
    placeholder = 'Pilih...',
    compact = false,
    fullWidth = false,
    align = 'left',
    variant = 'brown',
    triggerTextClassName = '',
    className = '',
    ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: null, right: null });
    const triggerRef = useRef(null);

    const selected = options.find((option) => String(option.value) === String(value));
    const labelColor = triggerTextClassName
        ? ''
        : selected
          ? variant === 'light'
              ? 'text-gray-700'
              : 'text-[#7a5334]'
          : variant === 'light'
            ? 'text-gray-400'
            : 'text-[#b48f6b]';

    const triggerVariant =
        variant === 'light'
            ? {
                  base: 'bg-white/80 border border-gray-200 focus:border-gray-400',
                  open: 'border-gray-300',
                  hover: 'hover:border-gray-300',
              }
            : {
                  base: 'bg-[#f6e9dc] border border-[#ecd8c4] focus:border-[#7a5334]',
                  open: 'border-[#e0c4a8]',
                  hover: 'hover:border-[#e0c4a8]',
              };

    function getMenuWidth() {
        const triggerWidth = triggerRef.current ? triggerRef.current.getBoundingClientRect().width : 0;
        const longestLabel = options.reduce((max, option) => Math.max(max, String(option.label).length), 0);
        return Math.min(Math.max(triggerWidth, longestLabel * (compact ? 8 : 9) + 72, compact ? 11 : 13), 22 * 16);
    }

    function positionMenu() {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const menuWidth = getMenuWidth();
        const estimatedHeight = Math.min(options.length, 8) * (compact ? 38 : 44) + 16;
        const openUp = rect.bottom + estimatedHeight + 12 > window.innerHeight;
        const top = openUp ? Math.max(8, rect.top - estimatedHeight) : rect.bottom + 6;
        const left =
            align === 'left'
                ? Math.min(rect.left, window.innerWidth - menuWidth - 12)
                : null;
        const right =
            align === 'right'
                ? Math.min(window.innerWidth - rect.right, window.innerWidth - menuWidth - 12)
                : null;
        setPos({ top, left, right });
    }

    useEffect(() => {
        if (!open) return;
        function handlePointerDown(event) {
            if (triggerRef.current && !triggerRef.current.contains(event.target)) setOpen(false);
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') setOpen(false);
        }
        function handleReposition() {
            positionMenu();
        }
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [open, options.length, compact, align]);

    function toggle() {
        if (open) {
            setOpen(false);
        } else {
            positionMenu();
            setOpen(true);
        }
    }

    return (
        <div className={clsx('relative', fullWidth ? 'w-full' : 'inline-block', className)}>
            <button
                ref={triggerRef}
                type="button"
                onClick={toggle}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                className={clsx(
                    'w-full inline-flex items-center justify-between gap-2 focus:outline-none transition-colors duration-150 cursor-pointer',
                    triggerVariant.base,
                    compact ? 'rounded-md py-1.5 px-3 text-xs' : 'rounded-lg px-4 py-2.5 text-sm',
                    open ? triggerVariant.open : triggerVariant.hover,
                )}
            >
                <span className={clsx('truncate', labelColor, triggerTextClassName)}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    className={clsx('w-4 h-4 shrink-0 text-[#a5805f] transition-transform duration-200', open && 'rotate-180')}
                    aria-hidden="true"
                />
            </button>

            {open &&
                createPortal(
                    <ul
                        role="listbox"
                        style={{
                            position: 'fixed',
                            top: pos.top,
                            ...(pos.left != null ? { left: pos.left } : {}),
                            ...(pos.right != null ? { right: pos.right } : {}),
                            minWidth: getMenuWidth(),
                            maxWidth: 'min(22rem, calc(100vw - 24px))',
                            maxHeight: '16rem',
                            overflow: 'auto',
                        }}
                        className="dropdown-menu z-50 m-0 list-none p-2 bg-[#f6e9dc] border border-[#ecd8c4] rounded-xl shadow-[0_16px_40px_rgba(124,73,40,0.16)]"
                    >
                        {options.map((option) => {
                            const active = String(option.value) === String(value);
                            return (
                                <li key={String(option.value)} className="m-0 list-none">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={clsx(
                                            'w-full flex items-center justify-between gap-3 text-left transition-colors duration-100 rounded-md',
                                            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm',
                                            active
                                                ? 'bg-[#eddbc8] text-[#5f3d24] font-semibold'
                                                : 'text-[#8a6a4c] hover:bg-[#eddbc8] hover:text-[#5f3d24]',
                                        )}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {active && <Check className="w-4 h-4 shrink-0 text-[#7a5334]" aria-hidden="true" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>,
                    document.body,
                )}
        </div>
    );
}
