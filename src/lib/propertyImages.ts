import villa1 from "@/assets/properties/villa-1.jpg";
import villa2 from "@/assets/properties/villa-2.jpg";
import flat1 from "@/assets/properties/flat-1.jpg";
import flat2 from "@/assets/properties/flat-2.jpg";
import plot1 from "@/assets/properties/plot-1.jpg";
import plot2 from "@/assets/properties/plot-2.jpg";
import shop1 from "@/assets/properties/shop-1.jpg";
import shop2 from "@/assets/properties/shop-2.jpg";

const imagesByType: Record<string, string[]> = {
  villa: [villa1, villa2],
  flat: [flat1, flat2],
  plot: [plot1, plot2],
  shop: [shop1, shop2],
};

export function getPropertyImage(type: string, index: number = 0): string {
  const images = imagesByType[type] || imagesByType.plot;
  return images[index % images.length];
}

export function getPropertyImages(type: string): string[] {
  return imagesByType[type] || imagesByType.plot;
}
