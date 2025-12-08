import { MessageCircle } from 'lucide-react';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/59167522948', '_blank');
  };

  return (
    <button className="whatsapp-button" onClick={handleWhatsAppClick}>
      <MessageCircle size={28} />
    </button>
  );
};

export default WhatsAppButton;