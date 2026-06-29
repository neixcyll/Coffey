import { useState } from 'react';

const faqs = [
    ['Bagaimana cara menjadi seller?', 'Daftar akun seller, lengkapi profil toko, lalu tunggu status seller aktif.'],
    ['Apakah affiliate bisa membuat konten?', 'Bisa. Form upload ada di dashboard affiliate setelah akun customer terdaftar sebagai affiliate.'],
    ['Bagaimana pembayaran diproses?', 'Checkout memakai Midtrans Snap dan status order disinkronkan setelah pembayaran.'],
];

export default function ContactPage({ setNotice }) {
    const [form, setForm] = useState({ name: '', email: '', topic: 'Customer support', message: '' });

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function submit(event) {
        event.preventDefault();
        setNotice('Pesan contact tersimpan. Tim Coffey akan menghubungi kamu.');
        setForm({ name: '', email: '', topic: 'Customer support', message: '' });
    }

    return (
        <section className="contact-page">
            <header className="contact-hero">
                <div>
                    <p className="eyebrow">Contact</p>
                    <h1>Talk to Coffey.</h1>
                    <p>For customer support, seller onboarding, affiliate questions, and partnership requests.</p>
                </div>
                <div className="contact-info-panel">
                    <ContactInfo label="Email" value="hello@coffey.test" />
                    <ContactInfo label="WhatsApp" value="+62 812-3456-7890" />
                    <ContactInfo label="Instagram" value="@coffey.market" />
                </div>
            </header>

            <div className="contact-layout">
                <form className="contact-form-card" onSubmit={submit}>
                    <div>
                        <p className="eyebrow">Message</p>
                        <h2>Send a short note</h2>
                    </div>
                    <label>
                        <span>Name</span>
                        <input value={form.name} placeholder="Your name" required onChange={(event) => update('name', event.target.value)} />
                    </label>
                    <label>
                        <span>Email</span>
                        <input type="email" value={form.email} placeholder="name@email.com" required onChange={(event) => update('email', event.target.value)} />
                    </label>
                    <label>
                        <span>Topic</span>
                        <select value={form.topic} onChange={(event) => update('topic', event.target.value)}>
                            <option>Customer support</option>
                            <option>Seller onboarding</option>
                            <option>Affiliate support</option>
                            <option>Partnership</option>
                        </select>
                    </label>
                    <label>
                        <span>Message</span>
                        <textarea rows={5} value={form.message} placeholder="Tell us what you need" required onChange={(event) => update('message', event.target.value)} />
                    </label>
                    <button className="btn primary wide" type="submit">Send message</button>
                </form>

                <aside className="contact-side-panel">
                    <section>
                        <p className="eyebrow">Social</p>
                        <div className="contact-social-list">
                            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
                            <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
                        </div>
                    </section>
                    <section>
                        <p className="eyebrow">FAQ</p>
                        <div className="contact-faq-list">
                            {faqs.map(([question, answer]) => (
                                <article key={question}>
                                    <strong>{question}</strong>
                                    <p>{answer}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </section>
    );
}

function ContactInfo({ label, value }) {
    return (
        <article>
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}
