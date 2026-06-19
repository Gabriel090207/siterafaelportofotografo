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

  <h1>Casamentos</h1>

  <p className="events-description">
    Casamentos, 15 anos, ensaios, formaturas e eventos
    corporativos registrados com emoção, estética e
    cuidado em cada detalhe.
  </p>


</div>

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