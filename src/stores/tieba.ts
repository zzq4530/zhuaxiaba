import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type RequestResult = { ok: true; data: unknown; rawText: string } | { ok: false; message: string; rawText?: string }

const TOKEN_STORAGE_KEY = 'demo_tieba_token_v1'

function parseMaybeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export const useTiebaStore = defineStore('tieba', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const isLoggedIn = computed(() => token.value.trim().length > 0)

  function login(nextToken: string) {
    token.value = nextToken.trim()
    localStorage.setItem(TOKEN_STORAGE_KEY, token.value)
  }

  function logout() {
    token.value = ''
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  async function request(path: string, init?: RequestInit): Promise<RequestResult> {
    if (!isLoggedIn.value) return { ok: false, message: '请先输入密钥登录' }

    const res = await fetch(`/tieba-api${path}`, {
      ...init,
      headers: {
        Authorization: token.value,
        ...init?.headers
      }
    })

    const rawText = await res.text()
    const data = parseMaybeJson(rawText)

    if (!res.ok) {
      const message = typeof data === 'string' ? data : `请求失败：HTTP ${res.status}`
      return { ok: false, message, rawText }
    }

    return { ok: true, data, rawText }
  }

  return { token, isLoggedIn, login, logout, request }
})

