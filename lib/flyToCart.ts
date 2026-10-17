export type FlyDetail = { src: string; x: number; y: number };

// Tells FlyLayer to fly a small copy of the dish photo from this spot to the cart icon
export function flyToCart(src: string, from: DOMRect) {
  window.dispatchEvent(
    new CustomEvent<FlyDetail>("cart:fly", {
      detail: {
        src,
        x: from.left + from.width / 2,
        y: from.top + from.height / 2,
      },
    })
  );
}
