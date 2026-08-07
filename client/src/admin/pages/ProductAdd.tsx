import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import ProductForm from "../components/products/ProductForm";
import { createProduct, getBrands, getCategories } from "../services/productService";
import { emptyProductFormValues } from "../utils/productFormDefaults";
import type { NamedOption, ProductFormValues } from "../types/product";

export default function ProductAdd() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<NamedOption[]>([]);
  const [brands, setBrands] = useState<NamedOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
    getBrands().then(setBrands);
  }, []);

  async function handleSubmit(values: ProductFormValues) {
    setSubmitting(true);
    try {
      await createProduct(values);
      toast.success("Product Added Successfully");
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
          <h1>Add Product</h1>
          <p>Create a new listing for the product catalog.</p>
        </div>
      </div>

      <ProductForm
        defaultValues={emptyProductFormValues}
        categories={categories}
        brands={brands}
        submitting={submitting}
        submitLabel="Save Product"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/products")}
      />
    </>
  );
}
