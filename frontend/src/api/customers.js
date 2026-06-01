import api from "./client";

export const customerApi = {
  list: () => api.get("/customers").then((res) => res.data),
  create: (payload) => api.post("/customers", payload).then((res) => res.data),
  update: (id, payload) => api.patch(`/customers/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/customers/${id}`),
};
