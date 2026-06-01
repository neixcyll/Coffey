"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Coffee, Eye, EyeOff, LoaderCircle, Store, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    store_name: string;
    phone: string;
    address: string;
    description: string;
}

interface AnimatedCharactersLoginPageProps {
    form: AuthForm;
    isSeller: boolean;
    loading: boolean;
    mode: "login" | "register";
    notice?: string;
    onNavigate: (view: string) => void;
    onRememberChange: (remember: boolean) => void;
    onSelectSeller: (seller: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onUpdate: (field: keyof AuthForm, value: string) => void;
    remember: boolean;
}

interface EyeBallProps {
    blink?: boolean;
    forceX?: number;
    forceY?: number;
    size?: number;
}

interface CharacterPosition {
    faceX: number;
    faceY: number;
    bodySkew: number;
}

function useBlink() {
    const [blinking, setBlinking] = useState(false);

    useEffect(() => {
        let closeTimer: ReturnType<typeof setTimeout> | undefined;
        let nextTimer: ReturnType<typeof setTimeout> | undefined;

        const schedule = () => {
            nextTimer = setTimeout(() => {
                setBlinking(true);
                closeTimer = setTimeout(() => {
                    setBlinking(false);
                    schedule();
                }, 140);
            }, Math.random() * 3500 + 2600);
        };

        schedule();

        return () => {
            if (nextTimer) clearTimeout(nextTimer);
            if (closeTimer) clearTimeout(closeTimer);
        };
    }, []);

    return blinking;
}

function EyeBall({ blink = false, forceX, forceY, size = 18 }: EyeBallProps) {
    const pupilSize = Math.max(6, Math.round(size * 0.42));

    return (
        <span
            className="coffee-character-eye"
            style={{ height: blink ? "2px" : `${size}px`, width: `${size}px` }}
        >
            {!blink && (
                <i
                    style={{
                        height: `${pupilSize}px`,
                        transform: `translate(${forceX || 0}px, ${forceY || 0}px)`,
                        width: `${pupilSize}px`,
                    }}
                />
            )}
        </span>
    );
}

function AnimatedCoffeeCharacters({ hidePassword, showPassword }: { hidePassword: boolean; showPassword: boolean }) {
    const [pointer, setPointer] = useState({ x: 0, y: 0 });
    const tallRef = useRef<HTMLDivElement>(null);
    const darkRef = useRef<HTMLDivElement>(null);
    const cupRef = useRef<HTMLDivElement>(null);
    const beanRef = useRef<HTMLDivElement>(null);
    const tallBlink = useBlink();
    const darkBlink = useBlink();

    useEffect(() => {
        const handlePointer = (event: MouseEvent) => setPointer({ x: event.clientX, y: event.clientY });
        window.addEventListener("mousemove", handlePointer);

        return () => window.removeEventListener("mousemove", handlePointer);
    }, []);

    const tall = characterPosition(tallRef, pointer);
    const dark = characterPosition(darkRef, pointer);
    const cup = characterPosition(cupRef, pointer);
    const bean = characterPosition(beanRef, pointer);
    const lookAway = hidePassword && !showPassword;
    const peek = hidePassword && showPassword;

    return (
        <div className="coffee-character-stage" aria-hidden="true">
            <div
                ref={tallRef}
                className="coffee-character coffee-character-tall"
                style={{
                    height: lookAway ? "390px" : "360px",
                    transform: lookAway
                        ? `skewX(${tall.bodySkew - 9}deg) translateX(26px)`
                        : `skewX(${tall.bodySkew}deg)`,
                }}
            >
                <div
                    className="coffee-character-face"
                    style={{
                        left: `${peek ? 25 : lookAway ? 60 : 46 + tall.faceX}px`,
                        top: `${peek ? 32 : lookAway ? 58 : 42 + tall.faceY}px`,
                    }}
                >
                    <EyeBall blink={tallBlink} forceX={peek ? 4 : lookAway ? 3 : tall.faceX / 3} forceY={peek ? 4 : lookAway ? 3 : tall.faceY / 3} />
                    <EyeBall blink={tallBlink} forceX={peek ? 4 : lookAway ? 3 : tall.faceX / 3} forceY={peek ? 4 : lookAway ? 3 : tall.faceY / 3} />
                </div>
            </div>

            <div
                ref={darkRef}
                className="coffee-character coffee-character-dark"
                style={{
                    transform: lookAway
                        ? `skewX(${dark.bodySkew + 8}deg) translateX(14px)`
                        : `skewX(${dark.bodySkew}deg)`,
                }}
            >
                <div
                    className="coffee-character-face"
                    style={{
                        left: `${peek ? 12 : lookAway ? 34 : 28 + dark.faceX}px`,
                        top: `${peek ? 26 : lookAway ? 16 : 34 + dark.faceY}px`,
                    }}
                >
                    <EyeBall blink={darkBlink} forceX={peek ? -4 : lookAway ? -2 : dark.faceX / 3} forceY={peek ? -3 : lookAway ? -3 : dark.faceY / 3} size={16} />
                    <EyeBall blink={darkBlink} forceX={peek ? -4 : lookAway ? -2 : dark.faceX / 3} forceY={peek ? -3 : lookAway ? -3 : dark.faceY / 3} size={16} />
                </div>
            </div>

            <div
                ref={cupRef}
                className="coffee-character coffee-character-cup"
                style={{ transform: `skewX(${peek ? 0 : cup.bodySkew}deg)` }}
            >
                <div className="coffee-character-dot-face" style={{ left: `${peek ? 54 : 76 + cup.faceX}px`, top: `${peek ? 82 : 86 + cup.faceY}px` }}>
                    <i style={{ transform: `translate(${peek ? -4 : cup.faceX / 3}px, ${peek ? -3 : cup.faceY / 3}px)` }} />
                    <i style={{ transform: `translate(${peek ? -4 : cup.faceX / 3}px, ${peek ? -3 : cup.faceY / 3}px)` }} />
                </div>
            </div>

            <div
                ref={beanRef}
                className="coffee-character coffee-character-bean"
                style={{ transform: `skewX(${peek ? 0 : bean.bodySkew}deg)` }}
            >
                <div className="coffee-character-dot-face" style={{ left: `${peek ? 30 : 42 + bean.faceX}px`, top: `${peek ? 44 : 50 + bean.faceY}px` }}>
                    <i style={{ transform: `translate(${peek ? -4 : bean.faceX / 3}px, ${peek ? -3 : bean.faceY / 3}px)` }} />
                    <i style={{ transform: `translate(${peek ? -4 : bean.faceX / 3}px, ${peek ? -3 : bean.faceY / 3}px)` }} />
                </div>
                <span />
            </div>
        </div>
    );
}

function characterPosition(ref: RefObject<HTMLDivElement | null>, pointer: { x: number; y: number }): CharacterPosition {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const deltaX = pointer.x - (rect.left + rect.width / 2);
    const deltaY = pointer.y - (rect.top + rect.height / 3);

    return {
        faceX: clamp(deltaX / 24, -13, 13),
        faceY: clamp(deltaY / 32, -9, 9),
        bodySkew: clamp(-deltaX / 150, -5, 5),
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function Field({
    autoComplete,
    dataSellerAccountField,
    id,
    label,
    onChange,
    onFocus,
    placeholder,
    required = true,
    type = "text",
    value,
}: {
    autoComplete?: string;
    dataSellerAccountField?: boolean;
    id: string;
    label: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    value: string;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                autoComplete={autoComplete}
                data-seller-account-field={dataSellerAccountField || undefined}
                id={id}
                onChange={(event) => onChange(event.target.value)}
                onFocus={onFocus}
                placeholder={placeholder}
                required={required}
                type={type}
                value={value}
            />
        </div>
    );
}

function LoginPage({
    form,
    isSeller,
    loading,
    mode,
    notice,
    onNavigate,
    onRememberChange,
    onSelectSeller,
    onSubmit,
    onUpdate,
    remember,
}: AnimatedCharactersLoginPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [sellerStep, setSellerStep] = useState(1);
    const formRef = useRef<HTMLFormElement>(null);
    const isLogin = mode === "login";
    const isSellerAccountStep = !isLogin && isSeller && sellerStep === 1;
    const isSellerStoreStep = !isLogin && isSeller && sellerStep === 2;

    useEffect(() => {
        if (isLogin || !isSeller) setSellerStep(1);
    }, [isLogin, isSeller]);

    function selectAccountType(seller: boolean) {
        setSellerStep(1);
        onSelectSeller(seller);
    }

    function continueSellerRegistration() {
        const fields = formRef.current?.querySelectorAll<HTMLInputElement>("[data-seller-account-field]");
        const invalidField = fields && [...fields].find((field) => !field.checkValidity());

        if (invalidField) {
            invalidField.reportValidity();
            return;
        }

        const confirmation = formRef.current?.querySelector<HTMLInputElement>("#password_confirmation");

        if (confirmation && form.password !== form.password_confirmation) {
            confirmation.setCustomValidity("Konfirmasi password tidak sama.");
            confirmation.reportValidity();
            confirmation.setCustomValidity("");
            return;
        }

        setSellerStep(2);
    }

    return (
        <section className={cn("coffee-auth-page", isLogin ? "login" : isSeller ? "seller-register" : "customer-register")}>
            <aside className={cn("coffee-auth-visual", !isLogin && isSeller && "seller-register")}>
                <div className="coffee-auth-overlay" />
                <div className="coffee-auth-brand">
                    <span><Coffee size={18} /></span>
                    <div>
                        <strong>Marketplace Kopi</strong>
                    </div>
                </div>

                <div className="coffee-auth-story">
                    <p className="eyebrow">Marketplace Kopi</p>
                    <h1>Kopi pilihan, satu tempat.</h1>
                </div>

                <AnimatedCoffeeCharacters hidePassword={passwordFocused && form.password.length > 0} showPassword={showPassword} />
            </aside>

            <div className="coffee-auth-form-side">
                <div className="coffee-auth-mobile-brand">
                    <Coffee size={18} />
                    <span>Marketplace Kopi</span>
                </div>

                <div className="coffee-auth-form-shell">
                    <div className="coffee-auth-heading">
                        <p className="eyebrow">
                            {isLogin ? "Selamat datang" : isSeller ? `Daftar seller · ${sellerStep}/2` : "Daftar akun"}
                        </p>
                        <h2>{isLogin ? "Masuk ke akun" : isSellerStoreStep ? "Lengkapi toko" : "Buat akun kopi"}</h2>
                    </div>

                    <form className="coffee-auth-form" onSubmit={onSubmit} ref={formRef}>
                        {!isLogin && !isSellerStoreStep && (
                            <div className="coffee-auth-role-switch" aria-label="Tipe akun">
                                <button className={cn(!isSeller && "active")} type="button" onClick={() => selectAccountType(false)}>
                                    <UserRound size={17} />
                                    Customer
                                </button>
                                <button className={cn(isSeller && "active")} type="button" onClick={() => selectAccountType(true)}>
                                    <Store size={17} />
                                    Seller
                                </button>
                            </div>
                        )}

                        {!isLogin && !isSellerStoreStep && <Field dataSellerAccountField={isSellerAccountStep} id="name" label="Nama" onChange={(value) => onUpdate("name", value)} placeholder="Nama lengkap" value={form.name} />}
                        {!isSellerStoreStep && <Field autoComplete="email" dataSellerAccountField={isSellerAccountStep} id="email" label="Email" onChange={(value) => onUpdate("email", value)} placeholder="nama@email.com" type="email" value={form.email} />}

                        {!isSellerStoreStep && <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    data-seller-account-field={isSellerAccountStep || undefined}
                                    id="password"
                                    onBlur={() => setPasswordFocused(false)}
                                    onChange={(event) => onUpdate("password", event.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    placeholder="Minimal 8 karakter"
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                />
                                <button
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                    className="coffee-auth-password-toggle"
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>}

                        {!isLogin && !isSellerStoreStep && (
                            <Field
                                autoComplete="new-password"
                                dataSellerAccountField={isSellerAccountStep}
                                id="password_confirmation"
                                label="Konfirmasi password"
                                onChange={(value) => onUpdate("password_confirmation", value)}
                                placeholder="Ulangi password"
                                type="password"
                                value={form.password_confirmation}
                            />
                        )}

                        {isSellerStoreStep && (
                            <div className="coffee-auth-seller-fields">
                                <Field id="store_name" label="Nama toko" onChange={(value) => onUpdate("store_name", value)} placeholder="Nama toko" value={form.store_name} />
                                <Field id="phone" label="Telepon" onChange={(value) => onUpdate("phone", value)} placeholder="Nomor telepon" required={false} value={form.phone} />
                                <label className="space-y-2">
                                    <span>Alamat toko</span>
                                    <textarea onChange={(event) => onUpdate("address", event.target.value)} placeholder="Alamat toko" rows={3} value={form.address} />
                                </label>
                                <label className="space-y-2">
                                    <span>Deskripsi toko</span>
                                    <textarea onChange={(event) => onUpdate("description", event.target.value)} placeholder="Deskripsi singkat" rows={3} value={form.description} />
                                </label>
                            </div>
                        )}

                        {isLogin && (
                            <label className="coffee-auth-remember">
                                <Checkbox checked={remember} onCheckedChange={(checked) => onRememberChange(checked === true)} />
                                <span>Ingat saya</span>
                            </label>
                        )}

                        {notice && <div className="coffee-auth-alert">{notice}</div>}

                        {isSellerAccountStep ? (
                            <Button className="h-12 w-full text-base" size="lg" type="button" onClick={continueSellerRegistration}>
                                Lanjut
                            </Button>
                        ) : isSellerStoreStep ? (
                            <div className="coffee-auth-actions">
                                <Button className="h-12 text-base" disabled={loading} size="lg" type="button" variant="outline" onClick={() => setSellerStep(1)}>
                                    Kembali
                                </Button>
                                <Button className="h-12 text-base" disabled={loading} size="lg" type="submit">
                                    {loading && <LoaderCircle className="mr-2 animate-spin" size={18} />}
                                    {loading ? "Memproses..." : "Daftar seller"}
                                </Button>
                            </div>
                        ) : (
                            <Button className="h-12 w-full text-base" disabled={loading} size="lg" type="submit">
                                {loading && <LoaderCircle className="mr-2 animate-spin" size={18} />}
                                {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar akun"}
                            </Button>
                        )}
                    </form>

                    <p className="coffee-auth-alt">
                        {isLogin ? "Belum memiliki akun?" : "Sudah memiliki akun?"}
                        <button type="button" onClick={() => onNavigate(isLogin ? "register" : "login")}>
                            {isLogin ? "Daftar sekarang" : "Masuk di sini"}
                        </button>
                    </p>
                </div>
            </div>
        </section>
    );
}

export const Component = LoginPage;
