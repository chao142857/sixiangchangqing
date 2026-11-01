import { useId } from 'react';

export function VillageArt({ hero = false }: { hero?: boolean }) {
  const id = useId().replaceAll(':', '');
  return <svg viewBox="0 0 600 500" fill="none" aria-hidden="true" className={hero ? 'hero-landscape' : ''}>
    <defs>
      <pattern id={`${id}-lines`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-27)"><path d="M0 0V8" stroke="currentColor" strokeOpacity=".2" /></pattern>
      <clipPath id={`${id}-clip`}><path d="M70 500V225a230 230 0 0 1 460 0v275Z" /></clipPath>
    </defs>
    <g clipPath={`url(#${id}-clip)`}>
      <path fill="currentColor" d="M70 0h460v500H70z" />
      <circle cx="390" cy="142" r="54" fill="#cfad70" />
      <path d="m35 317 130-157 97 104 68-75 199 159 69 153H35Z" fill="#eadfc9" />
      <path d="m35 317 130-157 97 104 68-75 199 159 69 153H35Z" fill={`url(#${id}-lines)`} />
      <path d="m83 313 82-99 93 106 73-81 198 153" stroke="#842d2a" strokeOpacity=".25" />
      <path d="M42 396c120-97 203-23 265-53 102-49 151-34 281 14v150H42Z" fill="#b3795e" />
      <path d="M51 430c142-76 240-14 312-52s146-13 222 14M45 449c154-76 240-7 324-48s151-11 223 16M50 474c162-80 243-9 334-49s132-2 205 15" stroke="#f6f0e5" strokeWidth="1.4" opacity=".6" />
      <path d="M301 348c-76 36 37 51-2 84-24 20-86 25-87 70h78c-15-33 39-43 49-61 25-42-95-53-22-89" fill="#f6f0e5" />
      <g fill="#f6f0e5" stroke="#842d2a" strokeWidth="1.5">
        <path d="M128 334v-34h47v34Z" /><path d="m117 301 33-25 36 25Z" fill="#842d2a" />
        <path d="M183 341v-32h42v32Z" /><path d="m175 309 28-22 32 22Z" fill="#842d2a" />
        <path d="M388 348v-29h38v29Z" /><path d="m380 319 26-20 29 20Z" fill="#842d2a" />
        <path d="M151 334v-18h10v18m36 7v-16h10v16m193 7v-14h10v14" />
      </g>
      <g stroke="#f6f0e5" strokeWidth="2"><path d="M108 361v-35m-9 20 9-18 9 18m334 17v-51m-12 30 12-26 13 26m-5-46 11-24 11 24m-11 32v-56" /></g>
    </g>
    <path d="M55 500V225a245 245 0 0 1 490 0v275" stroke="currentColor" strokeOpacity=".25" />
    <path d="M70 500V225a230 230 0 0 1 460 0" stroke="currentColor" />
    {hero && <g stroke="#a9854c" strokeWidth="1.3">
      <ellipse cx="319" cy="209" rx="260" ry="91" transform="rotate(-27 319 209)" />
      <g transform="translate(501 83) rotate(-27)"><path d="M-15-13h30v26h-30Z" fill="#f6f0e5" /><path d="M-51-10h29v20h-29Zm73 0h29v20H22Z" fill="#842d2a" /><path d="M-37-10v20m73-20v20m-58-10h7m30 0h7M0 13v13m-8 0h16" /></g>
      <path d="m90 147 6 6-6 6-6-6ZM461 232h12m-6-6v12" />
    </g>}
  </svg>;
}

