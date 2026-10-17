// Shared look for every button and nav link.
// Each style is a string of Tailwind classes. Edit them here and the whole site follows.
//
// How to use one:  className={`${curved} ${solid} px-8 py-3`}

// Rounded on all corners, extra round on the top right
const common =
  "transition-[box-shadow,color,filter,border-color] duration-300";
export const curved = `${common} rounded-[0.7rem] rounded-tr-[1.4rem]`;
// A bigger curve for taller items like nav links and large buttons
export const curvedLg = `${common} rounded-[0.8rem] rounded-tr-[1.6rem]`;
// A smaller curve for compact buttons, like the ones in the navbar
export const curvedSm = `${common} rounded-[0.5rem] rounded-tr-[1rem]`;

// Filled: red on the left, orange on the right
export const solid =
  "border border-transparent bg-[image:linear-gradient(90deg,#dc2626,#f97316)] text-white hover:brightness-110 hover:shadow-lg hover:shadow-red-600/30";

// Glass: see-through buttons on the dark page
export const soft =
  "border border-white/20 bg-[image:linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0.14))] text-white hover:border-orange-500 hover:text-orange-300";

// Dark: for items on the dark navbar
export const dark =
  "border border-transparent bg-[image:linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.16))] text-white hover:bg-white/10 hover:text-amber-300";

// Outlined red and orange, for "Order online"
export const ghost =
  "border-2 border-orange-500 bg-[image:linear-gradient(90deg,rgba(220,38,38,0.15),rgba(249,115,22,0.3))] text-orange-300 hover:bg-[image:linear-gradient(90deg,#dc2626,#f97316)] hover:text-white";

// Charcoal: dark grey buttons with a lighter edge, like the menu filters
export const charcoal =
  "border border-stone-600 bg-[image:linear-gradient(90deg,#57534e,#292524)] text-stone-100 hover:border-orange-500 hover:text-orange-300";
