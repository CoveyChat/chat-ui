import Vue from 'vue'
import ModalComponent from '../ModalComponent.vue'

export default class Modal {
    constructor(target, options, component = ModalComponent) {
        if(typeof options.props == 'undefined') {
            options.props = {};
        }

        const ModalWindow = Vue.extend(component);
        var modal = new ModalWindow({propsData: options.props});

        if(typeof options.header != 'undefined') {
            var headerNode = modal.$createElement('div', {domProps: {innerHTML:options.header}});
            modal.$slots.header = [headerNode];
        }
        if(typeof options.body != 'undefined') {
            var bodyNode = modal.$createElement('div', {domProps: {innerHTML:options.body}});
            modal.$slots.body = [bodyNode];
        }
        if(typeof options.footer != 'undefined') {
            var footerNode = modal.$createElement('div', {domProps: {innerHTML:options.footer}});
            modal.$slots.footer = [footerNode];
        }

        modal.$mount();
        target.appendChild(modal.$el)

        modal.$on('close', function(e) {
            modal.$destroy();
            modal.$el.remove();
        });

        modal.$on('confirm', function(e) {
            modal.$destroy();
            modal.$el.remove();
        });

        return modal;
    }

}
