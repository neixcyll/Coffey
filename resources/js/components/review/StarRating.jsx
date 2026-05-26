export default function StarRating({ value = 0, onChange, size = 'small' }) {
    const numeric = Number(value || 0);
    const rounded = Math.round(numeric);
    const interactive = typeof onChange === 'function';

    return (
        <span className={`stars ${size} ${interactive ? 'interactive' : ''}`} aria-label={`Rating ${numeric} dari 5`}>
            {[1, 2, 3, 4, 5].map((star) => interactive ? (
                <button
                    key={star}
                    type="button"
                    className={star <= numeric ? 'filled' : ''}
                    aria-label={`${star} bintang`}
                    onClick={() => onChange(star)}
                >
                    ★
                </button>
            ) : (
                <span key={star} className={star <= rounded ? 'filled' : ''}>★</span>
            ))}
        </span>
    );
}
