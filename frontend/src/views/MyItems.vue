<template>
  <div class="my-items-page">
    <!-- ===== SIDEBAR ===== -->
    <div class="sidebar">
      <div class="profile-card">
        <div class="avatar-wrapper" @click="changeAvatar">
          <img
            :src="authStore.user?.avatar || defaultAvatar"
            :key="authStore.user?.avatar || defaultAvatar"
            class="profile-avatar"
            @error="e => e.target.src = defaultAvatar"
          />
          <div class="avatar-overlay"><i class="fas fa-camera"></i></div>
        </div>
        <h3>{{ authStore.user?.fullname || authStore.user?.username || 'Trader' }}</h3>
        <div class="verified-badge"><i class="fas fa-shield-alt"></i> Verified Member</div>
        <!-- Tombol Edit Profil -->
        <button class="btn-edit-profile" @click="openProfileModal">
          <i class="fas fa-user-edit"></i> Edit Profil
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="tab in sidebarTabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="sidebar-btn"
          :class="{ active: activeTab === tab.key }"
        >
          <i :class="tab.icon"></i> {{ tab.label }}
        </button>
      </nav>

      <button class="btn-new-trade" @click="activeTab = 'inventory'">NEW TRADE</button>
    </div>

    <!-- ===== MAIN CONTENT ===== -->
    <div class="main-content">
      <div class="top-bar">
        <div>
          <h1>BARANG SAYA</h1>
          <p>{{ tabDescriptions[activeTab] || '' }}</p>
        </div>
        <div class="top-actions">
          <button v-if="activeTab === 'inventory'" class="btn-add" @click="openForm()">
            <i class="fas fa-plus"></i> Tambah Barang
          </button>
          <button
            v-if="activeTab === 'inventory' && inventoryItems.length > 0"
            class="btn-reset"
            @click="resetAllItems"
          >
            <i class="fas fa-trash-alt"></i> Reset Semua
          </button>
        </div>
      </div>

      <!-- ===== TAB: OVERVIEW ===== -->
      <div v-if="activeTab === 'overview'" class="overview-section">
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-number">{{ availableItemsCount }}</span>
            <span class="stat-label">Total Items</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ completedTradesCount }}</span>
            <span class="stat-label">Completed Trades</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ inventoryItems.length }}</span>
            <span class="stat-label">Active + Traded</span>
          </div>
        </div>

        <!-- Aktivitas Terbaru -->
        <div class="recent-activity">
          <h3><i class="fas fa-clock"></i> Aktivitas Terbaru</h3>
          <div v-if="recentActivity.length === 0" class="empty-activity">
            <p>Belum ada aktivitas.</p>
          </div>
          <div v-else v-for="act in recentActivity" :key="act.id" class="activity-item">
            <span class="activity-icon"><i :class="act.icon"></i></span>
            <div>
              <p class="activity-text">{{ act.text }}</p>
              <span class="activity-time">{{ formatDate(act.time) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB: INVENTORY ===== -->
      <div v-if="activeTab === 'inventory'" class="inventory-grid">
        <div v-for="item in inventoryItems" :key="item.id" class="item-card-inv">
          <div class="card-img">
            <img :src="item.image_url || placeholderImage" @error="handleImageError" />
            <span class="status-badge" :class="{
              'bg-available': item.status === 'available',
              'bg-traded': item.status === 'traded'
            }">
              {{ item.status === 'available' ? 'AVAILABLE' : 'TRADED' }}
            </span>
          </div>
          <div class="card-content">
            <h3>{{ item.name }}</h3>
            <p class="meta">{{ item.category || 'Umum' }} • {{ item.condition || '-' }}</p>
            <p class="desc">{{ item.description || 'Tidak ada deskripsi' }}</p>

            <div class="actions">
              <template v-if="item.status === 'available'">
                <button class="btn-edit" @click="openForm(item)"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-delete" @click="deleteItem(item.id)"><i class="fas fa-trash"></i> Hapus</button>
              </template>
              <template v-else-if="item.status === 'traded'">
                <button class="btn-archived" disabled>🔒 Archived</button>
              </template>
            </div>
          </div>
        </div>
        <div v-if="inventoryItems.length === 0" class="empty-state-inv">
          <p>Belum ada barang tersedia atau ditukar.</p>
        </div>
        <div v-if="inventoryItems.length >= 9" class="limit-notice">
          <i class="fas fa-info-circle"></i> Maksimal 9 barang aktif. Item tertua akan otomatis terhapus saat menambah barang baru.
        </div>
      </div>

      <!-- ===== TAB: ACTIVE TRADES ===== -->
      <div v-if="activeTab === 'trades'" class="trades-tab">
        <div class="trades-header">
          <h2><i class="fas fa-handshake"></i> Barter Requests</h2>
          <p class="subhead">Manage your exchanges. Be direct, be fair, and keep the rebellion alive.</p>
          <p class="limit-notice"><i class="fas fa-info-circle"></i> Maksimal 5 permintaan masuk dan 5 keluar. Transaksi yang paling lama akan otomatis terhapus.</p>
        </div>

        <div class="two-col-trades">
          <!-- Kolom Kiri: Permintaan Masuk -->
          <div class="trade-col">
            <h3><i class="fas fa-download"></i> Permintaan Masuk <span class="badge-count">{{ incomingTrades.length }}/5</span></h3>
            <div v-if="incomingTrades.length === 0" class="empty-placeholder">Tidak ada permintaan masuk.</div>
            <div v-else v-for="t in incomingTrades" :key="t.id" class="trade-card">
              <div class="trade-header">
                <div class="sender-info">
                  <img
                    :src="t.offered_by_avatar || defaultAvatar"
                    class="avatar-sm"
                    @error="e => e.target.src = defaultAvatar"
                  />
                  <span class="sender-name">@{{ t.offered_by_username || 'User' }}</span>
                  <span class="time">{{ formatDate(t.created_at) }}</span>
                </div>
                <span class="status-pill" :class="statusClass(t.status)">{{ t.status }}</span>
              </div>

              <div class="swap-items">
                <div class="item-block">
                  <span class="label">THEIR ITEM</span>
                  <div class="item-detail">
                    <img
                      :src="t.offered_item_image || placeholderImage"
                      @error="handleImageError"
                      alt="Gambar barang"
                    />
                    <div>
                      <strong>{{ t.offered_item_name }}</strong>
                      <p>{{ t.offered_item_desc || '' }}</p>
                    </div>
                  </div>
                </div>
                <div class="swap-arrow"><i class="fas fa-arrow-right"></i></div>
                <div class="item-block">
                  <span class="label">YOUR ITEM</span>
                  <div class="item-detail">
                    <img
                      :src="t.requested_item_image || placeholderImage"
                      @error="handleImageError"
                      alt="Gambar barang"
                    />
                    <div>
                      <strong>{{ t.requested_item_name }}</strong>
                      <p>{{ t.requested_item_desc || '' }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="t.status === 'pending'" class="action-buttons">
                <button class="btn-accept" @click="acceptTrade(t.id)"><i class="fas fa-check"></i> Terima</button>
                <button class="btn-reject" @click="openReject(t.id)"><i class="fas fa-times"></i> Tolak</button>
              </div>
              <div v-else class="status-message">
                <span>{{ t.status === 'accepted' ? '✅ Diterima' : '❌ Ditolak' }}</span>
              </div>

              <!-- Tombol Kontak jika accepted -->
              <div v-if="t.status === 'accepted'" class="contact-button">
                <button class="btn-contact" @click="showContact(t.id)">
                  <i class="fas fa-phone"></i> Lihat Kontak
                </button>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Permintaan Keluar -->
          <div class="trade-col">
            <h3><i class="fas fa-upload"></i> Permintaan Keluar <span class="badge-count">{{ outgoingTrades.length }}/5</span></h3>
            <div v-if="outgoingTrades.length === 0" class="empty-placeholder">Tidak ada permintaan keluar.</div>
            <div v-else v-for="t in outgoingTrades" :key="t.id" class="trade-card">
              <div class="trade-header">
                <div class="sender-info">
                  <img
                    :src="t.requested_by_avatar || defaultAvatar"
                    class="avatar-sm"
                    @error="e => e.target.src = defaultAvatar"
                  />
                  <span class="sender-name">Request to @{{ t.requested_by_username || 'User' }}</span>
                  <span class="time">{{ formatDate(t.created_at) }}</span>
                </div>
                <span class="status-pill" :class="statusClass(t.status)">{{ t.status }}</span>
              </div>

              <div class="swap-items simple">
                <div class="item-block">
                  <span class="label">YOU OFFER</span>
                  <div class="item-detail">
                    <img
                      :src="t.offered_item_image || placeholderImage"
                      @error="handleImageError"
                      alt="Gambar barang"
                    />
                    <div><strong>{{ t.offered_item_name }}</strong></div>
                  </div>
                </div>
                <div class="swap-arrow"><i class="fas fa-arrow-right"></i></div>
                <div class="item-block">
                  <span class="label">YOU WANT</span>
                  <div class="item-detail">
                    <img
                      :src="t.requested_item_image || placeholderImage"
                      @error="handleImageError"
                      alt="Gambar barang"
                    />
                    <div><strong>{{ t.requested_item_name }}</strong></div>
                  </div>
                </div>
              </div>

              <div v-if="t.status === 'pending'" class="action-buttons">
                <button class="btn-cancel" @click="cancelTrade(t.id)">Cancel Request</button>
              </div>
              <div v-else-if="t.status === 'rejected'" class="reject-reason">
                <span>Reason: "{{ t.reason || 'Maaf, belum cocok.' }}"</span>
              </div>
              <div v-else class="status-message">
                <span>{{ t.status === 'accepted' ? '✅ Diterima' : '❌ Ditolak' }}</span>
              </div>

              <!-- Tombol Kontak jika accepted -->
              <div v-if="t.status === 'accepted'" class="contact-button">
                <button class="btn-contact" @click="showContact(t.id)">
                  <i class="fas fa-phone"></i> Lihat Kontak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB: HISTORY ===== -->
      <div v-if="activeTab === 'history'" class="history-tab">
        <div class="history-header">
          <h2><i class="fas fa-history"></i> Barter History Log</h2>
          <button class="btn-reset" @click="resetHistory" v-if="historyTrades.length > 0">
            <i class="fas fa-undo"></i> Reset Default
          </button>
        </div>

        <div v-if="historyTrades.length === 0" class="empty-history">
          <i class="fas fa-history"></i>
          <h4>Belum Ada Riwayat</h4>
          <p>Anda belum memiliki transaksi barter histori.</p>
        </div>
        <div v-else v-for="t in historyTrades" :key="t.id" class="history-item">
          <div class="history-status">
            <span class="badge-status completed"><i class="fas fa-check"></i> Selesai</span>
            <span class="history-date">{{ formatDate(t.updated_at || t.created_at) }}</span>
          </div>
          <div class="history-desc">
            Anda menukar <strong>{{ getYourItemName(t) }}</strong> dengan <strong>{{ getTheirItemName(t) }}</strong>
            milik <strong>{{ getOtherUser(t) }}</strong>.
          </div>
          <div class="history-ref">Ref ID: #{{ t.id }}</div>
        </div>
      </div>

      <!-- ===== MODAL TAMBAH/EDIT BARANG ===== -->
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal-box form-modal">
          <div class="modal-header">
            <h3>{{ editing ? 'Edit Barang Barter' : 'Tambah Barang Barter' }}</h3>
            <button class="modal-close" @click="closeForm"><i class="fas fa-times"></i></button>
          </div>
          <form @submit.prevent="saveItem">
            <div class="form-group">
              <label>NAMA BARANG:</label>
              <input type="text" v-model="form.name" required placeholder="Contoh: Mechanical Keyboard Vintage" />
            </div>
            <div class="row-2">
              <div>
                <label>KATEGORI:</label>
                <input type="text" v-model="form.category" list="categoryOptions" placeholder="Ketik sendiri atau pilih" />
                <datalist id="categoryOptions">
                  <option value="ELEKTRONIK">Elektronik</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="OTOMOTIF">Otomotif</option>
                  <option value="PAKAIAN">Pakaian</option>
                  <option value="PERTANIAN">Pertanian</option>
                </datalist>
              </div>
              <div>
                <label>KONDISI:</label>
                <select v-model="form.condition">
                  <option value="Baru">Baru</option>
                  <option value="Bekas Bagus">Bekas Bagus</option>
                  <option value="Bekas Cukup">Bekas Cukup</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>DESKRIPSI:</label>
              <textarea v-model="form.description" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label>GAMBAR (upload):</label>
              <input type="file" @change="handleFileUpload" accept="image/*" class="form-control" />
              <div v-if="form.image_url" class="preview-img">
                <img :src="form.image_url" alt="Preview" />
                <button type="button" @click="form.image_url = ''" class="remove-img">✕</button>
              </div>
              <small v-if="uploading" class="text-muted">Mengupload...</small>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-neo-outline" @click="closeForm">Batal</button>
              <button type="submit" class="btn-neo" :disabled="uploading">Simpan Barang</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ===== MODAL EDIT PROFIL ===== -->
      <div v-if="showProfileModal" class="modal-overlay" @click.self="closeProfileModal">
        <div class="modal-box profile-modal">
          <div class="modal-header">
            <h3><i class="fas fa-user-cog"></i> Edit Profil</h3>
            <button class="modal-close" @click="closeProfileModal"><i class="fas fa-times"></i></button>
          </div>
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label>USERNAME</label>
              <input type="text" v-model="editProfile.username" required />
            </div>
            <div class="form-group">
              <label>NAMA LENGKAP</label>
              <input type="text" v-model="editProfile.fullname" required />
            </div>
            <div class="form-group">
              <label>NO. TELEPON</label>
              <input type="text" v-model="editProfile.phone" />
            </div>
            <div class="form-group">
              <label>ALAMAT</label>
              <textarea v-model="editProfile.address" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>FOTO PROFIL (upload)</label>
              <input type="file" @change="handleAvatarUpload" accept="image/*" class="form-control" />
              <div v-if="editProfile.avatar" class="preview-img">
                <img :src="editProfile.avatar" alt="Avatar Preview" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-neo-outline" @click="closeProfileModal">Batal</button>
              <button type="submit" class="btn-neo" :disabled="profileLoading">Simpan Profil</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ===== MODAL KONTAK ===== -->
      <div v-if="showContactModal" class="modal-overlay" @click.self="closeContactModal">
        <div class="modal-box contact-modal">
          <div class="modal-header">
            <h3><i class="fas fa-address-card"></i> Kontak Pihak Terkait</h3>
            <button class="modal-close" @click="closeContactModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body" v-if="contactData">
            <div class="contact-card">
              <h4><i class="fas fa-user-circle"></i> {{ contactData.username }}</h4>
              <p><i class="fas fa-phone"></i> {{ contactData.phone || 'Tidak tersedia' }}</p>
              <p><i class="fas fa-envelope"></i> {{ contactData.email || 'Tidak tersedia' }}</p>
              <p><i class="fas fa-map-marker-alt"></i> {{ contactData.address || 'Tidak tersedia' }}</p>
            </div>
            <p class="contact-hint"><i class="fas fa-info-circle"></i> Hubungi pihak terkait untuk mengatur pertukaran barang.</p>
            <div v-if="contactData.phone" class="whatsapp-button">
              <a
                :href="`https://wa.me/${contactData.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(contactData.username)}%2C%20saya%20tertarik%20untuk%20bertukar%20barang%20melalui%20BarterYuk`"
                target="_blank"
                class="btn-whatsapp"
              >
                <i class="fab fa-whatsapp"></i> Hubungi via WhatsApp
              </a>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-neo-outline" @click="closeContactModal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useItemsStore } from '../stores/items'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import { useToast } from 'vue-toastification'

const itemsStore = useItemsStore()
const authStore = useAuthStore()
const toast = useToast()
const route = useRoute()

// ===== STATE =====
const myItems = ref([])
const activeTab = ref('overview')
const showForm = ref(false)
const editing = ref(false)
const profileLoading = ref(false)
const uploading = ref(false)
const placeholderImage = 'https://placehold.co/60x60/cccccc/000?text=No+Image'
const defaultAvatar = 'https://placehold.co/80x80/cccccc/000?text=User'

const incomingTrades = ref([])
const outgoingTrades = ref([])
const rejectId = ref(null)
const rejectReason = ref('')
const showContactModal = ref(false)
const contactData = ref(null)

const showProfileModal = ref(false)
const editProfile = reactive({
  username: '',
  fullname: '',
  phone: '',
  address: '',
  avatar: null
})

// ===== COMPUTED =====
const inventoryItems = computed(() => {
  return myItems.value.filter(item => item.status === 'available' || item.status === 'traded')
})

const availableItemsCount = computed(() => {
  return myItems.value.filter(item => item.status === 'available').length
})

const completedTradesCount = computed(() => {
  return incomingTrades.value.filter(t => t.status === 'accepted' || t.status === 'completed').length
})

const recentActivity = computed(() => {
  const activities = []
  const recentItems = myItems.value.slice(0, 5).map(item => ({
    id: 'item-' + item.id,
    icon: 'fas fa-plus-circle',
    text: `Menambahkan barang "${item.name}"`,
    time: item.created_at
  }))
  const recentTrades = incomingTrades.value.slice(0, 3).map(t => ({
    id: 'trade-' + t.id,
    icon: 'fas fa-handshake',
    text: `Permintaan barter dari @${t.offered_by_username}`,
    time: t.created_at
  }))
  return [...recentItems, ...recentTrades].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)
})

