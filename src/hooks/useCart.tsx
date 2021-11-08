import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const productExists = updateCart.find(
        (product) => product.id === productId
      );

      if (productExists) {
        const response = await api.get<Stock>(`/stock/${productId}`);
        const { amount: stockAmount } = response.data;

        if (productExists.amount < stockAmount) {
          productExists.amount += 1;
          setCart(updateCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }

        return;
      } else {
        const response = await api.get<Product>(`/products/${productId}`);
        const { id, title, price, image } = response.data;
        const newProduct = { id, title, price, image, amount: 1 };

        const updateCartWithNewProduct = [...cart, newProduct];

        setCart(updateCartWithNewProduct);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(updateCartWithNewProduct)
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex >= 0) {
        const updateCart = [...cart];
        updateCart.splice(productIndex, 1);
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const response = await api.get<Stock>(`/stock/${productId}`);
      const { amount: stockAmount } = response.data;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updateCart = [...cart];
      const productExists = updateCart.find(
        (product) => product.id === productId
      );

      if (!productExists) {
        throw Error();
      }

      productExists.amount = amount;
      setCart(updateCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  return useContext(CartContext);
}
