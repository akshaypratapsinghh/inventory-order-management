import api from "./client";

export const orderApi = {
  list: () => api.get("/orders").then((res) => res.data),
  get: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  create: (payload) => api.post("/orders", payload).then((res) => res.data),
  remove: (id) => api.delete(`/orders/${id}`),
};
