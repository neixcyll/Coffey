export default function StarRating({ value = 0, onChange, size = 'small' }) {
    const numeric = Number(value || 0);
    const rounded = Math.round(numeric);
    const interactive = typeof onChange === 'function';

    const baseClass = `stars inline-flex items-center leading-none ${
        size === 'large' ? 'gap-1 text-[1.45rem]' : 'gap-0.5 text-base'
    } ${interactive ? 'interactive' : ''}`;

    return (
        <span className={baseClass} aria-label={`Rating ${numeric} dari 5`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (interactive ? numeric : rounded);
                return interactive ? (
                    <button
                        key={star}
                        type="button"
                        className={`filled focus:outline-none p-0.5 bg-transparent border-0 min-h-0 text-inherit leading-none cursor-pointer transition-colors ${
                            isFilled ? 'text-[#b77825]' : 'text-[#c9b7a4] hover:text-[#b77825] focus:text-[#b77825]'
                        }`}
                        aria-label={`${star} bintang`}
                        onClick={() => onChange(star)}
                    >
                        ★
                    </button>
                ) : (
                    <span
                        key={star}
                        className={`filled leading-none ${
                            isFilled ? 'text-[#b77825]' : 'text-[#c9b7a4]'
                        }`}
                    >
                        ★
                    </span>
                );
            })}
        </span>
    );
}
