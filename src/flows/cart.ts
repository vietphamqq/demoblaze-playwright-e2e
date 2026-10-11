import { HomePage } from '@pages/HomePage';
import { ProductPage } from '@pages/ProductPage';

export async function openProductFromHome(
  home: HomePage,
  product: ProductPage,
  title: string,
): Promise<void> {
  await home.open();
  await home.openProduct(title);
  await product.waitForLoad();
}
