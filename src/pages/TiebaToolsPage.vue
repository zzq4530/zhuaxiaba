<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTiebaStore } from '../stores/tieba'

type ToolKey =
  | '发帖'
  | '发评论'
  | '帖子列表'
  | '帖子详情'
  | '楼层详情'
  | '点赞'
  | '回复我的消息'

const tieba = useTiebaStore()

const tokenInput = ref(tieba.token)

const selectedTool = ref<ToolKey>('发帖')

const addThreadTitle = ref('')
const addThreadContentText = ref('')

const addPostMode = ref<'主帖' | '楼层'>('主帖')
const addPostId = ref('')
const addPostContent = ref('')

const listSortType = ref('0')

const threadKz = ref('')
const threadPn = ref('1')
const threadR = ref('0')

const nestedPostId = ref('')
const nestedThreadId = ref('')

const agreeMode = ref<'主帖' | '楼层'>('主帖')
const agreeThreadId = ref('')
const agreePostId = ref('')
const agreeOpType = ref<'0' | '1'>('0')

const replyMePn = ref('1')

const loading = ref(false)
const errorMessage = ref('')
const responseText = ref('')

const toolTips = computed<Record<ToolKey, string>>(() => ({
  发帖: '发布主帖（title + 文本 content）',
  发评论: '对主帖或楼层发表评论',
  帖子列表: '获取帖子列表（sort_type）',
  帖子详情: '获取帖子详情（kz/pn/r）',
  楼层详情: '获取楼中楼详情（post_id/thread_id）',
  点赞: '主帖或楼层点赞/取消',
  回复我的消息: '查询回复我的消息（pn）'
}))

