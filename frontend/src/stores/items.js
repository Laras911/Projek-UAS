import { defineStore } from 'pinia'
import api from '../services/api'

export const useItemsStore = defineStore('items', {
  state: () => ({
    myItems: [],
    otherItems: []
  }),
  actions: {
    async fetchMyItems() {
      const res = await api.get('/items/my')
      this.myItems = res.data
    },
    async fetchOtherItems() {
      const res = await api.get('/items/others')
      this.otherItems = res.data
    },
    async createItem(item) {
      const res = await api.post('/items', item)
      await this.fetchMyItems()
      return res.data
    },
    async updateItem(id, item) {
      await api.put(`/items/${id}`, item)
      await this.fetchMyItems()
    },
    async deleteItem(id) {
      await api.delete(`/items/${id}`)
      await this.fetchMyItems()
    }
  }
})