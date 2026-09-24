import "./ClientForm.css";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { provisionClient, type ProvisionClientRequest } from "../../services/api/clients";
import ConfirmClientModal from "../../components/ConfirmClientModal/ConfirmClientModal";
import LoadingModal from "../../components/LoadingModal/LoadingModal";
import { clientCreationErrorMessage, MAX_CLIENT_EMAILS, prepareClientRequest } from "./clientFormData";

const ClientForm = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [name, setName] = useState("");
    const [emails, setEmails] = useState<{ id: number; value: string }[]>([]);
    const nextEmailId = useRef(0);
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [active, setActive] = useState(true);
    const [pending, setPending] = useState<ProvisionClientRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingModal, setLoadingModal] = useState({ open: false, progress: 0, success: false,
        title: "Criando cliente", message: "Criando cliente..." });
    const submitting = useRef(false);

    const handlePhoneChange = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        let formatted = numbers;
        if (numbers.length > 2) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (numbers.length > 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        setPhone(formatted);
    };

    const review = () => {
        if (submitting.current || pending) return;
        try {
            const data = prepareClientRequest({ name, phone, emails: emails.map((row) => row.value),
                password, confirmPassword, active });
            setPending(data);
        } catch (validationError) {
            showToast(validationError instanceof Error ? validationError.message : "Revise os dados.", "error");
        }
    };

    const confirm = async () => {
        if (!pending || submitting.current) return;
        submitting.current = true;
        setLoading(true);
        setLoadingModal({ open: true, progress: 5, success: false,
            title: "Criando cliente", message: "Criando cliente..." });
        try {
            await provisionClient(pending);
        } catch (requestError) {
            const message = clientCreationErrorMessage(requestError);
            showToast(message, "error");
            setLoadingModal((current) => ({ ...current, open: false, progress: 0, success: false }));
            setPending(null);
            setLoading(false);
            submitting.current = false;
            return;
        }
        // Keep the guard closed after success until navigation unmounts the form.
        setPending(null);
        setPassword("");
        setConfirmPassword("");
        setLoadingModal((current) => ({ ...current, success: true, progress: 100,
            message: "Cliente criado com sucesso!" }));
        await new Promise((resolve) => setTimeout(resolve, 900));
        setLoadingModal((current) => ({ ...current, open: false }));
        await new Promise((resolve) => setTimeout(resolve, 350));
        showToast("Cliente criado com sucesso!", "success");
        navigate("/clients");
    };

    return (
        <section className="client-form">
            <div className="client-form__top">
                <button type="button" className="client-form__back" disabled={loading}
                    onClick={() => navigate("/clients")}><ArrowLeft size={18} /><span>Voltar</span></button>
                <div className="client-form__title"><h2>Novo Cliente</h2>
                    <p>Cadastre um novo cliente para compartilhar seus álbuns.</p></div>
            </div>
            <form className="client-form" noValidate onSubmit={(event) => { event.preventDefault(); review(); }}>
                <fieldset className="client-form__fields" disabled={loading || pending !== null}>
                    <div className="client-form__card">
                        <h3>Informações</h3>
                        <div className="client-form__grid">
                            <div className="client-form__field"><label htmlFor="client-name">Nome</label>
                                <input id="client-name" type="text" placeholder="Nome completo" value={name}
                                    maxLength={200} onChange={(event) => setName(event.target.value)} /></div>
                            <div className="client-form__field"><label htmlFor="client-phone">WhatsApp</label>
                                <input id="client-phone" type="tel" placeholder="(00) 00000-0000" value={phone}
                                    maxLength={15} onChange={(event) => handlePhoneChange(event.target.value)} /></div>
                            <div className="client-form__field"><label htmlFor="client-active">Status</label>
                                <select id="client-active" value={active ? "active" : "inactive"}
                                    onChange={(event) => setActive(event.target.value === "active")}>
                                    <option value="active">Ativo</option><option value="inactive">Inativo</option>
                                </select></div>
                        </div>
                    </div>
                    <div className="client-form__card">
                        <h3>E-mails</h3>
                        <div className="client-form__emails">
                            {emails.map((row, index) => (
                                <div className="client-form__field" key={row.id}>
                                    <label htmlFor={`client-email-${row.id}`}>E-mail {index + 1}</label>
                                    <div className="client-form__email-row">
                                        <input id={`client-email-${row.id}`} type="email" placeholder="cliente@email.com"
                                            value={row.value} onChange={(event) => setEmails((current) => current.map((item) =>
                                                item.id === row.id ? { ...item, value: event.target.value } : item))} />
                                        <button type="button" className="client-form__remove-email"
                                            aria-label={`Remover e-mail ${index + 1}`} onClick={() => setEmails((current) =>
                                                current.filter((item) => item.id !== row.id))}><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="client-form__add-email" disabled={emails.length >= MAX_CLIENT_EMAILS}
                                onClick={() => {
                                    const id = nextEmailId.current++;
                                    setEmails((current) => current.length < MAX_CLIENT_EMAILS ? [...current, { id, value: "" }] : current);
                                }}><Plus size={18} />Adicionar e-mail</button>
                            <p className="client-form__hint">{emails.length} de {MAX_CLIENT_EMAILS} campos. E-mails sem senha serão somente contatos.</p>
                        </div>
                    </div>
                    <div className="client-form__card">
                        <h3>Acesso</h3>
                        <div className="client-form__grid">
                            <div className="client-form__field"><label htmlFor="client-password">Senha</label>
                                <input id="client-password" type="password" autoComplete="new-password" value={password}
                                    onChange={(event) => setPassword(event.target.value)} /></div>
                            <div className="client-form__field"><label htmlFor="client-confirm-password">Confirmar senha</label>
                                <input id="client-confirm-password" type="password" autoComplete="new-password" value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)} /></div>
                        </div>
                        <p className="client-form__hint">Uma única senha para todos os e-mails. O link de acesso poderá ser copiado na listagem de clientes.</p>
                    </div>
                    <div className="client-form__actions">
                        <button type="button" className="client-form__cancel" onClick={() => navigate("/clients")}>Cancelar</button>
                        <button type="submit" className="client-form__save"><Save size={18} /><span>Criar Cliente</span></button>
                    </div>
                </fieldset>
            </form>
            {pending && !loading && <ConfirmClientModal summary={{ name: pending.name, phone: pending.phone, emails: pending.emails,
                hasPassword: pending.password !== undefined, active: pending.active }} loading={loading}
                onCancel={() => { if (!submitting.current) { setPending(null); } }} onConfirm={confirm} />}
            <LoadingModal {...loadingModal} successHint="Redirecionando para os clientes..." />
        </section>
    );
};

export default ClientForm;
