import { PageHero } from '@/components/ui/PageHero';
import { Arrow, Ext, Icon } from '@/components/ui/bits';
import { Shop } from '@/components/sections/Shop';
import { getProducts } from '@/lib/data';
import { pageMeta } from '@/lib/meta';
import { DATA } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'Shop',
  description: 'The official home of Woodward Sports gear: street-sign hoodies, Lions, Pistons, Tigers and Red Wings pullovers, caps and mugs from the Woodward Sports Store.',
  path: '/shop',
});

export default async function ShopPage() {
  const { products } = await getProducts();
  const cols = DATA.shop.collections.filter(c => c.name !== 'Seasonal');
  return (
    <>
      <PageHero
        kicker="WOODWARD SPORTS STORE"
        title="Merch" dot
        sub="The official home of Woodward Sports gear. Rep the street sign."
        ctas={<Ext href={DATA.shop.url} className="btn btn--blade btn--xl"><Icon name="shop" /><span>Shop all</span></Ext>}
      />
      <Shop products={products} ch="01">
        <p className="lchips__lbl lbl" id="cols-h">Collections</p>
        <ul className="lchips" aria-labelledby="cols-h">
          {cols.map(c => <li key={c.url}><Ext href={c.url} className="lchip">{c.name}<Icon name="ext" /></Ext></li>)}
        </ul>
        <div className="sec__foot"><Ext href={DATA.shop.return_policy_url} className="textlink"><span>Return policy</span><Arrow /></Ext></div>
      </Shop>
    </>
  );
}
