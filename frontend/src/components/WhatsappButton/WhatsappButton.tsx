import "./WhatsappButton.css";

import { FaWhatsapp } from "react-icons/fa";

export function WhatsappButton() {
  return (
    <a
      href="https://wa.me/5543988237222"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
      aria-label="WhatsApp"
    >
      <FaWhatsapp size={34} />
    </a>
  );
}