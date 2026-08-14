import { API_URL } from "../../api/api";

type RequestResult = Promise<{ data: any; success: boolean; message?: string }>; 

type QueryResult = Promise<{ data: any; error: any; count?: number | null }>;

const STORAGE_KEY = "admin_auth_token";

function getStoredToken() {
  return typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
}

function setStoredToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, token);
  }
}

function removeStoredToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return { data: null, success: false, message: payload?.message || response.statusText };
  }

  return { data: payload?.data, success: true, message: payload?.message };
}

function buildQueryString(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (entries.length === 0) return "";
  return `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`).join("&")}`;
}

class ApiQuery {
  private table: string;
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private payload: any = null;
  private params: Record<string, string> = {};
  private singleMode = false;
  private limitValue?: number;
  private rangeFrom?: number;
  private rangeTo?: number;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: any, opts?: any): this {
    if (opts?.count) {
      this.params.count = opts.count;
    }
    if (opts?.head) {
      this.params.head = "true";
    }
    return this;
  }

  insert(payload: any): this {
    this.method = "POST";
    this.payload = payload;
    return this;
  }

  update(payload: any): this {
    this.method = "PATCH";
    this.payload = payload;
    return this;
  }

  delete(): this {
    this.method = "DELETE";
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    if (column) {
      this.params.orderBy = column;
      if (opts?.ascending !== undefined) {
        this.params.order = opts.ascending ? "asc" : "desc";
      }
    }
    return this;
  }

  eq(field: string, value: any): this {
    if (value !== undefined && value !== null) {
      this.params[field] = String(value);
    }
    return this;
  }

  ilike(field: string, value: string): this {
    const term = value.replace(/%/g, "").trim();
    if (term) {
      this.params.search = term;
    }
    return this;
  }

  or(expr: string): this {
    const matches = expr.match(/[^,]+\.ilike\.%(.*?)%/g);
    if (matches) {
      const term = matches
        .map((part) => part.replace(/.*\.ilike\.%(.*?)%/, "$1"))
        .filter(Boolean)[0];
      if (term) {
        this.params.search = term;
      }
    }
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  range(from: number, to: number): this {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  async single(): Promise<{ data: any; error: any }> {
    this.singleMode = true;
    const result = await this.execute();
    return { data: result.data, error: result.error };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    const isWrite = this.method === "POST" || this.method === "PATCH" || this.method === "DELETE";
    let endpoint = `/api/${this.table}`;
    const params: Record<string, string> = { ...this.params };

    if (this.singleMode && params.id) {
      endpoint += `/${encodeURIComponent(params.id)}`;
      delete params.id;
    }

    if (this.limitValue !== undefined) {
      params.pageSize = String(this.limitValue);
    }

    if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
      const pageSize = this.rangeTo - this.rangeFrom + 1;
      const page = Math.floor(this.rangeFrom / pageSize) + 1;
      params.pageSize = String(pageSize);
      params.page = String(page);
    }

    const queryString = buildQueryString(params);
    const requestOptions: RequestInit = {
      method: this.method,
    };

    if (isWrite && this.payload !== null) {
      requestOptions.body = JSON.stringify(this.payload);
    }

    const result = await apiRequest(`${endpoint}${queryString}`, requestOptions);
    if (!result.success) {
      return { data: null, error: { message: result.message } };
    }

    const responseData = result.data;
    if (this.isWrite) {
      return { data: responseData, error: null };
    }

    if (this.singleMode) {
      return { data: responseData, error: null };
    }

    if (this.table === "products" && responseData?.products) {
      return { data: responseData.products, count: responseData.totalCount ?? responseData.products.length ?? 0, error: null };
    }

    if (this.table === "enquiries" && responseData?.enquiries) {
      return { data: responseData.enquiries, count: responseData.totalCount ?? responseData.enquiries.length ?? 0, error: null };
    }

    if (Array.isArray(responseData)) {
      return { data: responseData, count: responseData.length, error: null };
    }

    return { data: responseData, count: null, error: null };
  }
}

export const adminClient = {
  auth: {
    getSession: async () => {
      const token = getStoredToken();
      if (!token) {
        return { data: { session: null } };
      }

      const result = await apiRequest("/api/auth/me", { method: "GET" });
      if (!result.success) {
        removeStoredToken();
        return { data: { session: null } };
      }

      return {
        data: {
          session: {
            user: result.data,
            access_token: token,
          },
        },
      };
    },

    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!result.success) {
        return { error: { message: result.message ?? "Login failed" } };
      }

      setStoredToken(result.data.token);
      return {
        data: {
          session: {
            user: result.data.user,
            access_token: result.data.token,
          },
        },
      };
    },

    signOut: async () => {
      removeStoredToken();
      return {};
    },

    updateUser: async () => ({ error: null }),
  },
  from: (table: string) => new ApiQuery(table),
  storage: {
    from: (_bucket: string) => ({
      upload: async () => ({ error: null }),
      getPublicUrl: (_path: string) => ({ publicUrl: "" }),
      remove: async () => ({ error: null }),
    }),
  },
};