const historyTrades = computed(() => {
  return incomingTrades.value.filter(t => t.status === 'accepted' || t.status === 'completed')
})

// ===== SIDEBAR TABS =====
const sidebarTabs = [
  { key: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
  { key: 'inventory', label: 'Inventory', icon: 'fas fa-grid' },
  { key: 'trades', label: 'Active Trades', icon: 'fas fa-comment' },
  { key: 'history', label: 'History', icon: 'fas fa-history' },
]

const tabDescriptions = {
  overview: 'Kelola profil dan pengaturan akun Anda.',
  inventory: 'Kelola koleksi barang barter kamu di sini.',
  trades: 'Pantau dan kelola permintaan barter aktif.',
  history: 'Riwayat transaksi barter yang sudah selesai.'
}

// ===== FETCH DATA =====
const fetchItems = async () => {
  await itemsStore.fetchMyItems()
  myItems.value = itemsStore.myItems
}

const fetchTrades = async () => {
  try {
    const resIn = await api.get('/trades/incoming')
    incomingTrades.value = resIn.data
    const resOut = await api.get('/trades/outgoing')
    outgoingTrades.value = resOut.data
  } catch (err) {
    toast.error('Gagal memuat data transaksi')
  }
}

const fetchProfile = () => {
  const user = authStore.user
  if (user) {
    editProfile.username = user.username || ''
    editProfile.fullname = user.fullname || ''
    editProfile.phone = user.phone || ''
    editProfile.address = user.address || ''
    editProfile.avatar = user.avatar || null
  }
}

// ===== IMAGE ERROR FALLBACK =====
const handleImageError = (e) => {
  e.target.src = placeholderImage
}

// ===== UPLOAD FILE =====
const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  try {
    uploading.value = true
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data.imageUrl
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal upload gambar')
    return null
  } finally {
    uploading.value = false
  }
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const url = await uploadFile(file)
  if (url) {
    form.image_url = url
  }
  e.target.value = ''
}

const handleAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const url = await uploadFile(file)
  if (url) {
    editProfile.avatar = url
  }
  e.target.value = ''
}

// ===== UPDATE PROFILE =====
const updateProfile = async () => {
  profileLoading.value = true
  try {
    const res = await api.put('/auth/profile', {
      username: editProfile.username,
      fullname: editProfile.fullname,
      phone: editProfile.phone,
      address: editProfile.address,
      avatar: editProfile.avatar
    })
    if (res.data.user) {
      authStore.user = { ...authStore.user, ...res.data.user }
      toast.success('Profil berhasil diperbarui!')
      closeProfileModal()
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal update profil')
  } finally {
    profileLoading.value = false
  }
}

const openProfileModal = () => {
  fetchProfile()
  showProfileModal.value = true
}

const closeProfileModal = () => {
  showProfileModal.value = false
}

// ===== RESET & DELETE =====
const resetAllItems = async () => {
  if (!confirm('⚠️ ANDA YAKIN INGIN MENGHAPUS SEMUA BARANG?\n\nTindakan ini tidak dapat dibatalkan!')) return
  if (!confirm('Konfirmasi ulang: Hapus SEMUA barang Anda (termasuk yang sudah ditukar)?')) return
  try {
    const res = await api.delete('/items/reset')
    toast.success(res.data.message || 'Semua barang berhasil dihapus permanen!')
    await fetchItems()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal reset barang')
  }
}

const deleteItem = async (id) => {
  const item = myItems.value.find(i => i.id === id)
  if (item?.status === 'traded') {
    toast.warning('Barang sudah ditukar, tidak dapat dihapus')
    return
  }
  if (!confirm(`Yakin hapus "${item?.name}" secara permanen?`)) return
  try {
    await api.delete(`/items/${id}`)
    toast.success('Barang berhasil dihapus permanen')
    await fetchItems()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menghapus barang')
  }
}

// ===== INVENTORY CRUD =====
const form = reactive({
  id: null,
  name: '',
  category: '',
  condition: 'Bekas Bagus',
  description: '',
  image_url: '',
  status: 'available'
})

const openForm = (item = null) => {
  if (item) {
    editing.value = true
    Object.assign(form, item)
  } else {
    editing.value = false
    form.id = null
    form.name = ''
    form.category = ''
    form.condition = 'Bekas Bagus'
    form.description = ''
    form.image_url = ''
    form.status = 'available'
  }
  showForm.value = true
}

const closeForm = () => { showForm.value = false }

const saveItem = async () => {
  if (!form.name) {
    toast.error('Nama barang wajib')
    return
  }
  try {
    if (editing.value) {
      await itemsStore.updateItem(form.id, {
        name: form.name,
        category: form.category,
        condition: form.condition,
        description: form.description,
        image_url: form.image_url,
        status: form.status
      })
      toast.success('Barang diperbarui!')
    } else {
      await itemsStore.createItem({
        name: form.name,
        category: form.category,
        condition: form.condition,
        description: form.description,
        image_url: form.image_url
      })
      toast.success('Barang ditambahkan!')
    }
    closeForm()
    await fetchItems()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan')
  }
}

// ===== TRADE ACTIONS =====
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
const closeReject = () => { rejectId.value = null }
const confirmReject = async () => {
  try {
    await api.put(`/trades/${rejectId.value}`, { status: 'rejected', reason: rejectReason.value })
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

const resetHistory = () => {
  if (confirm('Reset riwayat? Data akan dikembalikan ke default.')) {
    fetchTrades()
    toast.info('Riwayat di-reset (simulasi)')
  }
}

// ===== KONTAK =====
const showContact = async (tradeId) => {
  try {
    const res = await api.get(`/trades/${tradeId}/contact`)
    contactData.value = res.data.contact
    showContactModal.value = true
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal mengambil kontak')
  }
}

const closeContactModal = () => {
  showContactModal.value = false
  contactData.value = null
}

// ===== UTILITY =====
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getOtherUser = (trade) => {
  if (trade.offered_by === authStore.user?.id) {
    return trade.requested_by_username || 'User'
  } else {
    return trade.offered_by_username || 'User'
  }
}

const getYourItemName = (trade) => {
  if (trade.offered_by === authStore.user?.id) {
    return trade.offered_item_name || 'Barang Anda'
  } else {
    return trade.requested_item_name || 'Barang Anda'
  }
}

const getTheirItemName = (trade) => {
  if (trade.offered_by === authStore.user?.id) {
    return trade.requested_item_name || 'Barang Mereka'
  } else {
    return trade.offered_item_name || 'Barang Mereka'
  }
}

const statusClass = (status) => {
  const map = {
    pending: 'bg-yellow',
    accepted: 'bg-green',
    rejected: 'bg-red',
    cancelled: 'bg-gray',
    completed: 'bg-green'
  }
  return map[status?.toLowerCase()] || 'bg-gray'
}

// ===== WATCH & LIFECYCLE =====
watch(() => route.query.tab, (newTab) => {
  if (newTab && ['overview', 'inventory', 'trades', 'history'].includes(newTab)) {
    activeTab.value = newTab
  }
}, { immediate: true })

onMounted(async () => {
  const tabParam = route.query.tab
  if (tabParam && ['overview', 'inventory', 'trades', 'history'].includes(tabParam)) {
    activeTab.value = tabParam
  }
  await Promise.all([fetchItems(), fetchTrades()])
  fetchProfile()
})
</script>

<style scoped src="../assets/myitems.css"></style>
