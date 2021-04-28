import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
        const storagedCart = localStorage.getItem('@RocketShoes:cart');
        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const addProduct = async (productId: number) => {
        try {
            const resultStock = await api.get(`stock/${productId}`);
            const quantity = resultStock.data;
            const existingProduct = cart.find(
                (product: Product) => product.id === productId
            );
            if (
                existingProduct &&
                existingProduct.amount + 1 > quantity.amount
            ) {
                toast.error('Quantidade solicitada fora de estoque');
            }

            const resultProduct = await api.get(`products/${productId}`);
            const productIndex = resultProduct.data;

            if (!productIndex || !quantity) {
                toast.error('Erro na adição do produto');
            }
            if (!existingProduct) {
                toast.error('Erro na alteração de quantidade do produto');
            }
            if (existingProduct && existingProduct.amount < 1) {
                toast.error('Quantidade inválida');
            }
            let newCart = [];
            if (existingProduct) {
                newCart = cart.map((product: Product) => {
                    if (product.id === productId) {
                        if (quantity.amount >= product.amount + 1) {
                            product.amount += 1;
                        } else {
                            toast.error(
                                'Quantidade solicitada fora de estoque'
                            );
                        }
                    }
                    return product;
                });
                setCart(newCart);
                localStorage.setItem(
                    '@RocketShoes:cart',
                    JSON.stringify(newCart)
                );
            } else {
                newCart = [...cart, { ...productIndex, amount: 1 }];
                setCart(newCart);
                localStorage.setItem(
                    '@RocketShoes:cart',
                    JSON.stringify(newCart)
                );
            }
            // TODO
        } catch {
            toast.error('Erro na adição do produto');
        }
    };

    const removeProduct = (productId: number) => {
        try {
            // localStorage.setItem('@RocketShoes:cart', '[]');

            const existingProduct = cart.find(
                (product: Product) => product.id === productId
            );
            if (!existingProduct) {
                toast.error('Erro na remoção do produto');
            }
            let newCart = [];
            if (existingProduct) {
                newCart = cart.filter(
                    (product: Product) => product.id !== productId
                );
                setCart(newCart);
                localStorage.setItem(
                    '@RocketShoes:cart',
                    JSON.stringify(newCart)
                );
            } else {
                toast.error('Item não localizado');
            }
            // TODO
        } catch {
            toast.error('Erro na remoção do produto');
        }
    };

    const updateProductAmount = async ({
        productId,
        amount,
    }: UpdateProductAmount) => {
        try {
            const resultStock = await api.get(`stock/${productId}`);
            const quantity = resultStock.data;
            if (amount > quantity.amount) {
                toast.error('Quantidade solicitada fora de estoque');
            }

            const resultProduct = await api.get(`products/${productId}`);
            const productIndex = resultProduct.data;

            const existingProduct = cart.find(
                (product: Product) => product.id === productId
            );
            if (!existingProduct) {
                toast.error('Erro na alteração de quantidade do produto');
            }
            if (!productIndex || !quantity) {
                toast.error('Erro na alteração de quantidade do produto');
            }
            if (amount < 1) {
                toast.error('Quantidade inválida');
            }

            let newCart = [];
            if (existingProduct) {
                newCart = cart.map((product: Product) => {
                    if (product.id === productId) {
                        if (quantity.amount >= amount) {
                            product.amount = amount;
                        } else {
                            toast.error(
                                'Quantidade solicitada fora de estoque'
                            );
                        }
                    }
                    return product;
                });
                setCart(newCart);
                localStorage.setItem(
                    '@RocketShoes:cart',
                    JSON.stringify(newCart)
                );
            } else {
                toast.error('Item não localizado');
            }
            // TODO
        } catch {
            toast.error('Erro na atualização do produto');
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
    const context = useContext(CartContext);

    return context;
}
