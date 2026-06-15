import "./Testimonials.css";

const testimonials = [
  {
    text: "As fotos ficaram incríveis. A equipe foi leve, profissional e registrou cada detalhe com muito cuidado.",
    name: "Ana & Lucas",
    category: "Casamento",
  },
  {
    text: "O ensaio e a festa ficaram perfeitos. Amamos a direção e a atenção aos detalhes.",
    name: "Maria Eduarda",
    category: "15 Anos",
  },
  {
    text: "Atendimento excelente, entrega organizada e resultado acima das expectativas.",
    name: "Empresa Cliente",
    category: "Corporativo",
  },
];

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <div className="section-eyebrow">
          <span />
          <p>PROVA SOCIAL</p>
        </div>

        <div className="testimonials-header">
          <h2>
            Depoimentos em destaque para gerar confiança.
          </h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <article key={index} className="testimonial-card">
              <p className="testimonial-text">
                “{item.text}”
              </p>

              <div className="testimonial-author">
                <h4>{item.name}</h4>
                <span>{item.category}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="testimonials-footer">
          <button className="testimonials-btn">
            Ver mais depoimentos
          </button>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;