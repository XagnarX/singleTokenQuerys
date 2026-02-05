<template>
  <div class="dashboard-container">
    <div class="header">
      <h1 class="title">Dashboard</h1>
      <a-button type="primary" @click="showCreateModal">
        <template #icon><icon-plus /></template>
        Create Session
      </a-button>
    </div>

    <!-- Session Grid -->
    <div class="grid-container">
      <div 
        v-for="session in sessions" 
        :key="session.id" 
        class="session-cell"
        @click="openSession(session.id)"
      >
        <div class="delete-btn" @click.stop="handleDelete(session)">
          <icon-delete />
        </div>
        <div class="cell-content">
          <div class="token-name">{{ session.contractAddress || session.tokenMark || 'No Address' }}</div>
          <a-divider style="margin: 12px 0; border-color: rgba(255,255,255,0.2);" />
          
          <div class="stat-row">
            <span class="label">收到 (Received):</span>
            <span class="value text-highlight-red">{{ session.buyCount || 0 }}</span>
          </div>
          
          <div class="stat-row">
            <span class="label">支出 (Sent):</span>
            <span class="value">{{ session.sellCount || 0 }}</span>
          </div>
          
          <div class="stat-row">
            <span class="label">总金额 (Total Amount):</span>
            <span class="value">{{ formatAmount(session.totalAmount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Session Modal -->
    <a-modal v-model:visible="visible" title="Create New Session" @ok="handleCreate">
      <a-form :model="form">
        <a-form-item field="name" label="Session Name">
          <a-input v-model="form.name" placeholder="e.g. BTC Monitoring" />
        </a-form-item>
        <a-form-item field="tokenMark" label="Token (币种)">
          <a-input v-model="form.tokenMark" placeholder="e.g. BTC" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconPlus, IconDelete } from '@arco-design/web-vue/es/icon'
import { Message, Modal } from '@arco-design/web-vue'

const router = useRouter()
const visible = ref(false)
const sessions = ref<any[]>([])
const form = ref({ name: '', tokenMark: '' })

const loadSessions = () => {
  const stored = localStorage.getItem('tokanA_sessions')
  if (stored) {
    sessions.value = JSON.parse(stored)
  }
}

const showCreateModal = () => {
  form.value = { name: '', tokenMark: '' }
  visible.value = true
}

const handleCreate = () => {
  if (!form.value.name) {
    Message.error('Please enter a session name')
    return
  }
  
  const newSession = {
    id: Date.now().toString(),
    name: form.value.name,
    tokenMark: form.value.tokenMark,
    count: 0,
    totalAmount: 0,
    createdAt: new Date().toISOString()
  }
  
  sessions.value.push(newSession)
  localStorage.setItem('tokanA_sessions', JSON.stringify(sessions.value))
  
  // Also initialize the config for this session in saved_configs map
  // We'll simulate this by just letting the analysis page handle defaults for unknown IDs
  
  visible.value = false
  Message.success('Session Created')
}

const openSession = (id: string) => {
  // Open in new tab
  const route = router.resolve({ name: 'TokenFilterAnalysis', params: { sessionId: id } })
  window.open(route.href, '_blank')
}

const handleDelete = (session: any) => {
  Modal.warning({
    title: 'Delete Session',
    content: `Are you sure you want to delete "${session.name}"? This cannot be undone.`,
    hideCancel: false,
    onOk: () => {
      // Remove from list
      sessions.value = sessions.value.filter(s => s.id !== session.id)
      localStorage.setItem('tokanA_sessions', JSON.stringify(sessions.value))
      // Remove session data
      localStorage.removeItem(`tokanA_session_data_${session.id}`)
      Message.success('Session deleted')
    }
  })
}

const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'tokanA_sessions') {
    loadSessions()
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    loadSessions()
  }
}

const formatAmount = (val: number) => {
  return val ? Math.floor(val).toLocaleString() : '0'
}

onMounted(() => {
  loadSessions()
  window.addEventListener('storage', handleStorageChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 40px;
  background-color: #000;
  min-height: 100vh;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, 180px); // High density
  gap: 0; // No gap
}

.session-cell {
  background: #1a1a1a;
  border: 2px solid #555; // Stronger border
  width: 100%; // Fill grid column
  box-sizing: border-box; // Include padding/border in width
  height: 180px; 
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    
    .delete-btn {
      opacity: 1;
    }
  }
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #ff4d4f; // Red color for delete
  opacity: 0;
  transition: opacity 0.2s;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  &:hover {
    background-color: rgba(255, 77, 79, 0.1);
  }
}

.cell-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 18px; // Smaller title
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px; 
  font-size: 13px; // Smaller details

  
  .label {
    color: #aaa;
  }
  
  .value {
    font-weight: 500;
  }
}
</style>
