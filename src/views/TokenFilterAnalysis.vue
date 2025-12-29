<template>
  <div class="token-filter-analysis">
    <div class="page-header">
      <h1>Token Filter Analysis</h1>
    </div>

    <a-form layout="inline" :model="searchParams" class="search-form">
      <a-form-item label="Contract Address" required>
        <a-input v-model="searchParams.contractAddress" placeholder="Enter token contract address" style="width: 420px;" allow-clear />
      </a-form-item>
    </a-form>

    <!-- The New Feature: Block Stepping -->
    <a-card class="stepping-card" title="Block Stepping (The New Feature)">
      <a-space>
        <a-input-number v-model="stepSize" :min="1" placeholder="Step Size" style="width: 150px;">
          <template #prefix>Step Size</template>
        </a-input-number>
        <a-button type="secondary" @click="prevStep">
          <template #icon><icon-left /></template> Prev Step
        </a-button>
        <a-button type="primary" @click="nextStep">
          Next Step <template #icon><icon-right /></template>
        </a-button>
      </a-space>
    </a-card>

    <!-- The New Feature: History Log -->
    <a-card class="history-card" title="Query History (The New Feature)" v-if="historyRecords.length > 0">
      <template #extra>
        <a-button type="text" status="danger" size="small" @click="clearHistory">Clear History</a-button>
      </template>
      <a-table :data="historyRecords" :pagination="{ pageSize: 5 }" size="small" :bordered="false">
        <template #columns>
          <a-table-column title="Time" data-index="time" :width="160" />
          <a-table-column title="Range" data-index="range" />
          <a-table-column title="Buy (Count / Amount)" :width="180">
            <template #cell="{ record }">
               <div>Count: {{ record.buyCount }}</div>
               <div>Amt: {{ record.buyTotal }}</div>
            </template>
          </a-table-column>
          <a-table-column title="Sell (Count / Amount)" :width="180">
            <template #cell="{ record }">
               <div>Count: {{ record.sellCount }}</div>
               <div>Amt: {{ record.sellTotal }}</div>
            </template>
          </a-table-column>
          <a-table-column title="Net Flow" data-index="netFlow">
            <template #cell="{ record }">
              <span :style="{ color: record.netAmount >= 0 ? '#00b42a' : '#f53f3f' }">{{ record.netFlow }}</span>
            </template>
          </a-table-column>
          <a-table-column title="Action" :width="80">
            <template #cell="{ record }">
               <a-button type="text" status="danger" size="mini" @click="removeHistory(record.id)"><icon-delete /></a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-form layout="inline" :model="searchParams" class="filter-form">
      <a-form-item label="Start Block">
        <a-input-number v-model="searchParams.startBlock" placeholder="Start block" :min="0" style="width: 140px;" @change="hasStartedPolling = false" />
      </a-form-item>
      <a-form-item label="End Block">
        <a-input-number v-model="searchParams.endBlock" placeholder="End block" :min="0" style="width: 140px;" @change="hasStartedPolling = false" />
      </a-form-item>
      <a-form-item label="Min Amount">
        <a-input-number v-model="searchParams.minAmount" placeholder="Min amount" :min="0" style="width: 140px;" />
      </a-form-item>
      <a-form-item label="Max Amount">
        <a-input-number v-model="searchParams.maxAmount" placeholder="Max amount" :min="0" style="width: 140px;" />
      </a-form-item>
      <a-form-item label="Decimals">
        <a-input-number v-model="searchParams.decimals" :min="0" :max="36" placeholder="Decimals" style="width: 100px;" />
      </a-form-item>
      <a-form-item label="Limit">
        <a-input-number v-model="searchParams.limit" :min="1" placeholder="Limit" style="width: 100px;" />
      </a-form-item>
      <a-form-item label="Refresh(s)">
        <a-input-number v-model="refreshInterval" :min="5" placeholder="Refresh interval" style="width: 100px;" />
      </a-form-item>
      <a-form-item>
        <a-checkbox v-model="isAutoStep">Auto Increase</a-checkbox>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="togglePolling">{{ getPollingButtonText() }}</a-button>
      </a-form-item>
    </a-form>

    <a-space class="action-bar">
      <a-button :type="currentView === 'all' ? 'primary' : 'secondary'" size="small" @click="viewAllData">View All Data</a-button>
    </a-space>

    <a-card class="address-card">
      <template #title>Buy Address Filter</template>
      <template #extra>
        <a-space>
          <a-tag color="green" size="large">Buy Total: {{ buyTotalAmount }}</a-tag>
          <a-button type="primary" size="small" @click="fetchAllBuyAddresses">Query All Buy</a-button>
        </a-space>
      </template>
      <a-space direction="vertical" style="width: 100%;">
        <div v-for="(pair, index) in buyAddresses" :key="'buy-' + index" class="address-row">
          <a-input v-model="pair.from" placeholder="FROM address" class="address-input" />
          <a-input v-model="pair.to" placeholder="TO address" class="address-input" />
          <a-button @click="viewRowData('buy', index)" :type="currentView === 'buy-' + index ? 'primary' : 'secondary'" size="small">
            {{ pair.loading ? 'Loading...' : 'Query & View' }}
          </a-button>
          <a-button v-if="buyAddresses.length > 1" @click="removeBuyAddress(index)" status="danger" size="small">Remove</a-button>
        </div>
        <a-button @click="addBuyAddress" type="dashed" block><icon-plus /> Add Buy Address</a-button>
      </a-space>
    </a-card>

    <a-card class="address-card">
      <template #title>Sell Address Filter</template>
      <template #extra>
        <a-space>
          <a-tag color="red" size="large">Sell Total: {{ sellTotalAmount }}</a-tag>
          <a-button type="primary" size="small" @click="fetchAllSellAddresses">Query All Sell</a-button>
        </a-space>
      </template>
      <a-space direction="vertical" style="width: 100%;">
        <div v-for="(pair, index) in sellAddresses" :key="'sell-' + index" class="address-row">
          <a-input v-model="pair.from" placeholder="FROM address" class="address-input" />
          <a-input v-model="pair.to" placeholder="TO address" class="address-input" />
          <a-button @click="viewRowData('sell', index)" :type="currentView === 'sell-' + index ? 'primary' : 'secondary'" size="small">
            {{ pair.loading ? 'Loading...' : 'Query & View' }}
          </a-button>
          <a-button v-if="sellAddresses.length > 1" @click="removeSellAddress(index)" status="danger" size="small">Remove</a-button>
        </div>
        <a-button @click="addSellAddress" type="dashed" block><icon-plus /> Add Sell Address</a-button>
      </a-space>
    </a-card>

    <a-card class="summary-card">
      <a-descriptions :column="1" size="small">
        <a-descriptions-item label="Net Flow">
          <a-tag :color="netAmount >= 0 ? 'green' : 'red'" size="large">{{ netAmount >= 0 ? '+' : '' }}{{ netAmountDisplay }} - Total</a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-table v-if="transactions.length > 0" :columns="columns" :data="transactions" :pagination="false" row-key="tx_hash" class="transaction-table">
      <template #tx_hash="{ record }">
        <a-space>
          <a-link :href="'https://bscscan.com/tx/' + record.tx_hash" target="_blank">{{ shortHash(record.tx_hash) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.tx_hash)"><icon-copy /></a-button>
        </a-space>
      </template>
      <template #from_address="{ record }">
        <a-space>
          <template v-if="record.from_address_tag"><a-tag color="blue" size="small">{{ record.from_address_tag }}</a-tag></template>
          <template v-else><a-link :href="'https://bscscan.com/address/' + record.from_address" target="_blank">{{ shortHash(record.from_address) }}</a-link></template>
          <a-button type="text" size="mini" @click="copyToClipboard(record.from_address)"><icon-copy /></a-button>
          <a-button type="text" size="mini" @click="showTagModal(record.from_address)"><icon-tag /></a-button>
          <a-button type="text" size="mini" @click="showRecordDetail(record, 'from')"><icon-eye /></a-button>
        </a-space>
      </template>
      <template #to_address="{ record }">
        <a-space>
          <template v-if="record.to_address_tag"><a-tag color="blue" size="small">{{ record.to_address_tag }}</a-tag></template>
          <template v-else><a-link :href="'https://bscscan.com/address/' + record.to_address" target="_blank">{{ shortHash(record.to_address) }}</a-link></template>
          <a-button type="text" size="mini" @click="copyToClipboard(record.to_address)"><icon-copy /></a-button>
          <a-button type="text" size="mini" @click="showRecordDetail(record, 'to')"><icon-eye /></a-button>
        </a-space>
      </template>
      <template #contract_address="{ record }">
        <a-space>
          <a-link :href="'https://bscscan.com/token/' + record.contract_address" target="_blank">{{ shortHash(record.contract_address) }}</a-link>
          <a-button type="text" size="mini" @click="copyToClipboard(record.contract_address)"><icon-copy /></a-button>
        </a-space>
      </template>
      <template #amount="{ record }">
        <a-tag :color="record.type === 'buy' ? 'green' : 'red'">{{ formatAmount(record.amount) }}</a-tag>
      </template>
      <template #timestamp="{ record }">
        <span>{{ formatTime(record.timestamp) }}</span>
      </template>
    </a-table>

    <a-modal v-model:visible="tagModalVisible" title="Address Tag Management" width="800px" @ok="handleTagModalOk" @cancel="handleTagModalCancel">
      <div style="margin-bottom: 16px;"><strong>Address: </strong> {{ currentAddress }}</div>
      <div style="margin-bottom: 16px;">
        <strong>Add Tag: </strong>
        <a-form :model="tagForm" layout="vertical" style="margin-top: 8px;">
          <a-form-item label="Tag Name">
            <a-auto-complete v-model="tagForm.tag" :data="uniqueTags" placeholder="Enter tag name" allow-clear />
          </a-form-item>
          <a-form-item label="Description">
            <a-textarea v-model="tagForm.description" placeholder="Enter tag description (optional)" :rows="2" />
          </a-form-item>
          <a-form-item><a-button type="primary" @click="addTag" :loading="tagLoading">Add Tag</a-button></a-form-item>
        </a-form>
      </div>
      <div>
        <strong>Existing Tags: </strong>
        <div style="margin-top: 8px;">
          <template v-if="currentAddressTags.length > 0">
            <div v-for="tag in currentAddressTags" :key="tag.tag" class="tag-item">
              <div class="tag-info">
                <strong>{{ tag.tag }}</strong>
                <div v-if="tag.description" class="tag-desc">{{ tag.description }}</div>
              </div>
              <a-button type="text" status="danger" size="mini" @click="removeTag(tag)"><icon-delete /></a-button>
            </div>
          </template>
          <template v-else><a-empty description="No tags" /></template>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:visible="detailModalVisible" title="Record Detail" width="1000px" @ok="handleDetailModalOk" @cancel="handleDetailModalCancel">
      <div v-if="currentDetailRecord">
        <a-descriptions :column="2" size="small" style="margin-bottom: 20px;">
          <a-descriptions-item label="Block Number">{{ currentDetailRecord.block_number }}</a-descriptions-item>
          <a-descriptions-item label="Transaction Type">
            <a-tag :color="currentDetailRecord.type === 'buy' ? 'green' : 'red'">{{ currentDetailRecord.type === 'buy' ? 'Buy' : 'Sell' }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="From Address">
            <a-link :href="'https://bscscan.com/address/' + currentDetailRecord.from_address" target="_blank">{{ currentDetailRecord.from_address }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="To Address">
            <a-link :href="'https://bscscan.com/address/' + currentDetailRecord.to_address" target="_blank">{{ currentDetailRecord.to_address }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="Token Contract">
            <a-link :href="'https://bscscan.com/token/' + currentDetailRecord.contract_address" target="_blank">{{ currentDetailRecord.contract_address }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="Amount">
            <a-tag :color="currentDetailRecord.type === 'buy' ? 'green' : 'red'">{{ formatAmount(currentDetailRecord.amount) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Tx Hash">
            <a-link :href="'https://bscscan.com/tx/' + currentDetailRecord.tx_hash" target="_blank">{{ currentDetailRecord.tx_hash }}</a-link>
          </a-descriptions-item>
          <a-descriptions-item label="Time">{{ formatTime(currentDetailRecord.timestamp) }}</a-descriptions-item>
        </a-descriptions>
        <a-divider>Similar Records</a-divider>
        <div v-if="similarRecords.length > 0">
          <a-table :columns="detailColumns" :data="similarRecords" :pagination="{ pageSize: 10 }" row-key="tx_hash" size="small">
            <template #tx_hash="{ record }">
              <a-link :href="'https://bscscan.com/tx/' + record.tx_hash" target="_blank">{{ shortHash(record.tx_hash) }}</a-link>
            </template>
            <template #from_address="{ record }">
              <a-link :href="'https://bscscan.com/address/' + record.from_address" target="_blank">{{ shortHash(record.from_address) }}</a-link>
            </template>
            <template #to_address="{ record }">
              <a-link :href="'https://bscscan.com/address/' + record.to_address" target="_blank">{{ shortHash(record.to_address) }}</a-link>
            </template>
            <template #amount="{ record }">
              <a-tag :color="record.type === 'buy' ? 'green' : 'red'">{{ formatAmount(record.amount) }}</a-tag>
            </template>
            <template #timestamp="{ record }">
              <span>{{ formatTime(record.timestamp) }}</span>
            </template>
          </a-table>
        </div>
        <a-empty v-else description="No similar records" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCopy, IconPlus, IconDelete, IconTag, IconEye, IconLeft, IconRight } from '@arco-design/web-vue/es/icon'
import { getTokenFilterAnalysisAggregate, getAddressTags, addAddressTag, deleteAddressTag, getUniqueAddressTags } from '@/api/index'
import { copyToClipboard } from '@/utils/clipboard'
import dayjs from 'dayjs'

interface AddressPair { from: string; to: string; data?: any[]; loading?: boolean }
const buyAddresses = ref<AddressPair[]>([{ from: '', to: '', data: [], loading: false }])
const sellAddresses = ref<AddressPair[]>([{ from: '', to: '', data: [], loading: false }])

const searchParams = ref({
  contractAddress: '',
  startBlock: null as number | null,
  endBlock: null as number | null,
  minAmount: null as number | null,
  maxAmount: null as number | null,
  decimals: 18,
  limit: 100,
})

const stepSize = ref(100)
interface HistoryRecord { id: number; time: string; range: string; buyTotal: string; sellTotal: string; buyCount: number; sellCount: number; netFlow: string; netAmount: number }
const historyRecords = ref<HistoryRecord[]>([])

const nextStep = () => {
  const currentEnd = Number(searchParams.value.endBlock)
  const step = Number(stepSize.value)
  
  if (!isNaN(currentEnd) && !isNaN(step)) {
    const newStart = currentEnd
    const newEnd = currentEnd + step
    searchParams.value.startBlock = newStart
    searchParams.value.endBlock = newEnd
    fetchAllData()
  } else {
    Message.warning('Please ensure End Block and Step Size are valid numbers')
  }
}

const prevStep = () => {
  const currentStart = Number(searchParams.value.startBlock)
  const step = Number(stepSize.value)
  
  if (!isNaN(currentStart) && !isNaN(step)) {
    const newEnd = currentStart
    const newStartVal = Math.max(0, currentStart - step)
    searchParams.value.startBlock = newStartVal
    searchParams.value.endBlock = newEnd
    fetchAllData()
  } else {
    Message.warning('Please ensure Start Block and Step Size are valid numbers')
  }
}

const addToHistory = () => {
  const now = dayjs().format('HH:mm:ss')
  const range = (searchParams.value.startBlock || 'Beginning') + ' - ' + (searchParams.value.endBlock || 'Latest')
  const buyCount = buyAddresses.value.reduce((acc, p) => acc + (p.data?.length || 0), 0)
  const sellCount = sellAddresses.value.reduce((acc, p) => acc + (p.data?.length || 0), 0)
  historyRecords.value.unshift({
    id: Date.now(),
    time: now,
    range: range,
    buyTotal: buyTotalAmount.value,
    sellTotal: sellTotalAmount.value,
    buyCount: buyCount,
    sellCount: sellCount,
    netFlow: netAmountDisplay.value,
    netAmount: netAmount.value
  })
}

const removeHistory = (id: number) => {
  historyRecords.value = historyRecords.value.filter(r => r.id !== id)
}

const clearHistory = () => {
  historyRecords.value = []
}

const currentView = ref<string>('all')
const transactions = ref<any[]>([])
const buyTotalAmount = ref<string>('0')
const sellTotalAmount = ref<string>('0')
const refreshInterval = ref<number>(60)
const isPolling = ref(false)
let timer: any = null

const columns = [
  { title: 'Block', dataIndex: 'block_number', width: 100 },
  { title: 'Tx Hash', dataIndex: 'tx_hash', slotName: 'tx_hash', width: 140 },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address', width: 140 },
  { title: 'To', dataIndex: 'to_address', slotName: 'to_address', width: 140 },
  { title: 'Contract', dataIndex: 'contract_address', slotName: 'contract_address', width: 120 },
  { title: 'Amount', dataIndex: 'amount', slotName: 'amount', width: 130 },
  { title: 'Time', dataIndex: 'timestamp', slotName: 'timestamp', width: 170 },
]

const detailColumns = [
  { title: 'Block', dataIndex: 'block_number', width: 100 },
  { title: 'Tx Hash', dataIndex: 'tx_hash', slotName: 'tx_hash', width: 140 },
  { title: 'From', dataIndex: 'from_address', slotName: 'from_address', width: 140 },
  { title: 'To', dataIndex: 'to_address', slotName: 'to_address', width: 140 },
  { title: 'Amount', dataIndex: 'amount', slotName: 'amount', width: 130 },
  { title: 'Time', dataIndex: 'timestamp', slotName: 'timestamp', width: 170 },
]

const shortHash = (val: string) => !val ? '' : val.length > 12 ? val.slice(0, 6) + '...' + val.slice(-6) : val
const formatTime = (val: string) => !val ? '' : dayjs(val).format('YYYY-MM-DD HH:mm:ss')
const formatAmount = (val: string | number) => {
  if (!val) return '0'
  const num = typeof val === 'string' ? parseFloat(val) : val
  return isNaN(num) ? '0' : num.toFixed(6)
}

const getPollingButtonText = () => isPolling.value ? 'Stop Polling' : 'Start Polling'
const togglePolling = () => isPolling.value ? stopPolling() : startPolling()

const isAutoStep = ref(true)
const hasStartedPolling = ref(false)

const executeAutoStep = () => {
  if (!isAutoStep.value) {
    fetchAllData()
    return
  }

  const currentEnd = Number(searchParams.value.endBlock)
  const step = Number(stepSize.value)
  
  if (!isNaN(currentEnd) && !isNaN(step)) {
    const newStart = currentEnd
    const newEndVal = currentEnd + step
    searchParams.value.startBlock = newStart
    searchParams.value.endBlock = newEndVal
    fetchAllData()
  } else {
    fetchAllData()
  }
}

const startPolling = () => {
  if (isPolling.value) return
  isPolling.value = true
  
  if (!hasStartedPolling.value) {
     // First request of the session: Search CURRENT range only.
     fetchAllData()
     hasStartedPolling.value = true
  } else {
      // Restarting: Immediately execute next step (resume flow)
      executeAutoStep()
  }
  
  timer = setInterval(() => {
    executeAutoStep()
  }, (refreshInterval.value || 60) * 1000)
}

const stopPolling = () => {
  isPolling.value = false
  if (timer) { clearInterval(timer); timer = null }
}

const addBuyAddress = () => buyAddresses.value.push({ from: '', to: '', data: [], loading: false })
const removeBuyAddress = (index: number) => {
  buyAddresses.value.splice(index, 1)
  if (currentView.value === 'buy-' + index) { currentView.value = 'all'; updateDisplayedData() }
}
const addSellAddress = () => sellAddresses.value.push({ from: '', to: '', data: [], loading: false })
const removeSellAddress = (index: number) => {
  sellAddresses.value.splice(index, 1)
  if (currentView.value === 'sell-' + index) { currentView.value = 'all'; updateDisplayedData() }
}

const buildRequestParams = (type?: 'buy' | 'sell' | 'all') => {
  const params: any = { contractAddress: searchParams.value.contractAddress?.toLowerCase(), decimals: searchParams.value.decimals, limit: searchParams.value.limit }
  if (searchParams.value.startBlock) params.startBlock = searchParams.value.startBlock
  if (searchParams.value.endBlock) params.endBlock = searchParams.value.endBlock
  if (searchParams.value.minAmount) params.minAmount = String(Number(searchParams.value.minAmount) * Math.pow(10, searchParams.value.decimals))
  if (searchParams.value.maxAmount) params.maxAmount = String(Number(searchParams.value.maxAmount) * Math.pow(10, searchParams.value.decimals))
  const buyGroups = buyAddresses.value.filter(p => p.from || p.to).map(p => ({ from: p.from?.toLowerCase(), to: p.to?.toLowerCase() }))
  const sellGroups = sellAddresses.value.filter(p => p.from || p.to).map(p => ({ from: p.from?.toLowerCase(), to: p.to?.toLowerCase() }))
  if ((type === 'buy' || type === 'all') && buyGroups.length > 0) params.buyAddressGroups = buyGroups
  if ((type === 'sell' || type === 'all') && sellGroups.length > 0) params.sellAddressGroups = sellGroups
  return params
}

const fetchAllData = async () => {
  if (!searchParams.value.contractAddress) { Message.warning('Please enter contract address'); return }
  try {
    const params = buildRequestParams('all')
    const result = await getTokenFilterAnalysisAggregate(params)
    if ((result as any).code !== 200) throw new Error((result as any).message || 'Query failed')
    const data = (result as any).data
    buyAddresses.value.forEach(p => p.data = [])
    sellAddresses.value.forEach(p => p.data = [])
    if (data.buyGroups) data.buyGroups.forEach((g: any, i: number) => { if (buyAddresses.value[i]) buyAddresses.value[i].data = (g.transactions || []).map((t: any) => ({ ...t, amount: String(t.amount_decimal || t.amount || '0') })) })
    if (data.sellGroups) data.sellGroups.forEach((g: any, i: number) => { if (sellAddresses.value[i]) sellAddresses.value[i].data = (g.transactions || []).map((t: any) => ({ ...t, amount: String(t.amount_decimal || t.amount || '0') })) })
    updateTotalAmounts()
    updateDisplayedData()
    addToHistory()
    Message.success('Query completed')
  } catch (e: any) { Message.error('Query failed: ' + (e?.message || 'Unknown error')) }
}

const fetchRowData = async (type: 'buy' | 'sell', _index: number) => {
  if (!searchParams.value.contractAddress) { Message.warning('Please enter contract address'); return }
  try {
    const params = buildRequestParams(type)
    const result = await getTokenFilterAnalysisAggregate(params)
    if ((result as any).code !== 200) throw new Error((result as any).message || 'Query failed')
    const data = (result as any).data
    buyAddresses.value.forEach(p => p.data = [])
    sellAddresses.value.forEach(p => p.data = [])
    if (data.buyGroups) data.buyGroups.forEach((g: any, i: number) => { if (buyAddresses.value[i]) buyAddresses.value[i].data = (g.transactions || []).map((t: any) => ({ ...t, amount: String(t.amount_decimal || t.amount || '0') })) })
    if (data.sellGroups) data.sellGroups.forEach((g: any, i: number) => { if (sellAddresses.value[i]) sellAddresses.value[i].data = (g.transactions || []).map((t: any) => ({ ...t, amount: String(t.amount_decimal || t.amount || '0') })) })
    updateTotalAmounts()
    updateDisplayedData()
    Message.success('Query successful! ' + (data.summary?.groupSuccessCount || 0) + ' groups, ' + (data.summary?.totalTransactionCount || 0) + ' records')
  } catch (e: any) { Message.error('Query failed: ' + (e?.message || 'Unknown error')) }
}

const fetchBuyAddress = async (index: number) => {
  if (!buyAddresses.value[index] || (!buyAddresses.value[index].from && !buyAddresses.value[index].to)) return
  buyAddresses.value[index].loading = true
  buyAddresses.value[index].data = []
  buyAddresses.value.forEach((p, i) => { if (i !== index) p.data = [] })
  try {
    const params: any = { contractAddress: searchParams.value.contractAddress?.toLowerCase(), decimals: searchParams.value.decimals, limit: searchParams.value.limit }
    if (searchParams.value.startBlock) params.startBlock = searchParams.value.startBlock
    if (searchParams.value.endBlock) params.endBlock = searchParams.value.endBlock
    if (searchParams.value.minAmount) params.minAmount = String(Number(searchParams.value.minAmount) * Math.pow(10, searchParams.value.decimals))
    if (searchParams.value.maxAmount) params.maxAmount = String(Number(searchParams.value.maxAmount) * Math.pow(10, searchParams.value.decimals))
    const group = { from: buyAddresses.value[index].from?.toLowerCase(), to: buyAddresses.value[index].to?.toLowerCase() }
    if (group.from || group.to) params.buyAddressGroups = [group]
    const result = await getTokenFilterAnalysisAggregate(params)
    if ((result as any).code !== 200) throw new Error((result as any).message)
    const data = (result as any).data
    if (data.buyGroups?.[0]?.status !== 'failed') {
      buyAddresses.value[index].data = (data.buyGroups[0].transactions || []).map((t: any) => ({ ...t, amount: String(t.amount_decimal || t.amount || '0') }))
      Message.success('Buy row ' + (index + 1) + ' query successful, ' + (data.buyGroups[0].transactions?.length || 0) + ' records')
    } else { Message.error('Buy row ' + (index + 1) + ' query failed: ' + data.buyGroups[0].error) }
    if (currentView.value === 'buy-' + index || currentView.value === 'all') updateDisplayedData()
  } catch (e: any) { Message.error('Query failed: ' + (e?.message || 'Unknown error')) }
  finally { updateTotalAmounts(); if (buyAddresses.value[index]) buyAddresses.value[index].loading = false }
}

const fetchSellAddress = async (index: number) => {
  if (!sellAddresses.value[index] || (!sellAddresses.value[index].from && !sellAddresses.value[index].to)) return
  sellAddresses.value[index].loading = true
  sellAddresses.value[index].data = []
  sellAddresses.value.forEach((p, i) => { if (i !== index) p.data = [] })
  try {
    const params: any = { contractAddress: searchParams.value.contractAddress?.toLowerCase(), decimals: searchParams.value.decimals, limit: searchParams.value.limit }
    if (searchParams.value.startBlock) params.startBlock = searchParams.value.startBlock
    if (searchParams.value.endBlock) params.endBlock = searchParams.value.endBlock
    if (searchParams.value.minAmount) params.minAmount = String(Number(searchParams.value.minAmount) * Math.pow(10, searchParams.value.decimals))
    if (searchParams.value.maxAmount) params.maxAmount = String(Number(searchParams.value.maxAmount) * Math.pow(10, searchParams.value.decimals))
    const group = { from: sellAddresses.value[index].from?.toLowerCase(), to: sellAddresses.value[index].to?.toLowerCase() }
    if (group.from || group.to) params.sellAddressGroups = [group]
    const result = await getTokenFilterAnalysisAggregate(params)
    if ((result as any).code !== 200) throw new Error((result as any).message)
    const data = (result as any).data
    if (data.sellGroups?.[0]?.status !== 'failed') {
      sellAddresses.value[index].data = (data.sellGroups[0].transactions || []).map((t: any) => ({ ...t, amount: String(t.amount_decimal || t.amount || '0') }))
      Message.success('Sell row ' + (index + 1) + ' query successful, ' + (data.sellGroups[0].transactions?.length || 0) + ' records')
    } else { Message.error('Sell row ' + (index + 1) + ' query failed: ' + data.sellGroups[0].error) }
    if (currentView.value === 'sell-' + index || currentView.value === 'all') updateDisplayedData()
  } catch (e: any) { Message.error('Query failed: ' + (e?.message || 'Unknown error')) }
  finally { updateTotalAmounts(); if (sellAddresses.value[index]) sellAddresses.value[index].loading = false }
}

const fetchAllBuyAddresses = async () => { await fetchRowData('buy', 0); currentView.value = 'all'; updateDisplayedData() }
const fetchAllSellAddresses = async () => { await fetchRowData('sell', 0); currentView.value = 'all'; updateDisplayedData() }

const updateTotalAmounts = () => {
  let buyTotal = 0, sellTotal = 0
  buyAddresses.value.forEach(p => { if (p.data) buyTotal += p.data.reduce((s: number, t: any) => s + Number(t.amount), 0) })
  sellAddresses.value.forEach(p => { if (p.data) sellTotal += p.data.reduce((s: number, t: any) => s + Number(t.amount), 0) })
  buyTotalAmount.value = buyTotal.toLocaleString()
  sellTotalAmount.value = sellTotal.toLocaleString()
}

const viewRowData = async (type: 'buy' | 'sell', index: number) => {
  try { type === 'buy' ? await fetchBuyAddress(index) : await fetchSellAddress(index) }
  catch { return }
  currentView.value = type + '-' + index
  updateDisplayedData()
  Message.success('Switched to ' + (type === 'buy' ? 'buy' : 'sell') + ' row ' + (index + 1) + ' data')
}

const viewAllData = async () => { await fetchAllData(); currentView.value = 'all'; updateDisplayedData(); Message.success('Switched to all data') }

const updateDisplayedData = () => {
  let allData: any[] = []
  if (currentView.value === 'all') {
    buyAddresses.value.forEach(p => { if (p.data) allData = allData.concat(p.data) })
    sellAddresses.value.forEach(p => { if (p.data) allData = allData.concat(p.data) })
  } else {
    const [type, idx] = currentView.value.split('-')
    const addrs = type === 'buy' ? buyAddresses.value : sellAddresses.value
    const rowData = addrs[parseInt(idx)]
    if (rowData?.data) allData = rowData.data
  }
  transactions.value = allData
}

const netAmount = computed(() => {
  let buyTotal = 0, sellTotal = 0
  buyAddresses.value.forEach(p => { if (p.data) buyTotal += p.data.reduce((s: number, t: any) => s + Number(t.amount), 0) })
  sellAddresses.value.forEach(p => { if (p.data) sellTotal += p.data.reduce((s: number, t: any) => s + Number(t.amount), 0) })
  return buyTotal - sellTotal
})
const netAmountDisplay = computed(() => netAmount.value.toLocaleString())

const tagModalVisible = ref(false)
const currentAddress = ref('')
const currentAddressTags = ref<any[]>([])
const uniqueTags = ref<string[]>([])
const tagLoading = ref(false)
const tagForm = ref({ tag: '', description: '' })
const detailModalVisible = ref(false)
const currentDetailRecord = ref<any>(null)
const similarRecords = ref<any[]>([])

const showTagModal = async (address: string) => { currentAddress.value = address; tagModalVisible.value = true; await loadAddressTags(address); await loadUniqueTags() }
const loadAddressTags = async (address: string) => {
  try {
    const res = await getAddressTags({ address })
    const tags = res.data?.tags || []
    if (Array.isArray(tags)) {
      if (tags.length === 0) currentAddressTags.value = []
      else if (typeof tags[0] === 'string') currentAddressTags.value = tags.map((t: string, i: number) => ({ id: i, tag: t, description: '' }))
      else if (typeof tags[0] === 'object') currentAddressTags.value = tags
      else currentAddressTags.value = []
    } else currentAddressTags.value = []
  } catch { currentAddressTags.value = [] }
}
const loadUniqueTags = async () => { try { const res = await getUniqueAddressTags(); uniqueTags.value = res.data?.tags || [] } catch { } }
const addTag = async () => {
  if (!tagForm.value.tag.trim()) { Message.warning('Please enter tag name'); return }
  tagLoading.value = true
  try {
    await addAddressTag({ address: currentAddress.value, tag: tagForm.value.tag.trim(), description: tagForm.value.description.trim() })
    Message.success('Tag added successfully')
    tagForm.value.tag = ''; tagForm.value.description = ''
    await loadAddressTags(currentAddress.value); await loadUniqueTags()
  } catch { Message.error('Add tag failed') }
  finally { tagLoading.value = false }
}
const removeTag = async (tag: any) => {
  try {
    await deleteAddressTag({ address: currentAddress.value, tag: tag.tag })
    Message.success('Tag deleted successfully')
    await loadAddressTags(currentAddress.value)
  } catch { Message.error('Delete tag failed') }
}
const handleTagModalOk = () => { tagModalVisible.value = false }
const handleTagModalCancel = () => { tagModalVisible.value = false; tagForm.value.tag = ''; tagForm.value.description = '' }

const showRecordDetail = async (record: any, type: string) => {
  currentDetailRecord.value = record
  detailModalVisible.value = true
  try {
    similarRecords.value = transactions.value.filter((item: any) => item.tx_hash !== record.tx_hash && ((type === 'from' && item.from_address === record.from_address) || (type === 'to' && item.to_address === record.to_address) || item.contract_address === record.contract_address))
  } catch { similarRecords.value = [] }
}
const handleDetailModalOk = () => { detailModalVisible.value = false; currentDetailRecord.value = null; similarRecords.value = [] }
const handleDetailModalCancel = () => { detailModalVisible.value = false; currentDetailRecord.value = null; similarRecords.value = [] }

onUnmounted(() => { if (timer) { clearInterval(timer); timer = null } })
</script>

<style scoped lang="scss">
.token-filter-analysis { padding: 20px; max-width: 1600px; margin: 0 auto; }
.page-header { margin-bottom: 20px; h1 { font-size: 24px; font-weight: 600; color: var(--color-text-1, #fff); margin: 0; } }
.search-form { margin-bottom: 16px; padding: 16px; background: var(--color-bg-2, #2a2a2b); border-radius: 4px; }
.stepping-card { margin-bottom: 16px; :deep(.arco-card-header) { border-bottom: 1px solid var(--color-border, #2a2a2b); } }
.history-card { margin-bottom: 16px; :deep(.arco-card-header) { border-bottom: 1px solid var(--color-border, #2a2a2b); } }
.filter-form { margin-bottom: 12px; padding: 12px 16px; background: var(--color-bg-2, #2a2a2b); border-radius: 4px; }
.action-bar { margin: 12px 0; }
.address-card { margin-bottom: 16px; :deep(.arco-card-header) { border-bottom: 1px solid var(--color-border, #2a2a2b); } }
.address-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; .address-input { flex: 1; } }
.summary-card { margin-bottom: 16px; }
.transaction-table { margin-top: 20px; }
.tag-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px; border: 1px solid var(--color-border, #2a2a2b); border-radius: 4px; margin-bottom: 8px; .tag-info { flex: 1; .tag-desc { color: var(--color-text-3, #999); font-size: 12px; margin-top: 4px; } } }
</style>
