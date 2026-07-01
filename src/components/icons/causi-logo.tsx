import type * as React from "react";

const CausiLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    id="b"
    viewBox="0 0 280 280"
  >
    <title>Logo Causi</title>
    <defs>
      <linearGradient
        id="d"
        x1="-33.39"
        x2="307.38"
        y1="226.26"
        y2="56.74"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#7622e1"></stop>
        <stop offset="1" stopColor="#6266f9"></stop>
      </linearGradient>
    </defs>
    <path
      id="c"
      fill="url(#d)"
      d="M186.89 93.11V140c0 25.9-20.99 46.89-46.89 46.89S93.11 165.9 93.11 140 114.1 93.11 140 93.11zV0H140C62.68 0 0 62.68 0 140s62.68 140 140 140 140-62.68 140-140V93.11z"
    ></path>
  </svg>
);

export default CausiLogo;
