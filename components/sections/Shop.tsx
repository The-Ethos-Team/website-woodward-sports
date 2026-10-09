import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext, NewTab } from '@/components/ui/bits';
import { ProductImg } from '@/components/ui/media';
import { DATA } from '@/lib/snapshot';
import type { Product } from '@/lib/types';

const SIZES = '(min-width: 768px) 25vw, (min-width: 600px) 33vw, 50vw';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="prods" data-reveal="">
      {products.map((p, i) => {
        const [a, b] = p.price.split('.');
        return (
          <li key={p.handle} style={{ ['--i' as string]: Math.min(i, 5) }}>
            <a className="prod" href={p.url} target="_blank" rel="noopener">
              <div className="prod__img"><ProductImg img={p.image} sizes={SIZES} /></div>
              <span className="prod__price">${a}{b !== undefined ? <><span className="pd">.</span>{b}</> : null}</span>
              <h3 className="prod__title">{p.title}</h3>
              <NewTab />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function Shop({ products, ch = '08', children }: { products: Product[]; ch?: string; children?: React.ReactNode }) {
  return (
    <section id="shop" className="sec sec--paper" aria-labelledby="shop-h">
      <div className="wrap">
        <SectionHead ch={ch} name="SHOP" title="MERCH DROP" sub="The official home of Woodward Sports gear. Rep the street sign." id="shop-h" />
        <ProductGrid products={products} />
        <div className="shop__foot">
          <Ext href={DATA.shop.url} className="btn btn--ink"><span>Shop all</span><Arrow /></Ext>
          <span className="shop__note">Prices from the store · may change</span>
        </div>
        {children}
      </div>
    </section>
  );
}
