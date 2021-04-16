<template>
    <v-app dark>
        <navigation />

        <v-main>
            <v-container fluid>
                <nuxt />
            </v-container>
        </v-main>

    </v-app>
</template>

<script>
import Navigation from '~/components/Navigation.vue';

export default {
  data () {
    return {

    }
  }
}
</script>
