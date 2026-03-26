export function InstagramLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig1" cx="17%" cy="106%" r="150%" fx="17%" fy="106%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="10%" stopColor="#FFDD55" />
          <stop offset="50%" stopColor="#FF543E" />
          <stop offset="100%" stopColor="#C837AB" />
        </radialGradient>
        <radialGradient id="ig2" cx="110%" cy="-10%" r="150%">
          <stop offset="0%" stopColor="#3771C8" />
          <stop offset="13%" stopColor="#3771C8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6600FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig1)" />
      <rect width="48" height="48" rx="12" fill="url(#ig2)" />
      <path d="M24 14.4c-3.1 0-3.5 0-4.7.1-1.2.1-2 .2-2.7.5-.7.3-1.3.7-1.9 1.3-.6.6-1 1.2-1.3 1.9-.3.7-.4 1.5-.5 2.7-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.2.2 2 .5 2.7.3.7.7 1.3 1.3 1.9.6.6 1.2 1 1.9 1.3.7.3 1.5.4 2.7.5 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.2-.1 2-.2 2.7-.5.7-.3 1.3-.7 1.9-1.3.6-.6 1-1.2 1.3-1.9.3-.7.4-1.5.5-2.7.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.2-.2-2-.5-2.7-.3-.7-.7-1.3-1.3-1.9-.6-.6-1.2-1-1.9-1.3-.7-.3-1.5-.4-2.7-.5-1.2-.1-1.6-.1-4.7-.1zm0 1.7c3.1 0 3.4 0 4.6.1 1.1.1 1.7.2 2.1.4.5.2.9.4 1.3.8.4.4.6.8.8 1.3.2.4.3 1 .4 2.1.1 1.2.1 1.5.1 4.6s0 3.4-.1 4.6c-.1 1.1-.2 1.7-.4 2.1-.2.5-.4.9-.8 1.3-.4.4-.8.6-1.3.8-.4.2-1 .3-2.1.4-1.2.1-1.5.1-4.6.1s-3.4 0-4.6-.1c-1.1-.1-1.7-.2-2.1-.4-.5-.2-.9-.4-1.3-.8-.4-.4-.6-.8-.8-1.3-.2-.4-.3-1-.4-2.1-.1-1.2-.1-1.5-.1-4.6s0-3.4.1-4.6c.1-1.1.2-1.7.4-2.1.2-.5.4-.9.8-1.3.4-.4.8-.6 1.3-.8.4-.2 1-.3 2.1-.4 1.2-.1 1.5-.1 4.6-.1z" fill="white" />
      <circle cx="24" cy="24.6" r="4.9" stroke="white" strokeWidth="1.7" fill="none" />
      <circle cx="30" cy="18.4" r="1.2" fill="white" />
    </svg>
  );
}

export function TwitterLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#000000" />
      <path d="M27.3 22.1L34.7 13h-1.75l-6.4 7.9L21 13h-7l7.7 11.8L14 34h1.75l6.7-8.3L28.5 34H35l-7.7-11.9zm-2.4 2.9l-.8-1.1-6.1-9.2h2.6l5 7.5.8 1.1 6.4 9.6h-2.6l-5.3-7.9z" fill="white" />
    </svg>
  );
}

export function YouTubeLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#FF0000" />
      <path d="M37.1 17.5c-.3-1.2-1.2-2.1-2.4-2.4C32.6 14.5 24 14.5 24 14.5s-8.6 0-10.7.6c-1.2.3-2.1 1.2-2.4 2.4-.6 2.1-.6 6.5-.6 6.5s0 4.4.6 6.5c.3 1.2 1.2 2.1 2.4 2.4 2.1.6 10.7.6 10.7.6s8.6 0 10.7-.6c1.2-.3 2.1-1.2 2.4-2.4.6-2.1.6-6.5.6-6.5s0-4.4-.6-6.5z" fill="white" />
      <path d="M21.5 28.5l7-4.5-7-4.5v9z" fill="#FF0000" />
    </svg>
  );
}

export function FacebookLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#1877F2" />
      <path d="M33 24c0-5-4-9-9-9s-9 4-9 9c0 4.5 3.3 8.2 7.6 8.9v-6.3h-2.3V24h2.3v-2c0-2.3 1.4-3.5 3.4-3.5 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V24h2.5l-.4 2.6h-2.1v6.3c4.3-.7 7.6-4.4 7.6-8.9z" fill="white" />
    </svg>
  );
}

export function LinkedInLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#0A66C2" />
      {/* "i" with round dot */}
      <circle cx="16.5" cy="16" r="2" fill="white" />
      <rect x="14.5" y="20" width="4" height="14" rx="0.5" fill="white" />
      {/* "n" */}
      <path d="M22 20h3.8v1.9h.05c.53-1 1.82-2.1 3.75-2.1 4.01 0 4.75 2.64 4.75 6.07V34h-4v-7.2c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.76 1.87-2.76 3.8V34H22V20z" fill="white" />
    </svg>
  );
}

export function GoogleMapsLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="/google-maps-icon.png"
      alt="Google Maps"
      className={`${className} rounded-xl object-cover`}
    />
  );
}

export function B2BContactsLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#4F46E5" />
      {/* Briefcase */}
      <rect x="12" y="20" width="24" height="16" rx="2.5" stroke="white" strokeWidth="2" fill="none" />
      <path d="M19 20v-3a2 2 0 012-2h6a2 2 0 012 2v3" stroke="white" strokeWidth="2" fill="none" />
      <path d="M12 26h24" stroke="white" strokeWidth="2" />
      <rect x="21" y="24" width="6" height="4" rx="1" fill="white" />
    </svg>
  );
}

export function TikTokLogo({ className = "w-10 h-10" }: { className?: string }) {
  // Classic TikTok "d"-shaped music note with cyan + pink shadow offsets
  const notePath = "M25.5 11h3.6c.3 1.6 1.1 3 2.3 3.9 1 .8 2.3 1.2 3.6 1.3v3.6c-1.8-.1-3.5-.7-4.9-1.7v7.8c0 5.2-4.2 7.6-7.4 7.6-4.3 0-7.7-3.2-7.7-7.2 0-4.3 3.8-7.5 7.7-7.1v3.7c-.4-.1-.8-.2-1.2-.2-2.1 0-3.5 1.5-3.5 3.4 0 2 1.6 3.5 3.6 3.5 2.1 0 3.5-1.4 3.5-3.5V11z";
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#010101" />
      {/* Cyan shadow - offset left & up */}
      <path d={notePath} fill="#25F4EE" transform="translate(-1.2, -0.8)" />
      {/* Pink shadow - offset right & down */}
      <path d={notePath} fill="#FE2C55" transform="translate(1.2, 0.8)" />
      {/* White main note on top */}
      <path d={notePath} fill="white" />
    </svg>
  );
}
