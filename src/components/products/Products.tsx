import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createTitle } from '../../utils/createTitle';
import ProductCard from './ProductCard';
import { TARGET_GENDERS, isTargetGender, type TargetGender } from '../../constants/products';
import { getProductsForHomepage } from '../../services/productService';
import type { ProductCatalogItem } from '../../types/products';

import './Products.scss';
import Loader from '../loader/Loader';

const Products = () => {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetGender, setTargetGender] = useState<TargetGender>('NINIAS');

  const changeTargetGender = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.currentTarget.value;
    if (isTargetGender(selectedValue)) {
      setTargetGender(selectedValue);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const productsData = await getProductsForHomepage(targetGender, controller.signal);
        setProducts(productsData);
      } catch (requestError) {
        if (controller.signal.aborted) return;

        const message = requestError instanceof Error ? requestError.message : 'Error desconocido';
        setError(`Error. Por favor, intentá de nuevo. (${message})`);
        console.error(requestError);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();
    return () => controller.abort();
  }, [targetGender]);

  if (error) return <div className="error">{error}</div>;
  if (loading) return <Loader />;

  return (
    <div id="products_container" className="products_container container py-3 py-sm-4 py-md-5 rounded-3">
      <div className="row justify-content-center">
        <div className="col-10 col-lg-12 px-lg-5">
          <div className="row">
            <h2 className="text-center">
              {createTitle('Nuestros Productos', 'bi bi-cart')}
            </h2>
            <div className="d-flex justify-content-center align-items-center my-4">
              <select
                aria-label="Filtrar productos por público"
                className="main-btn-style text-center"
                style={{ width: 400, cursor: 'pointer' }}
                value={targetGender}
                onChange={changeTargetGender}
                disabled={loading}
              >
                {TARGET_GENDERS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="row">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {products.length === 0 && (
                <p className="no-products">No hay productos disponibles para esta selección.</p>
              )}
            </div>
            <div className="text-secondary">
              *Este es nuestro catálogo, para poder realizar un pedido, consultar por stock, o solicitar precio mayorista, deberá comunicarse con nosotros por medio de nuestros canales.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
