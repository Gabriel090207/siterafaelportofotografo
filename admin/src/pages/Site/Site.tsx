import "./Site.css";

import { Link } from "react-router-dom";

import {
    ArrowRight,
    BriefcaseBusiness,
    FolderKanban,
    MessageSquareQuote,
    CircleHelp,
    Video,
    Image,
    Workflow,
    UserRound,
    CalendarDays,
    Megaphone,
} from "lucide-react";

const sections = [
    {
        title: "Hero",
        description: "Gerencie o banner principal da página inicial.",
        icon: Image,
        path: "/admin/site/hero",
    },
    {
        title: "Experiências",
        description: "Gerencie os diferenciais exibidos na página inicial.",
        icon: BriefcaseBusiness,
        path: "/admin/site/experiencias",
    },
    {
        title: "Portfólio",
        description: "Cadastre e organize os trabalhos em destaque.",
        icon: FolderKanban,
        path: "/admin/site/portfolio",
    },
    {
        title: "Vídeos",
        description: "Gerencie os vídeos exibidos no site.",
        icon: Video,
        path: "/admin/site/videos",
    },
    {
        title: "Processo",
        description: "Edite as etapas do atendimento e do trabalho.",
        icon: Workflow,
        path: "/admin/site/processo",
    },
    {
        title: "Sobre",
        description: "Gerencie a seção institucional da página inicial.",
        icon: UserRound,
        path: "/admin/site/sobre",
    },
    {
        title: "Prova Social",
        description: "Configure depoimentos e avaliações dos clientes.",
        icon: MessageSquareQuote,
        path: "/admin/site/prova-social",
    },
    {
        title: "Agenda",
        description: "Gerencie as informações da agenda e disponibilidade.",
        icon: CalendarDays,
        path: "/admin/site/agenda",
    },
    {
        title: "FAQ",
        description: "Gerencie as perguntas frequentes.",
        icon: CircleHelp,
        path: "/admin/site/faq",
    },
    {
        title: "CTA",
        description: "Edite a chamada final para ação do site.",
        icon: Megaphone,
        path: "/admin/site/cta",
    },
];

function Site() {
    return (
        <main className="site">
            <div className="site__header">
                <div>
                    <h2>Gerenciamento do Site</h2>

                    <p>
                        Gerencie todas as seções exibidas no site institucional.
                    </p>
                </div>
            </div>

            <div className="site__grid">
                {sections.map((section) => {
                    const Icon = section.icon;

                    return (
                        <Link
                            key={section.title}
                            to={section.path}
                            className="site-card"
                        >
                            <div className="site-card__icon">
                                <Icon size={28} />
                            </div>

                            <h3>{section.title}</h3>

                            <p>{section.description}</p>

                            <div className="site-card__footer">
                                <span>Gerenciar</span>

                                <ArrowRight size={18} />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </main>
    );
}

export default Site;