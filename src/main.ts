import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VApp, VMain, VBtn, VCard, VCardText, VNavigationDrawer, VList, VListItem, VListItemTitle, VTextField, VSelect, VProgressLinear, VToolbar, VSpacer, VIcon, VChip, VSwitch } from 'vuetify/components'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import './styles.css'

const vuetify = createVuetify({
  components: { VApp, VMain, VBtn, VCard, VCardText, VNavigationDrawer, VList, VListItem, VListItemTitle, VTextField, VSelect, VProgressLinear, VToolbar, VSpacer, VIcon, VChip, VSwitch },
  theme: { defaultTheme: 'dark', themes: { dark: { colors: { background: '#09090b', surface: '#111116', primary: '#8b5cf6' } } } }
})

createApp(App).use(vuetify).mount('#app')
