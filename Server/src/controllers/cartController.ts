import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Product from "../models/Product";
import { AuthRequest } from "../middlewares/auth";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

async function getOrCreateCart(userId: string) {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;

  try {
    return await Cart.create({ user: userId, items: [] });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const cart = await Cart.findOne({ user: userId });
      if (cart) return cart;
    }
    throw error;
  }
}

function unavailableReason(product: {
  status?: string;
  availability?: string;
  stock?: number;
} | null, quantity = 1) {
  if (!product) return "product_deleted";
  if (product.status !== "active") return "product_inactive";
  if (product.availability === "coming_soon") return "coming_soon";
  if (product.availability !== "in_stock" || (product.stock ?? 0) < 1) return "out_of_stock";
  if ((product.stock ?? 0) < quantity) return "insufficient_stock";
  return null;
}

async function serializeCart(cart: InstanceType<typeof Cart>) {
  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.product) },
  });
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));

  let subtotal = 0;
  let availableItemCount = 0;
  let unavailableItemCount = 0;
  let hasPriceChanges = false;
  const items = cart.items.map((item) => {
    const product = productsById.get(item.product.toString()) || null;
    const reason = unavailableReason(product, item.quantity);
    const currentPrice = product?.price ?? null;
    const priceChanged =
      currentPrice !== null && Math.abs(currentPrice - item.priceAtAdd) > 0.000001;
    if (priceChanged) hasPriceChanges = true;

    if (reason) {
      unavailableItemCount += 1;
    } else {
      availableItemCount += 1;
      subtotal += currentPrice! * item.quantity;
    }

    return {
      productId: item.product.toString(),
      name: product?.name ?? item.nameAtAdd,
      image_url: product?.image_url ?? item.imageAtAdd ?? null,
      quantity: item.quantity,
      priceAtAdd: item.priceAtAdd,
      currentPrice,
      lineTotal: reason ? 0 : currentPrice! * item.quantity,
      available: reason === null,
      unavailableReason: reason,
      stock: product?.stock ?? 0,
      priceChanged,
    };
  });

  return {
    _id: cart._id,
    items,
    subtotal,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    availableItemCount,
    unavailableItemCount,
    hasPriceChanges,
    updatedAt: cart.updatedAt,
  };
}

function getCustomerId(req: Request) {
  return (req as AuthRequest).user!._id.toString();
}

function invalidProductId(id: string) {
  return !mongoose.Types.ObjectId.isValid(id);
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(getCustomerId(req));
  return res.status(200).json({ success: true, data: await serializeCart(cart) });
});

export const createCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(getCustomerId(req));
  return res.status(201).json({ success: true, data: await serializeCart(cart) });
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body as {
    productId?: string;
    quantity?: number;
  };
  if (!productId || invalidProductId(productId)) {
    return res.status(400).json({ success: false, message: "A valid productId is required" });
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
  }

  const product = await Product.findById(productId);
  const reason = unavailableReason(product);
  if (!product || reason) {
    return res.status(409).json({
      success: false,
      message: "Product is unavailable",
      data: { productId, unavailableReason: reason },
    });
  }

  const cart = await getOrCreateCart(getCustomerId(req));
  const item = cart.items.find((entry) => entry.product.toString() === productId);
  const nextQuantity = (item?.quantity ?? 0) + quantity;
  if (nextQuantity > product.stock) {
    return res.status(409).json({
      success: false,
      message: "Requested quantity exceeds available stock",
      data: { availableStock: product.stock, requestedQuantity: nextQuantity },
    });
  }

  if (item) {
    item.quantity = nextQuantity;
    item.priceAtAdd = product.price;
    item.nameAtAdd = product.name;
    item.imageAtAdd = product.image_url ?? null;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      priceAtAdd: product.price,
      nameAtAdd: product.name,
      imageAtAdd: product.image_url ?? null,
    });
  }

  await cart.save();
  return res.status(200).json({
    success: true,
    data: await serializeCart(cart),
    message: "Product added to cart",
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body as { quantity?: number };
  if (invalidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid productId" });
  }
  if (!Number.isSafeInteger(quantity) || quantity! < 1) {
    return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
  }

  const cart = await getOrCreateCart(getCustomerId(req));
  const item = cart.items.find((entry) => entry.product.toString() === productId);
  if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

  const product = await Product.findById(productId);
  const reason = unavailableReason(product);
  if (!product || reason) {
    return res.status(409).json({
      success: false,
      message: "Product is unavailable",
      data: { productId, unavailableReason: reason },
    });
  }
  if (quantity! > product.stock) {
    return res.status(409).json({
      success: false,
      message: "Requested quantity exceeds available stock",
      data: { availableStock: product.stock, requestedQuantity: quantity },
    });
  }

  item.quantity = quantity!;
  item.priceAtAdd = product.price;
  item.nameAtAdd = product.name;
  item.imageAtAdd = product.image_url ?? null;
  await cart.save();
  return res.status(200).json({ success: true, data: await serializeCart(cart) });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (invalidProductId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid productId" });
  }
  const cart = await getOrCreateCart(getCustomerId(req));
  const itemIndex = cart.items.findIndex((entry) => entry.product.toString() === productId);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: "Cart item not found" });
  }
  cart.items.splice(itemIndex, 1);
  await cart.save();
  return res.status(200).json({ success: true, data: await serializeCart(cart) });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(getCustomerId(req));
  cart.items = [];
  await cart.save();
  return res.status(200).json({ success: true, data: await serializeCart(cart) });
});
