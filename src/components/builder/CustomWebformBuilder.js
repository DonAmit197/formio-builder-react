import Webform from '../../../node_modules/formiojs/Webform';
import Component from 'formiojs';
import NativePromise from 'native-promise-only';
import Components from '../../../node_modules/formiojs/components/Components';
import { GlobalFormio as Formio } from '../../../node_modules/formiojs/Formio';
import {
  fastCloneDeep,
  bootstrapVersion,
  getArrayFromComponentPath,
  getStringFromComponentPath,
} from '../../../node_modules/formiojs/utils/utils';
import {
  eachComponent,
  getComponent,
} from '../../../node_modules/formiojs/utils/formUtils';
import BuilderUtils from '../../../node_modules/formiojs/utils/builder';
import autoScroll from 'dom-autoscroller';
import _ from 'lodash';
const dragula = require('dragula');
let Templates = Formio.Templates;
const WebformBuilder = require('formiojs/WebformBuilder').default;

export default class CustomWebformBuilder extends WebformBuilder {
  constructor() {
    let element, options;
    super(null, options);
  }
  attach(element) {
    console.log('C_this', this);
    this.on('change', (form) => {
      this.populateRecaptchaSettings(form);
    });
    return super.attach(element).then(() => {
      this.loadRefs(element, {
        form: 'single',
        sidebar: 'single',
        'sidebar-search': 'single',
        'sidebar-groups': 'single',
        container: 'multiple',
        'sidebar-anchor': 'multiple',
        'sidebar-group': 'multiple',
        'sidebar-container': 'multiple',
        'sidebar-component': 'multiple',
      });

      if (this.sideBarScroll && Templates.current.handleBuilderSidebarScroll) {
        Templates.current.handleBuilderSidebarScroll.call(this, this);
      }

      // Add the paste status in form
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const data = window.sessionStorage.getItem('formio.clipboard');
        if (data) {
          this.addClass(this.refs.form, 'builder-paste-mode');
        }
      }

      if (!bootstrapVersion(this.options)) {
        // Initialize
        this.refs['sidebar-group'].forEach((group) => {
          group.style.display =
            group.getAttribute('data-default') === 'true' ? 'inherit' : 'none';
        });

        // Click event
        this.refs['sidebar-anchor'].forEach((anchor, index) => {
          this.addEventListener(
            anchor,
            'click',
            () => {
              const clickedParentId = anchor
                .getAttribute('data-parent')
                .slice('#builder-sidebar-'.length);
              const clickedId = anchor
                .getAttribute('data-target')
                .slice('#group-'.length);

              this.refs['sidebar-group'].forEach((group, groupIndex) => {
                const openByDefault =
                  group.getAttribute('data-default') === 'true';
                const groupId = group.getAttribute('id').slice('group-'.length);
                const groupParent = group
                  .getAttribute('data-parent')
                  .slice('#builder-sidebar-'.length);

                group.style.display =
                  (openByDefault && groupParent === clickedId) ||
                  groupId === clickedParentId ||
                  groupIndex === index
                    ? 'inherit'
                    : 'none';
              });
            },
            true
          );
        });
      }

      if (this.keyboardActionsEnabled) {
        this.refs['sidebar-component'].forEach((component) => {
          this.addEventListener(component, 'keydown', (event) => {
            if (event.keyCode === 13) {
              this.addNewComponent(component);
            }
          });
        });
      }

      this.addEventListener(
        this.refs['sidebar-search'],
        'input',
        _.debounce((e) => {
          const searchString = e.target.value;
          this.searchFields(searchString);
        }, 300)
      );

      if (this.dragDropEnabled) {
        this.initDragula();
      }

      const drake = this.dragula;

      if (this.refs.form) {
        autoScroll([window], {
          margin: 20,
          maxSpeed: 6,
          scrollWhenOutside: true,
          autoScroll: function () {
            return this.down && drake?.dragging;
          },
        });

        return this.webform.attach(this.refs.form);
      }
    });
  }
  onDrop() {
    alert('hi');
  }
}
