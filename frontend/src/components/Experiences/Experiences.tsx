import "./Experiences.css";

function Experiences() {
  const experiences = [
    {
      title: "Casamentos",
      description:
        "Making of, cerimônia, festa, detalhes e filme completo.",
      image:
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
    },
    {
      title: "15 Anos",
      description:
        "Book, festa, clipe, recepção e momentos espontâneos.",
      image:
        "https://images.unsplash.com/photo-1519741497674-611481863552",
    },
    {
      title: "Pré Wedding",
      description:
        "Ensaio romântico, elegante e com direção natural.",
      image:
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
    },
    {
      title: "Família",
      description:
        "Gestante, infantil, aniversários e momentos familiares.",
      image:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74",
    },
  ];

  return (
    <section className="experiences">
      <div className="experiences-container">

        <div className="experiences-header">

          <div className="section-eyebrow">
            <span></span>
            <p>EXPERIÊNCIAS</p>
          </div>

          <div className="experiences-top">
            <div>
              <h2>Escolha o tipo de história</h2>

              <p>
                Cada experiência possui uma abordagem única para registrar
                momentos que merecem ser lembrados.
              </p>
            </div>

          
          </div>

        </div>

        <div className="experiences-grid">
          {experiences.map((item) => (
            <article
              key={item.title}
              className="experience-card"
              style={{
                backgroundImage: `url(${item.image})`,
              }}
            >
              <div className="experience-overlay"></div>

              <div className="experience-content">
                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <span>Ver trabalhos</span>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Experiences;