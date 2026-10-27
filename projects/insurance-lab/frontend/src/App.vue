<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

type Application = { id: number; applicantName: string; age: number; productCode: string; premium: number; status: string; createdAt?: string }
type Policy = { id: number; applicationId: number; policyNumber: string; status: string; applicantName: string; premium: number; issuedAt: string }
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080'
const applications = ref<Application[]>([])
const policies = ref<Policy[]>([])
const loading = ref(false)
const error = ref('')
const message = ref('')
const tab = ref<'applications' | 'policies'>('applications')
const form = reactive({ applicantName: '测试用户', age: 30, productCode: 'LIFE-BASIC', premium: 1200 })
const canSubmit = computed(() => form.applicantName.trim().length > 0 && form.age >= 18 && form.age <= 60 && form.premium > 0)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiBase + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || Object.values(body.errors || {}).flat().join(' ') || `HTTP ${response.status}`)
  return body as T
}
async function refresh() {
  loading.value = true
  error.value = ''
  try {
    ;[applications.value, policies.value] = await Promise.all([
      request<Application[]>('/api/applications'),
      request<Policy[]>('/api/policies'),
    ])
  } catch (e) { error.value = (e as Error).message }
  finally { loading.value = false }
}
async function createApplication() {
  message.value = ''; error.value = ''
  try {
    await request('/api/applications', { method: 'POST', body: JSON.stringify(form) })
    message.value = '投保申请已创建，等待核保。'
    await refresh()
  } catch (e) { error.value = (e as Error).message }
}
async function underwrite(item: Application, approve: boolean) {
  message.value = ''; error.value = ''
  try {
    await request(`/api/applications/${item.id}/underwrite`, { method: 'POST', body: JSON.stringify({ approve, note: '前端教学操作' }) })
    message.value = `申请 #${item.id} 已${approve ? '核保通过' : '拒绝'}。`
    await refresh()
  } catch (e) { error.value = (e as Error).message }
}
async function pay(item: Application) {
  message.value = ''; error.value = ''
  try {
    const result = await request<{ policyNumber: string; duplicate: boolean }>(`/api/applications/${item.id}/pay`, {
      method: 'POST', body: JSON.stringify({ idempotencyKey: `ui-app-${item.id}` }),
    })
    message.value = result.duplicate ? '已识别重复请求，未重复创建保单。' : `模拟支付成功，保单号：${result.policyNumber}`
    await refresh()
  } catch (e) { error.value = (e as Error).message }
}
onMounted(refresh)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div><div class="eyebrow">INSURANCE QA LAB</div><h1>保险业务综合实战平台</h1><p>从投保到保单签发的全流程测试练习</p></div>
      <span class="env">LOCAL · TRAINING</span>
    </header>
    <section class="notice"><strong>教学环境</strong><span>所有数据均为虚构；支付为模拟操作，不接入真实支付渠道。</span></section>
    <section class="stats">
      <article><span>投保申请</span><strong>{{ applications.length }}</strong></article>
      <article><span>待核保</span><strong>{{ applications.filter(x => x.status === 'Pending').length }}</strong></article>
      <article><span>有效保单</span><strong>{{ policies.filter(x => x.status === 'Active').length }}</strong></article>
    </section>
    <section class="panel">
      <div class="section-heading"><div><h2>新建投保申请</h2><p>教学规则：年龄 18–60 岁，保费大于 0 且最多两位小数。</p></div></div>
      <form class="form-grid" @submit.prevent="createApplication">
        <label>投保人名称<input v-model.trim="form.applicantName" maxlength="100" required /></label>
        <label>年龄<input v-model.number="form.age" type="number" min="0" max="120" required /></label>
        <label>产品代码<input v-model.trim="form.productCode" required /></label>
        <label>保费（元）<input v-model.number="form.premium" type="number" min="0.01" step="0.01" required /></label>
        <button class="primary" type="submit" :disabled="!canSubmit">提交投保申请</button>
      </form>
    </section>
    <div v-if="error" class="alert error" role="alert">{{ error }}</div>
    <div v-if="message" class="alert success" role="status">{{ message }}</div>
    <section class="panel">
      <div class="section-heading">
        <div><h2>业务工作台</h2><p>核保、模拟支付与保单查询。</p></div>
        <button class="secondary" @click="refresh" :disabled="loading">{{ loading ? '刷新中…' : '刷新数据' }}</button>
      </div>
      <nav class="tabs"><button :class="{ active: tab === 'applications' }" @click="tab = 'applications'">投保申请</button><button :class="{ active: tab === 'policies' }" @click="tab = 'policies'">保单查询</button></nav>
      <div v-if="tab === 'applications'" class="table-wrap">
        <table><thead><tr><th>ID</th><th>投保人</th><th>产品</th><th>保费</th><th>状态</th><th>操作</th></tr></thead>
          <tbody><tr v-for="item in applications" :key="item.id"><td>#{{ item.id }}</td><td>{{ item.applicantName }}<small>年龄 {{ item.age }}</small></td><td>{{ item.productCode }}</td><td>¥{{ Number(item.premium).toFixed(2) }}</td><td><span class="status" :class="item.status.toLowerCase()">{{ item.status }}</span></td><td class="actions">
            <template v-if="item.status === 'Pending'"><button class="small approve" @click="underwrite(item, true)">核保通过</button><button class="small reject" @click="underwrite(item, false)">拒绝</button></template>
            <button v-if="item.status === 'Approved'" class="small approve" @click="pay(item)">模拟支付</button><span v-if="item.status === 'Paid'" class="muted">已签发</span>
          </td></tr><tr v-if="!applications.length"><td colspan="6" class="empty">暂无申请，请先创建一条测试数据。</td></tr></tbody>
        </table>
      </div>
      <div v-else class="table-wrap"><table><thead><tr><th>保单号</th><th>申请 ID</th><th>投保人</th><th>保费</th><th>状态</th><th>签发时间</th></tr></thead>
        <tbody><tr v-for="policy in policies" :key="policy.id"><td>{{ policy.policyNumber }}</td><td>#{{ policy.applicationId }}</td><td>{{ policy.applicantName }}</td><td>¥{{ Number(policy.premium).toFixed(2) }}</td><td><span class="status active">{{ policy.status }}</span></td><td>{{ new Date(policy.issuedAt).toLocaleString() }}</td></tr><tr v-if="!policies.length"><td colspan="6" class="empty">暂无保单。请先创建申请、核保通过并模拟支付。</td></tr></tbody></table></div>
    </section>
    <footer>Insurance Lab · ASP.NET Core + PostgreSQL + Vue 3 · 测试学习专用</footer>
  </div>
</template>