function prettyPrint(data: unknown) {
  if (typeof data === 'string') return data
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

function onLogin() {
  tieba.login(tokenInput.value)
  tokenInput.value = tieba.token
}

function onLogout() {
  tieba.logout()
  tokenInput.value = ''
  responseText.value = ''
  errorMessage.value = ''
}

async function runTool() {
  loading.value = true
  errorMessage.value = ''
  responseText.value = ''
  try {
    if (selectedTool.value === '发帖') {
      const result = await tieba.request('/c/c/claw/addThread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addThreadTitle.value,
          content: [{ type: 'text', content: addThreadContentText.value }]
        })
      })
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
      return
    }

    if (selectedTool.value === '发评论') {
      const id = addPostId.value.trim()
      const content = addPostContent.value
      const payload =
        addPostMode.value === '主帖' ? { content, thread_id: Number(id) } : { content, post_id: Number(id) }

      const result = await tieba.request('/c/c/claw/addPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
      return
    }

    if (selectedTool.value === '帖子列表') {
      const result = await tieba.request(`/c/f/frs/page_claw?sort_type=${encodeURIComponent(listSortType.value)}`)
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
      return
    }

    if (selectedTool.value === '帖子详情') {
      const kz = threadKz.value.trim()
      if (!kz) {
        errorMessage.value = '请输入 帖子ID（kz）'
        return
      }
      const result = await tieba.request(
        `/c/f/pb/page_claw?pn=${encodeURIComponent(threadPn.value)}&kz=${encodeURIComponent(kz)}&r=${encodeURIComponent(
          threadR.value
        )}`
      )
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
      return
    }

    if (selectedTool.value === '楼层详情') {
      const postId = nestedPostId.value.trim()
      const threadId = nestedThreadId.value.trim()
      if (!postId || !threadId) {
        errorMessage.value = '请输入 post_id 和 thread_id'
        return
      }
      const result = await tieba.request(
        `/c/f/pb/nestedFloor_claw?post_id=${encodeURIComponent(postId)}&thread_id=${encodeURIComponent(threadId)}`
      )
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
      return
    }

    if (selectedTool.value === '点赞') {
      const threadId = agreeThreadId.value.trim()
      if (!threadId) {
        errorMessage.value = '请输入 thread_id'
        return
      }
      const body =
        agreeMode.value === '主帖'
          ? { thread_id: Number(threadId), obj_type: 3, op_type: Number(agreeOpType.value) }
          : { thread_id: Number(threadId), post_id: Number(agreePostId.value), obj_type: 1, op_type: Number(agreeOpType.value) }

      if (agreeMode.value === '楼层' && !agreePostId.value.trim()) {
        errorMessage.value = '楼层点赞需提供 post_id'
        return
      }

      const result = await tieba.request('/c/c/claw/opAgree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
      return
    }

    if (selectedTool.value === '回复我的消息') {
      const result = await tieba.request(`/mo/q/claw/replyme?pn=${encodeURIComponent(replyMePn.value)}`)
      if (!result.ok) errorMessage.value = result.message
      else responseText.value = prettyPrint(result.data)
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section>
    <h1>贴吧脚本工具</h1>

    <div v-if="!tieba.isLoggedIn" style="display: grid; gap: 8px; max-width: 520px">
      <div>
        <label>
          贴吧入驻密钥：
          <input v-model.trim="tokenInput" style="width: 100%" placeholder="粘贴密钥字符串" />
        </label>
      </div>
      <div>
        <button type="button" @click="onLogin">登录</button>
      </div>
      <p style="font-size: 12px; opacity: 0.75">密钥只保存在浏览器 localStorage，不会写入代码仓库。</p>
    </div>

    <div v-else style="display: grid; gap: 12px">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
        <span>已登录</span>
        <button type="button" @click="onLogout">退出</button>
      </div>

      <div style="display: grid; gap: 8px; max-width: 720px">
        <label>
          选择功能：
          <select v-model="selectedTool">
            <option value="发帖">发帖</option>
            <option value="发评论">发评论</option>
            <option value="帖子列表">帖子列表</option>
            <option value="帖子详情">帖子详情</option>
            <option value="楼层详情">楼层详情</option>
            <option value="点赞">点赞</option>
            <option value="回复我的消息">回复我的消息</option>
          </select>
        </label>
        <p style="font-size: 12px; opacity: 0.75">{{ toolTips[selectedTool] }}</p>
      </div>

      <form style="display: grid; gap: 8px; max-width: 720px" @submit.prevent="runTool">
        <template v-if="selectedTool === '发帖'">
          <label>
            title：
            <input v-model.trim="addThreadTitle" style="width: 100%" />
          </label>
          <label>
            content（文本）：
            <textarea v-model="addThreadContentText" rows="4" style="width: 100%"></textarea>
          </label>
        </template>

        <template v-else-if="selectedTool === '发评论'">
          <label>
            模式：
            <select v-model="addPostMode">
              <option value="主帖">主帖</option>
              <option value="楼层">楼层</option>
            </select>
          </label>
          <label>
            ID（主帖填 thread_id，楼层填 post_id）：
            <input v-model.trim="addPostId" style="width: 100%" />
          </label>
          <label>
            内容：
            <textarea v-model="addPostContent" rows="4" style="width: 100%"></textarea>
          </label>
        </template>

        <template v-else-if="selectedTool === '帖子列表'">
          <label>
            sort_type：
            <input v-model.trim="listSortType" />
          </label>
        </template>

        <template v-else-if="selectedTool === '帖子详情'">
          <label>
            帖子ID（kz）：
            <input v-model.trim="threadKz" style="width: 100%" />
          </label>
          <label>
            页码（pn）：
            <input v-model.trim="threadPn" />
          </label>
          <label>
            排序（r：0正序/1倒序/2热门）：
            <input v-model.trim="threadR" />
          </label>
        </template>

        <template v-else-if="selectedTool === '楼层详情'">
          <label>
            post_id：
            <input v-model.trim="nestedPostId" style="width: 100%" />
          </label>
          <label>
            thread_id：
            <input v-model.trim="nestedThreadId" style="width: 100%" />
          </label>
        </template>

        <template v-else-if="selectedTool === '点赞'">
          <label>
            模式：
            <select v-model="agreeMode">
              <option value="主帖">主帖</option>
              <option value="楼层">楼层</option>
            </select>
          </label>
          <label>
            thread_id：
            <input v-model.trim="agreeThreadId" style="width: 100%" />
          </label>
          <label v-if="agreeMode === '楼层'">
            post_id：
            <input v-model.trim="agreePostId" style="width: 100%" />
          </label>
          <label>
            op_type（0点赞/1取消）：
            <select v-model="agreeOpType">
              <option value="0">0</option>
              <option value="1">1</option>
            </select>
          </label>
        </template>

        <template v-else-if="selectedTool === '回复我的消息'">
          <label>
            pn：
            <input v-model.trim="replyMePn" />
          </label>
        </template>

        <div style="display: flex; gap: 12px; align-items: center">
          <button type="submit" :disabled="loading">{{ loading ? '请求中...' : '执行' }}</button>
          <span v-if="errorMessage" style="color: #b42318">{{ errorMessage }}</span>
        </div>
      </form>

      <div v-if="responseText" style="max-width: 980px">
        <h3>响应</h3>
        <pre style="white-space: pre-wrap; word-break: break-word">{{ responseText }}</pre>
      </div>
    </div>
  </section>
</template>
