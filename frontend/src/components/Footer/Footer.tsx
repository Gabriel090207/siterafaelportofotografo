import "./Footer.css";
import logo from "../../assets/logo/logoabout.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <img src={logo} alt="Rafael Porto" />

          <p>
            Fotografia e filme para casamentos,
            15 anos, ensaios, formaturas e
            eventos corporativos.
          </p>
        </div>

        <div className="footer-links">

          <div className="footer-column">
            <h4>Fotos</h4>

            <a href="#">Casamentos</a>
            <a href="#">15 anos</a>
            <a href="#">Gestante</a>
            <a href="#">Corporativo</a>
          </div>

          <div className="footer-column">
            <h4>Atendimento</h4>

            <a href="#">Contato</a>
            <a href="#">Promoções</a>
            <a href="#">Depoimentos</a>
            <a href="#">Área do Cliente</a>
          </div>

          <div className="footer-column">
            <h4>Fale conosco</h4>

            <a href="#">WhatsApp</a>
            <a href="#">Instagram</a>
            <a href="#">E-mail</a>
            <a href="#">Voltar ao topo</a>
          </div>

        </div>

      </div>

      <div className="footer-bottom">
        <p>
          © 2026 Rafael Porto Fotografia. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;