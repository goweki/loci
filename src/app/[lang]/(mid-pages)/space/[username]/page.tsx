import { MerchantProducts } from "./_components/merchant-products";
import { getMerchantProducts } from "./_components/space-utils";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function MerchantSpacePage({ params }: Props) {
  const { username } = await params;

  const products = await getMerchantProducts(username);

  return <MerchantProducts products={products} />;
}
