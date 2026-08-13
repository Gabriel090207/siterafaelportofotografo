import "./Promocoes.css";

import {
    FiTool,
} from "react-icons/fi";


function Promocoes() {

    return (

        <main className="promocoes-page">

            <div className="promocoes-page-container">


                {/* =========================
                    HEADER
                ========================= */}

                <section className="promocoes-page-header">

                    <div className="promocoes-page-eyebrow">

                        <span></span>

                        <p>
                            PROMOÇÕES
                        </p>

                    </div>


                    <h1>
                        Condições especiais Você
                       
                    </h1>


                    <p className="promocoes-page-description">

                        Estamos preparando promoções e condições
                        especiais para tornar o registro dos seus
                        momentos ainda mais especial.

                    </p>

                </section>


                {/* =========================
                    EM DESENVOLVIMENTO
                ========================= */}

                <section className="promocoes-page-development">

                    <div className="promocoes-page-development-icon">

                        <FiTool />

                    </div>


                    <span className="promocoes-page-development-label">
                        EM BREVE
                    </span>


                    <h2>
                        Novidades estão
                        sendo preparadas.
                    </h2>


                    <p>

                        Esta página está em desenvolvimento.
                        Em breve você encontrará aqui nossas
                        promoções, condições especiais e
                        oportunidades exclusivas.

                    </p>

                </section>


            </div>

        </main>

    );

}


export default Promocoes;