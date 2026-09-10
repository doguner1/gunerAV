"use client";

import { trackPhoneClick, trackMapClick, trackWhatsAppClick } from "@/lib/analytics";

interface Props {
  href: string;
  type: "phone" | "map" | "whatsapp";
  eventName: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export default function TrackedExternalLink({ 
  href, 
  type, 
  eventName, 
  children, 
  className,
  target,
  rel
}: Props) {
  const handleClick = () => {
    if (type === "phone") trackPhoneClick(eventName);
    else if (type === "map") trackMapClick(eventName);
    else if (type === "whatsapp") trackWhatsAppClick(eventName);
  };

  return (
    <a href={href} onClick={handleClick} className={className} target={target} rel={rel}>
      {children}
    </a>
  );
}
