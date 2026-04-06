import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ComicPage from '../views/ComicPage.vue'
import ChapterSelect from '../views/ChapterSelect.vue'
import ArtPage from '../views/ArtPage.vue'
import LegalPage from '../views/Legal.vue'
import Privacy from '../views/Privacy.vue'
import AdminLogin from '../views/AdminLogin.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import AdminArtManager from "../views/AdminArtManager.vue";
import AdminComics from "../views/AdminComics.vue";

const routes = [
    { path: '/', component: Home },
    { path: '/chapters', component: ChapterSelect },
    { path: '/read/:chapter', component: ComicPage },
    { path: '/art', component: ArtPage },
    { path: '/legal', component: LegalPage },
    { path: '/privacy', component: Privacy },
    { path: '/admin/login', component: AdminLogin },
    { path: '/admin', component: AdminDashboard },
    { path: '/admin/art', component: AdminArtManager },
    { path: '/admin/comics', component: AdminComics },
]

export default createRouter({
    history: createWebHistory(),
    routes,
})