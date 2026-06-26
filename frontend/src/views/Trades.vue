<template>
  <div class="trades-page">
    <div class="sidebar">
      <!-- Profile Card -->
      <div class="profile-card">
        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop" class="profile-avatar" />
        <h3>Trader Profile</h3>
        <div class="verified-badge"><i class="fas fa-shield-alt"></i> Verified Member</div>
      </div>

      <!-- Sidebar Nav -->
      <nav class="sidebar-nav">
        <button v-for="tab in sidebarTabs" :key="tab.key" @click="navigateTo(tab)" class="sidebar-btn"
          :class="{ active: tab.key === 'trades' }">
          <i :class="tab.icon"></i> {{ tab.label }}
        </button>
      </nav>

      <!-- New Trade Button -->
      <button class="btn-new-trade" @click="$router.push('/my-items')">NEW TRADE</button>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <h1>Barter Requests</h1>
      <p class="subhead">Manage your exchanges. Be direct, be fair, and keep the rebellion alive.</p>

      <div class="two-col">
        <!-- Incoming -->
        <section>
          <div class="section-header"><i class="fas fa-download"></i> Permintaan Masuk</div>
          <div v-if="incoming.length === 0" class="empty-placeholder">Tidak ada permintaan masuk baru.</div>
          <div v-else v-for="req in incoming" :key="req.id" class="trade-card">
            <div class="trade-header">
              <img :src="req.senderAvatar || defaultAvatar" class="sender-avatar" />
              <div>
                <h4>@{{ req.offered_by_username || 'User' }}</h4>
                <span class="time">{{ req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Baru' }}</span>
              </div>
              <span class="status-pill" :class="statusClass(req.status)">{{ req.status }}</span>
            </div>
            <div class="item-swap">
              <div class="item-box">
                <span class="label">THEIR ITEM</span>
                <div class="item-detail">
                  <img :src="req.offered_item_image || placeholderImage" />
                  <div>
                    <h5>{{ req.offered_item_name }}</h5>
                    <p>{{ req.offered_item_desc || '' }}</p>
                  </div>
                </div>
              </div>
              <div class="swap-icon"><i class="fas fa-arrow-left-right"></i></div>
              <div class="item-box">
                <span class="label">YOUR ITEM</span>
                <div class="item-detail">
                  <img :src="req.requested_item_image || placeholderImage" />
                  <div>
                    <h5>{{ req.requested_item_name }}</h5>
                    <p>{{ req.requested_item_desc || '' }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="req.status === 'pending'" class="action-buttons">
              <button class="btn-accept" @click="acceptTrade(req.id)"><i class="fas fa-check"></i> Terima</button>
              <button class="btn-reject" @click="openReject(req.id)"><i class="fas fa-times"></i> Tolak</button>
            </div>
          </div>

          <!-- Accepted trades banner -->
          <div class="accepted-banner" v-if="acceptedTrades.length">
            <h4>Barter Sukses Terbaru</h4>
            <div v-for="t in acceptedTrades" :key="t.id" class="accepted-item">
              <span>@{{ t.offered_by_username }} wants to trade {{ t.offered_item_name }} ➔ {{ t.requested_item_name }}</span>
              <span class="accepted-badge">ACCEPTED</span>
            </div>
          </div>
        </section>

        <!-- Outgoing -->
        <section>
          <div class="section-header"><i class="fas fa-upload"></i> Permintaan Keluar</div>
          <div v-if="outgoing.length === 0" class="empty-placeholder">Tidak ada penawaran keluar aktif.</div>
          <div v-else v-for="req in outgoing" :key="req.id" class="trade-card" :class="{ rejected: req.status === 'rejected' }">
            <div class="trade-header">
              <div>
                <h4>Request to <span class="highlight">@{{ req.requested_by_username || 'User' }}</span></h4>
                <span class="time">{{ req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Baru' }}</span>
              </div>
              <span class="status-pill" :class="statusClass(req.status)">{{ req.status }}</span>
            </div>
            <div v-if="req.status === 'rejected'" class="reject-reason">
              <p><strong>Reason:</strong> "{{ req.reason || 'Maaf, belum cocok barterannya.' }}"</p>
            </div>
            <div v-else class="item-swap-simple">
              <div class="swap-row">
                <img :src="req.offered_item_image || placeholderImage" />
                <span>{{ req.offered_item_name }}</span>
                <i class="fas fa-arrow-left-right"></i>
                <img :src="req.requested_item_image || placeholderImage" />
                <span>{{ req.requested_item_name }}</span>
              </div>
            </div>
            <div v-if="req.status === 'pending'" class="action-buttons">
              <button class="btn-cancel" @click="cancelTrade(req.id)">Cancel Request</button>
            </div>
          </div>
        </section>
      </div>

      <!-- Reject Modal -->
      <div v-if="rejectId" class="modal-overlay" @click.self="closeReject">
        <div class="modal-box reject-modal">
          <div class="modal-header">
            <h3>Tolak Permintaan Barter</h3>
            <button class="modal-close" @click="closeReject"><i class="fas fa-times"></i></button>
          </div>
          <form @submit.prevent="confirmReject">
            <div class="form-group">
              <label>ALASAN PENOLAKAN:</label>
              <textarea v-model="rejectReason" rows="3" required placeholder="Contoh: Maaf ya, saya baru saja mendapatkan penawaran lain..."></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-neo-outline" @click="closeReject">Batal</button>
              <button type="submit" class="btn-neo-reject">Tolak Sekarang</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

const incoming = ref([])
const outgoing = ref([])
const acceptedTrades = ref([])
const rejectId = ref(null)
const rejectReason = ref('')
const placeholderImage = 'https://via.placeholder.com/60/cccccc/000?text=Item'
const defaultAvatar = 'https://via.placeholder.com/40/cccccc/000?text=User'

const sidebarTabs = [
  { key: 'overview', label: 'Overview', icon: 'fas fa-grid' },
  { key: 'inventory', label: 'Inventory', icon: 'fas fa-grid' },
  { key: 'trades', label: 'Active Trades', icon: 'fas fa-comment' },
  { key: 'history', label: 'History', icon: 'fas fa-history' },
]

const navigateTo = (tab) => {
  if (tab.key === 'inventory' || tab.key === 'overview' || tab.key === 'history') {
    router.push('/my-items')
  }
}

const fetchTrades = async () => {
  try {
    const resIn = await api.get('/trades/incoming')
    incoming.value = resIn.data
    const resOut = await api.get('/trades/outgoing')
    outgoing.value = resOut.data
    // simulate accepted from incoming yang status 'accepted'
    acceptedTrades.value = incoming.value.filter(t => t.status === 'accepted').slice(0, 3)
  } catch (err) {
    toast.error('Gagal memuat data transaksi')
  }
}

const acceptTrade = async (id) => {
  try {
    await api.put(`/trades/${id}`, { status: 'accepted' })
    toast.success('Permintaan diterima!')
    await fetchTrades()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menerima')
  }
}

const openReject = (id) => {
  rejectId.value = id
  rejectReason.value = ''
}
const closeReject = () => {
  rejectId.value = null
}
const confirmReject = async () => {
  try {
    await api.put(`/trades/${rejectId.value}`, { status: 'rejected' })
    toast.success('Permintaan ditolak')
    await fetchTrades()
    closeReject()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menolak')
  }
}

const cancelTrade = async (id) => {
  if (confirm('Batalkan permintaan keluar ini?')) {
    try {
      await api.put(`/trades/${id}`, { status: 'cancelled' })
      toast.info('Permintaan dibatalkan')
      await fetchTrades()
    } catch (err) {
      toast.error('Gagal membatalkan')
    }
  }
}

const statusClass = (status) => {
  return {
    pending: 'bg-yellow',
    accepted: 'bg-green',
    rejected: 'bg-red',
    cancelled: 'bg-gray'
  }[status?.toLowerCase()] || 'bg-gray'
}

onMounted(fetchTrades)
</script>

<style scoped src="../assets/trades.css"></style>
