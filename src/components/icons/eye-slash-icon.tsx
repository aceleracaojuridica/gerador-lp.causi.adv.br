import type * as React from "react";

/**
 * Ícone: Eye Slash
 * Fonte: Font Awesome
 * Referência: https://fontawesome.com/icons
 */
const EyeSlashIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 512"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="eye-slash-title"
    >
      <title id="eye-slash-title">Ocultar senha</title>
      <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144 0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3-11.1-41.5-47.8-69.4-88.6-71.1-5.8-.2-9.2 6.1-7.4 11.7 2.1 6.4 3.3 13.2 3.3 20.3 0 .5 0 1.1 0 1.6l-91.1-71.3zM373.3 407.6C356.5 413 338.6 416 320 416c-79.5 0-144-64.5-144-144 0-6.9 .5-13.6 1.4-20.2L83.1 178.9c-24.5 30.7-42.5 62.4-52.5 86.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1C170.5 475.2 235.2 512 320 512c47.2 0 89.6-12.8 126.2-32.5l-73-57.2z" />
    </svg>
  );
};

export default EyeSlashIcon;
