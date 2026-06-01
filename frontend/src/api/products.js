import api from "./client";

export const productApi = {
  list: (params) => api.get("/products", { params }).then((res) => res.data),
  create: (payload) => api.post("/products", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/products/${id}`),
};
