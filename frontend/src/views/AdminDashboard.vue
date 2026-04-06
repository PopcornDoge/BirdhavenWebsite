<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto max-w-4xl">
      <h1 class="page-title text-4xl font-bold">Admin Dashboard</h1>

      <p v-if="isLoading" class="page-text mt-4">
        Checking session...
      </p>

      <p v-else-if="errorMessage" class="error-text mt-4">
        {{ errorMessage }}
      </p>

      <template v-else>
        <p class="page-text mt-4">
          Signed in as {{ user?.email }}
        </p>

        <div class="mt-8 flex flex-wrap gap-4">
          <router-link to="/admin/art" class="admin-btn">
            Manage Art
          </router-link>

          <router-link to="/admin/comics" class="admin-btn">
            Upload Comic Chapter
          </router-link>

          <button class="admin-btn" @click="handleLogout">
            Logout
          </button>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const router = useRouter()
const user = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {
      await router.push('/admin/login')
      return
    }

    user.value = data.user
  } catch (error) {
    errorMessage.value = 'Unable to verify session.'
  } finally {
    isLoading.value = false
  }
})

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    errorMessage.value = error.message
    return
  }

  await router.push('/admin/login')
}
</script>

<style scoped>
.page-title {
  color: var(--text-main);
}

.page-text {
  color: var(--text-muted);
}

.error-text {
  color: #dc2626;
}

.admin-btn {
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 600;
}
</style>