export function PeopleArt() {
  return <svg viewBox="0 0 600 500" fill="none" aria-hidden="true">
    <path d="M70 500V225a230 230 0 0 1 460 0v275Z" fill="currentColor" />
    <path d="M55 500V225a245 245 0 0 1 490 0v275" stroke="currentColor" strokeOpacity=".25" />
    <g stroke="#cfad70" opacity=".6"><path d="M100 188h400M85 210h430M73 232h454M70 254h460M70 276h460" /><path d="M170 100v163m65-218v218m65-265v265m65-218v218m65-163v163" /></g>
    <path d="m150 189 150-87 150 87-150 16Z" fill="#f6f0e5" /><path d="M165 206h270v19H165Zm14 24h21v92h-21Zm110 0h21v92h-21Zm111 0h21v92h-21Z" fill="#eadfc9" />
    <path d="M135 338h330v16H135Z" fill="#cfad70" />
    <ellipse cx="300" cy="405" rx="159" ry="57" fill="#b3795e" stroke="#f6f0e5" strokeWidth="2" />
    <ellipse cx="300" cy="393" rx="159" ry="57" fill="#e8d7b9" />
    <g fill="#842d2a"><path d="m254 366 75-9 35 20-75 9Z" /><path d="m270 399 61-5 24 15-61 6Z" /></g>
    <g fill="#eadfc9" stroke="#842d2a" strokeWidth="3">
      <circle cx="207" cy="341" r="19" /><path d="M176 383c0-37 61-37 61 0" />
      <circle cx="302" cy="325" r="19" /><path d="M271 367c0-37 61-37 61 0" />
      <circle cx="397" cy="341" r="19" /><path d="M367 383c0-37 61-37 61 0" />
      <circle cx="211" cy="429" r="20" /><path d="M177 480c0-46 68-46 68 0v20h-68Z" />
      <circle cx="389" cy="429" r="20" /><path d="M355 480c0-46 68-46 68 0v20h-68Z" />
      <circle cx="300" cy="448" r="20" /><path d="M266 500c0-46 68-46 68 0Z" />
    </g>
    <path d="M113 397c-13-19-13-40 0-59m374 59c13-19 13-40 0-59" stroke="#cfad70" strokeWidth="1.5" strokeDasharray="4 5" />
  </svg>;
}

export function OrbitArt() {
  return <svg viewBox="0 0 600 500" fill="none" aria-hidden="true">
    <path d="M70 500V225a230 230 0 0 1 460 0v275Z" fill="currentColor" />
    <path d="M55 500V225a245 245 0 0 1 490 0v275" stroke="currentColor" strokeOpacity=".25" />
    <g stroke="#d9c39c" strokeWidth="1.2">
      <circle cx="300" cy="295" r="130" /><ellipse cx="300" cy="295" rx="70" ry="130" /><ellipse cx="300" cy="295" rx="130" ry="48" />
      <path d="M170 295h260M300 165v260M188 230h224M188 360h224" opacity=".7" />
      <ellipse cx="300" cy="285" rx="228" ry="77" transform="rotate(-32 300 285)" stroke="#cfad70" strokeWidth="2" />
      <ellipse cx="300" cy="285" rx="228" ry="77" transform="rotate(38 300 285)" strokeDasharray="3 7" />
    </g>
    <path d="m259 225 20-11 15 10 24-6 7 22 21 3-12 21 18 14-8 26-29 2-1 22-19 10-10-30-19-19-18-34Z" fill="#d9c39c" opacity=".7" />
    <g transform="translate(462 164) rotate(-32)" stroke="#cfad70" strokeWidth="2">
      <path d="M-18-18h36v36h-36Z" fill="#f6f0e5" /><path d="M-76-15h48v30h-48Zm104 0h48v30H28Z" fill="#b3795e" />
      <path d="M-60-15v30m16-30v30m88-30v30m16-30v30M-76 0h48m56 0h48m-104 0h10m36 0h10M0 18v18m-11 0h22" />
    </g>
    <g fill="#cfad70"><circle cx="140" cy="166" r="3" /><circle cx="211" cy="108" r="2" /><circle cx="385" cy="107" r="3" /><circle cx="472" cy="329" r="3" /><circle cx="171" cy="443" r="2" /></g>
    <path d="M115 277h12m-6-6v12m246-141h12m-6-6v12" stroke="#d9c39c" />
    <path d="M270 456h60m-30-12v25" stroke="#cfad70" />
  </svg>;
}
