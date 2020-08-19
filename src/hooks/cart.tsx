import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = JSON.parse(
        (await AsyncStorage.getItem('@GoMarketplace:products')) || '[]',
      );
      if (loadedProducts.length > 0) {
        setProducts(loadedProducts);
      }
    }

    loadProducts();
  }, []);

  const persistProducts = useCallback(async (productsToSave: Product[]) => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(productsToSave),
    );
  }, []);

  const changeQuantity = useCallback(
    async (productIndex: number, quantity: number) => {
      const productsClone = [...products];
      const productFound = { ...productsClone[productIndex] };
      productFound.quantity += quantity;

      if (productFound.quantity > 0) {
        productsClone[productIndex] = productFound;
      } else {
        productsClone.splice(productIndex, 1);
      }
      setProducts(productsClone);
      persistProducts(productsClone);
    },
    [products, persistProducts],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);
      if (productIndex !== -1) {
        changeQuantity(productIndex, 1);
      } else {
        const productToAdd = { ...product, quantity: 1 };
        const productsToSave = [...products, productToAdd];
        setProducts(productsToSave);
        persistProducts(productsToSave);
      }
    },
    [changeQuantity, products, persistProducts],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);
      changeQuantity(productIndex, 1);
    },
    [changeQuantity, products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);
      changeQuantity(productIndex, -1);
    },
    [changeQuantity, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
