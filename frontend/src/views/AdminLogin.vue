<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto w-full max-w-md">
      <div class="login-card">
        <h1 class="page-title mb-6 text-center text-4xl font-bold">
          Admin Login
        </h1>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="form-label" for="email">Email</label>
            <input
                id="email"
                v-model="email"
                type="email"
                class="form-input"
                autocomplete="email"
                required
            />
          </div>

          <div>
            <label class="form-label" for="password">Password</label>
            <input
                id="password"
                v-model="password"
                type="password"
                class="form-input"
                autocomplete="current-password"
                required
            />
          </div>

          <p v-if="errorMessage" class="form-error">
            {{ errorMessage }}
          </p>

          <button
              type="submit"
              class="login-button w-full"
              :disabled="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(async () => {
  const { data, error } = await supabase.auth.getUser()

  if (!error && data?.user) {
    await router.push('/admin')
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      errorMessage.value = error.message || 'Login failed'
      return
    }

    if (!data?.user) {
      errorMessage.value = 'Login failed'
      return
    }

    await router.push('/admin')
  } catch (error) {
    errorMessage.value = 'Unable to reach Supabase'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.page-title {
  color: var(--text-main);
}

.login-card {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 1.5rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-main);
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  background: var(--surface-strong);
  color: var(--text-main);
  box-sizing: border-box;
}

.form-input:focus {
  outline: 2px solid var(--border-strong);
  outline-offset: 2px;
}

.form-error {
  color: #dc2626;
  font-size: 0.95rem;
}

.login-button {
  border: 1px solid var(--border-strong);
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: 999px;
  padding: 0.85rem 1.1rem;
  font-weight: 600;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.login-button:hover {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>