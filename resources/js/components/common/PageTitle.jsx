export default function PageTitle({ eyebrow, title }) {
    return (
        <div className="section-head">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
            </div>
        </div>
    );
}
