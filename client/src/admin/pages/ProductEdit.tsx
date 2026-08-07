import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, PackageX } from "lucide-react";
import ProductForm from "../components/products/ProductForm";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import {
  getBrands,
  getCategories,
  getProductById,
  updateProduct,
} from "../services/productService";
import { productToFormValues } from "../utils/productFormDefaults";
import type { NamedOption, Product, ProductFormValues } from "../types/product";

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<NamedOption[]>([]);
  const [brands, setBrands] = useState<NamedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [productData] = await Promise.all([
          getProductById(id!),
          getCategories().then((c) => mounted && setCategories(c)),
          getBrands().then((b) => mounted && setBrands(b)),
        ]);
        if (!mounted) return;
        setProduct(productData);
      } catch {
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSubmit(values: ProductFormValues) {
    if (!id) return;
    setSubmitting(true);
    try {
      await updateProduct(id, values);
      toast.success("Product Updated Successfully");
      navigate("/admin/products");
    } catch {
      toast.error("Database Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="admin-form-back"
        onClick={() => navigate("/admin/products")}
      >
        <ArrowLeft size={15} />
        Back to Products
      </button>

      <div className="admin-page-head">
        <div>
          <h1>Edit Product</h1>
          <p>Update details for this product listing.</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-table-card">
          <LoadingSpinner label="Loading product…" />
        </div>
      ) : notFound || !product ? (
        <div className="admin-table-card">
          <EmptyState
            icon={PackageX}
            title="Product not found"
            description="This product may have been deleted."
          />
        </div>
      ) : (
        <ProductForm
          key={product.id}
          defaultValues={productToFormValues(product)}
          categories={categories}
          brands={brands}
          submitting={submitting}
          submitLabel="Update Product"
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/products")}
        />
      )}
    </>
  );
}
