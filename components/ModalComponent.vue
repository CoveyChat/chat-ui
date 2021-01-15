<template>
    <transition name="modal">
        <div class="modal-mask">
          <div class="modal-wrapper">
            <div class="modal-container">

              <div class="modal-header">
                <slot name="header">
                  default header
                </slot>
              </div>

              <div class="modal-body">
                <slot name="body">
                  default body
                </slot>
              </div>

              <div class="modal-footer">
                <slot name="footer">
                  <button
                    v-bind:class="{[closeClass]: closeClass, 'btn btn-md btn-primary': !closeClass}"
                    class="modal-default-button" @click="$emit('close')">
                    {{closeText || 'Close'}}
                  </button>

                  <button v-if="confirm"
                    v-bind:class="{[confirmClass]: confirmClass, 'btn btn-md btn-primary': !confirmClass}"
                    class="modal-default-button" @click="$emit('confirm')">
                    {{confirmText || 'Confirm'}}
                  </button>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </transition>

</template>

<style scoped>
    .modal-mask {
        position: fixed;
        z-index: 2147483646;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: table;
        transition: opacity 0.3s ease;
    }

    .modal-wrapper {
        display: table-cell;
        vertical-align: middle;
    }

    .modal-container {
        z-index: 2147483647;
        width: 90%;
        max-width:500px;
        margin: 0px auto;
        padding: 20px 30px;
        background-color: #fff;
        border-radius: 2px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
        transition: all 0.3s ease;
        font-family: Helvetica, Arial, sans-serif;
    }

    .modal-header h3 {
        margin-top: 0;
        color: #42b983;
    }

    .modal-body {
        margin: 20px 0;
    }

    .modal-default-button {
        float: right;
    }

    /*
    * The following styles are auto-applied to elements with
    * transition="modal" when their visibility is toggled
    * by Vue.js.
    *
    * You can easily play with the modal transition by editing
    * these styles.
    */

    .modal-enter {
        opacity: 0;
    }

    .modal-leave-active {
        opacity: 0;
    }

    .modal-enter .modal-container,
    .modal-leave-active .modal-container {
        -webkit-transform: scale(1.1);
        transform: scale(1.1);
    }

</style>

<script>

export default {
    name: "ModalComponent",
    props: {
        close: Object,
        confirm: Object
    },
    data: function () {
        return {
            closeClass: null,
            confirmClass: null,
            closeText: null,
            confirmText: null
        }
    },
    methods: {

    },
    beforeMount() {
        let self = this;

        //Make sure the props are valid
        if(typeof self.close != 'undefined' && self.close.class) {
            self.closeClass = self.close.class;
        }

        if(typeof self.close != 'undefined' && self.close.text) {
            self.closeText = self.close.text;
        }

        if(typeof self.confirm != 'undefined' && self.confirm.class) {
            self.confirmClass = self.confirm.class;
        }

        if(typeof self.confirm != 'undefined' && self.confirm.text) {
            self.confirmText = self.confirm.text;
        }
    },
    mounted() {
        let self = this;

    }
}

</script>