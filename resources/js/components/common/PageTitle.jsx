export default function PageTitle({ eyebrow, title }) {
    return (
        <div className="section-head flex justify-between gap-4 items-end border-b border-gray-200 pb-4">
            <div>
                <p className="eyebrow text-xs font-black uppercase text-gray-500 tracking-wider mb-2">{eyebrow}</p>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-none">{title}</h1>
            </div>
        </div>
    );
}
