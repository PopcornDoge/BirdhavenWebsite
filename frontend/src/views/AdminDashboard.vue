<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto max-w-4xl">
      <h1 class="page-title text-4xl font-bold">Admin Dashboard</h1>
      <p class="page-text mt-4">
        Signed in as {{ user?.email }}
      </p>

      <div class="mt-8 flex flex-wrap gap-4">
        <router-link to="/admin/art" class="admin-btn">
          Manage Art
        </router-link>

        <button class="admin-btn" @click="handleLogout">
          Logout
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)

onMounted(async () => {
  const response = await fetch('http://localhost:4000/api/auth/me', {
    credentials: 'include',
  })

  if (!response.ok) {
    await router.push('/admin/login')
    return
  }

  const data = await response.json()
  user.value = data.user
})

const handleLogout = async () => {
  await fetch('http://localhost:4000/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })

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

.admin-btn {
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 600;
}
</style>