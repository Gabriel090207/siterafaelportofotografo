import "./Events.css";



import { Link } from "react-router-dom";



function Events() {










  return (
    <main className="events">
      <div className="events-container">

        <section className="events-hero">

          <div className="events-eyebrow">
            <span></span>
            <p>PORTFÓLIO DE EVENTOS</p>
          </div>

         <div className="events-hero-content">

  <h1>Eventos</h1>

  <p className="events-description">
    Casamentos, 15 anos, ensaios, formaturas e eventos
    corporativos registrados com emoção, estética e
    cuidado em cada detalhe.
  </p>


</div>

        </section>

        <section className="events-categories">
  <button className="event-category active">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Todos" />
  </div>
  <span>Todos</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Casamentos" />
  </div>
  <span>Casamentos</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="15 Anos" />
  </div>
  <span>15 Anos</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Pré Wedding" />
  </div>
  <span>Pré Wedding</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Book de 15 Anos" />
  </div>
  <span>Book de 15 Anos</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Infantil" />
  </div>
  <span>Infantil</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Book de Gestante" />
  </div>
  <span>Book de Gestante</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Aniversários" />
  </div>
  <span>Aniversários</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Ensaio Fotográfico" />
  </div>
  <span>Ensaio Fotográfico</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Corporativos" />
  </div>
  <span>Corporativos</span>
</button>

<button className="event-category">
  <div className="event-category-image">
    <img src="/favicon.png" alt="Formaturas" />
  </div>
  <span>Formaturas</span>
</button>
</section>


<section className="featured-event">

  <div className="featured-event-card">

    <img
      src="https://images.unsplash.com/photo-1519741497674-611481863552"
      alt="Ana e Lucas"
    />

    <div className="featured-event-overlay">

      <span className="featured-event-label">
        EVENTO EM DESTAQUE
      </span>

      <h2>
        Ana & Lucas
      </h2>

      <p>
        Um casamento marcado por emoção,
        elegância e momentos inesquecíveis.
        Entre familiares, amigos e uma
        celebração única, cada detalhe foi
        registrado para transformar memórias
        em uma história que poderá ser
        revivida para sempre.
      </p>

      <Link
  to="/evento"
  className="featured-event-button"
>
  Ver Álbum
</Link>

    </div>

  </div>

</section>

<section className="events-grid-section">

 

  <div className="events-grid">

    <article className="event-card">

      <div className="event-card-header">

        <div>
          <h3>Ana & Lucas</h3>

          <span>
            Casamento • Londrina
          </span>
        </div>

       <Link
  to="/evento"
  className="event-card-button"
>
  Ver Álbum
</Link>

      </div>

      <div className="event-card-image">

        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552"
          alt=""
        />

      </div>

      <div className="event-card-content">

        <p>
          Um casamento emocionante,
          registrado com sensibilidade
          e atenção aos detalhes.
        </p>

      </div>

    </article>

    <article className="event-card">

      <div className="event-card-header">

        <div>
          <h3>Ana & Lucas</h3>

          <span>
            Casamento • Londrina
          </span>
        </div>

        <Link
  to="/evento"
  className="event-card-button"
>
  Ver Álbum
</Link>


      </div>

      <div className="event-card-image">

        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552"
          alt=""
        />

      </div>

      <div className="event-card-content">

        <p>
          Um casamento emocionante,
          registrado com sensibilidade
          e atenção aos detalhes.
        </p>

      </div>

    </article>

    <article className="event-card">

      <div className="event-card-header">

        <div>
          <h3>Ana & Lucas</h3>

          <span>
            Casamento • Londrina
          </span>
        </div>

        <Link
  to="/evento"
  className="event-card-button"
>
  Ver Álbum
</Link>


      </div>

      <div className="event-card-image">

        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552"
          alt=""
        />

      </div>

      <div className="event-card-content">

        <p>
          Um casamento emocionante,
          registrado com sensibilidade
          e atenção aos detalhes.
        </p>

      </div>

    </article>

    <article className="event-card">

      <div className="event-card-header">

        <div>
          <h3>Ana & Lucas</h3>

          <span>
            Casamento • Londrina
          </span>
        </div>

        <Link
  to="/evento"
  className="event-card-button"
>
  Ver Álbum
</Link>


      </div>

      <div className="event-card-image">

        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552"
          alt=""
        />

      </div>

      <div className="event-card-content">

        <p>
          Um casamento emocionante,
          registrado com sensibilidade
          e atenção aos detalhes.
        </p>

      </div>

    </article>

    <article className="event-card">

      <div className="event-card-header">

        <div>
          <h3>Ana & Lucas</h3>

          <span>
            Casamento • Londrina
          </span>
        </div>

         <Link
  to="/evento"
  className="event-card-button"
>
  Ver Álbum
</Link>


      </div>

      <div className="event-card-image">

        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552"
          alt=""
        />

      </div>

      <div className="event-card-content">

        <p>
          Um casamento emocionante,
          registrado com sensibilidade
          e atenção aos detalhes.
        </p>

      </div>

    </article>

    <article className="event-card">

      <div className="event-card-header">

        <div>
          <h3>Ana & Lucas</h3>

          <span>
            Casamento • Londrina
          </span>
        </div>

        <Link
  to="/evento"
  className="event-card-button"
>
  Ver Álbum
</Link>


      </div>

      <div className="event-card-image">

        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552"
          alt=""
        />

      </div>

      <div className="event-card-content">

        <p>
          Um casamento emocionante,
          registrado com sensibilidade
          e atenção aos detalhes.
        </p>

      </div>

    </article>

  </div>

</section>

      </div>
    </main>
  );
}

export default Events;