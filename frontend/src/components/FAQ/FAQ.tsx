import { useState } from "react";
import "./FAQ.css";

const faqItems = [
  {
    question: "Vocês fazem foto e vídeo?",
    answer:
      "Sim. Trabalhamos com fotografia, filmagem e também pacotes completos de foto + vídeo para eventos sociais e corporativos.",
  },
  {
    question: "Atendem fora de Londrina?",
    answer:
      "Sim. Atendemos Londrina, região e outras cidades mediante consulta de disponibilidade e deslocamento.",
  },
  {
    question: "Como recebo as fotos?",
    answer:
      "As imagens são entregues em galeria online organizada, com acesso simples para visualização e download.",
  },
  {
    question: "Como solicitar orçamento?",
    answer:
      "Entre em contato pelo WhatsApp informando data, cidade e tipo de evento para receber uma proposta personalizada.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq">
      <div className="faq-container">
        <div className="section-eyebrow">
          <span />
          <p>FAQ</p>
        </div>

        <div className="faq-header">
          <h2>
            Respostas rápidas para quem está decidindo.
          </h2>
        </div>

        <div className="faq-list">
          {faqItems.map((item, index) => (
            <article
              key={index}
              className={`faq-item ${
                openIndex === index ? "active" : ""
              }`}
            >
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
              >
                <span>{item.question}</span>

                <div className="faq-icon">
                  {openIndex === index ? "−" : "+"}
                </div>
              </button>

              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;