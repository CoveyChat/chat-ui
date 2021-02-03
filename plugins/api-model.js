// inject global axios instance as http client to Model

import StaticModel from '~/models/StaticModel'

export default function (ctx, inject) {
    StaticModel.$axios = ctx.$axios
}