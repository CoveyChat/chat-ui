import colors from 'vuetify/es5/util/colors'

export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: false,

  axios: {
    baseURL: 'https://devbevy.chat/api/1.0'
  },

  auth: {
    redirect: {
        login: '/login',
        logout: '/',
        home: '/'
    },
    strategies: {
        local: {
            /*token: {
              property: 'token',
              required: true,
              type: 'Bearer'
            },
            user: {
              property: 'user',
              autoFetch: true
            },*/
            endpoints: {
              login: { url: 'users/login', method: 'post' },
              logout: { url: 'users/logout', method: 'post' },
              user: { url: 'users/whoami', method: 'get', propertyName: 'user' }
            }
          }
    }
  },

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    titleTemplate: '%s - bevychat-ui',
    title: 'bevychat-ui',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    "~/assets/css/global.scss"
  ],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
      '~plugins/vue-api-query'
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/auth-next',
    '@nuxtjs/toast'
  ],

  toast: {
    position: 'top-right',
    className: ["site-toaster"],
    iconPack: "material",
    duration: 2000,
    register: [ // Register custom toasts
      {
        name: 'my-error',
        message: 'Oops...Something went wrong',
        options: {
          type: 'error'
        }
      }
    ]
  },

  // Vuetify module configuration (https://go.nuxtjs.dev/config-vuetify)
  vuetify: {
    customVariables: ['~/assets/css/variables.scss'],
    treeShake: true,
    theme: {
      dark: true,
      options: {
        customProperties: true
      },
      themes: {
        dark: {
          background: '#3caea3',
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        }
      }
    }
  },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
  }
}
