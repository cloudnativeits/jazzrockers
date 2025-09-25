import { FaWhatsapp, FaGlobe } from 'react-icons/fa';
import { Globe} from 'lucide-react';

export function FixedFooter({ user }: { user: any }) {
    if (user?.role !== 'parent') return null;

    return (
      <div className="fixed bottom-12 right-8 z-50 flex flex-col space-y-4">
        <a
          href="https://wa.link/d94ig5"
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp us"
          className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <FaWhatsapp className="h-6 w-6" />
        </a>
        <a
          href="https://jazzrockers.com/" 
          target="_blank"
          rel="noopener noreferrer"
          title="Visit us on website"
          className="bg-primary text-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <FaGlobe className="h-6 w-6" />
        </a>
      </div>
    );
  }