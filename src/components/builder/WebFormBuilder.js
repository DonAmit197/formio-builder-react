import Webform from '../../../node_modules/formiojs/Webform';
import Component from '../../../node_modules/formiojs/components/_classes/component/Component';
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
const WebformBuilder = require('formiojs/WebformBuilder');

console.log('WebformBuilder', WebformBuilder);
console.log('NativePromise', NativePromise);

WebformBuilder.default.prototype.initDragula = function () {
  const options = this.options;
  console.log('this2', this.refs);
  if (this.dragula) {
    this.dragula.destroy();
  }
  //const $btns = this.refs['sidebar-container'][0].children;
  const _self = this;

  console.log('self', _self);

  /**
   * Keyboard event on drag
   */
  this.addKeyBoardEvent();
  const containersArray = Array.prototype.slice
    .call(this.refs['sidebar-container'])
    .filter((item) => {
      return item.id !== 'group-container-resource';
    });

  if (!dragula) {
    return;
  }

  this.dragula = dragula(containersArray, {
    moves(el) {
      let moves = true;

      const list = Array.from(el.classList).filter(
        (item) => item.indexOf('formio-component-') === 0
      );
      list.forEach((item) => {
        const key = item.slice('formio-component-'.length);
        if (options.disabled && options.disabled.includes(key)) {
          moves = false;
        }
      });

      if (el.classList.contains('no-drag')) {
        moves = false;
      }
      return moves;
    },
    copy(el) {
      return el.classList.contains('drag-copy');
    },
    accepts(el, target) {
      return !el.contains(target) && !target.classList.contains('no-drop');
    },
  }).on('drop', (element, target, source, sibling) =>
    this.onDrop(element, target, source, sibling)
  );
};

WebformBuilder.default.prototype.editComponent = function (
  component,
  parent,
  isNew,
  isJsonEdit,
  original,
  flags = {}
) {
  console.log('editComp', component);
  console.log('this1 inside editComponent', this);

  if (!component.key) {
    return;
  }
  this.saved = false;
  const componentCopy = fastCloneDeep(component);
  let ComponentClass = Components.components[componentCopy.type];
  const isCustom = ComponentClass === undefined;
  isJsonEdit = isJsonEdit || isCustom;
  ComponentClass = isCustom ? Components.components.unknown : ComponentClass;
  // Make sure we only have one dialog open at a time.
  if (this.dialog) {
    this.dialog.close();
    this.highlightInvalidComponents();
  }

  // This is the render step.
  const editFormOptions = _.clone(_.get(this, 'options.editForm', {}));

  if (this.editForm) {
    this.editForm.destroy();
  }

  // Allow editForm overrides per component.
  const overrides = _.get(this.options, `editForm.${componentCopy.type}`, {});

  // Pass along the form being edited.
  editFormOptions.editForm = this.form;
  editFormOptions.editComponent = component;
  editFormOptions.flags = flags;

  this.hook('editComponentParentInstance', editFormOptions, parent);

  this.editForm = new Webform({
    ..._.omit(this.options, [
      'hooks',
      'builder',
      'events',
      'attachMode',
      'skipInit',
    ]),
    language: this.options.language,
    ...editFormOptions,
  });

  this.hook('editFormProperties', parent);

  this.editForm.form =
    isJsonEdit && !isCustom
      ? {
          components: [
            {
              type: 'textarea',
              as: 'json',
              editor: 'ace',
              weight: 10,
              input: true,
              key: 'componentJson',
              label: 'Component JSON',
              tooltip: 'Edit the JSON for this component.',
            },
            {
              type: 'checkbox',
              key: 'showFullSchema',
              label: 'Full Schema',
            },
          ],
        }
      : ComponentClass.editForm(_.cloneDeep(overrides));
  const instanceOptions = {
    inFormBuilder: true,
  };

  this.hook('instanceOptionsPreview', instanceOptions);

  const instance = new ComponentClass(componentCopy, instanceOptions);
  const schema = this.hook('builderComponentSchema', component, instance);

  this.editForm.submission = isJsonEdit
    ? {
        data: {
          componentJson: schema,
          showFullSchema: this.options.showFullJsonSchema,
        },
      }
    : {
        data: instance.component,
      };

  if (this.preview) {
    this.preview.destroy();
  }
  if (
    !ComponentClass.builderInfo.hasOwnProperty('preview') ||
    ComponentClass.builderInfo.preview
  ) {
    this.preview = new Webform(
      _.omit({ ...this.options, preview: true }, [
        'hooks',
        'builder',
        'events',
        'attachMode',
        'calculateValue',
      ])
    );

    this.hook('previewFormSettitngs', schema, isJsonEdit);
  }

  this.showPreview = ComponentClass.builderInfo.showPreview ?? true;

  this.componentEdit = this.ce('div', { class: 'component-edit-container' });
  this.setContent(
    this.componentEdit,
    this.renderTemplate('builderEditForm', {
      componentInfo: ComponentClass.builderInfo,
      editForm: this.editForm.render(),
      preview: this.preview ? this.preview.render() : false,
      showPreview: this.showPreview,
      helplinks: this.helplinks,
    })
  );

  this.dialog = this.createModal(
    this.componentEdit,
    _.get(this.options, 'dialogAttr', {})
  );

  // This is the attach step.
  this.editForm.attach(this.componentEdit.querySelector('[ref="editForm"]'));

  this.hook('editFormWrapper');

  this.updateComponent(componentCopy);

  this.editForm.on('change', (event) => {
    if (event.changed) {
      if (
        event.changed.component &&
        event.changed.component.key === 'showFullSchema'
      ) {
        const { value } = event.changed;
        this.editForm.submission = {
          data: {
            componentJson: value ? instance.component : component,
            showFullSchema: value,
          },
        };
        return;
      }
      // See if this is a manually modified key. Treat custom component keys as manually modified
      if (
        (event.changed.component && event.changed.component.key === 'key') ||
        isJsonEdit
      ) {
        componentCopy.keyModified = true;
      }

      let isComponentLabelChanged = false;
      if (event.changed.instance) {
        isComponentLabelChanged = ['label', 'title'].includes(
          event.changed.instance.path
        );
      } else if (event.changed.component) {
        isComponentLabelChanged = ['label', 'title'].includes(
          event.changed.component.key
        );
      }

      if (isComponentLabelChanged) {
        // Ensure this component has a key.
        if (isNew) {
          if (!event.data.keyModified) {
            this.editForm.everyComponent((component) => {
              if (
                component.key === 'key' &&
                component.parent.component.key === 'tabs'
              ) {
                component.setValue(this.updateComponentKey(event.data));
                return false;
              }
            });
          }

          if (this.form) {
            let formComponents = this.findNamespaceRoot(parent.formioComponent);

            // excluding component which key uniqueness is to be checked to prevent the comparing of the same keys
            formComponents = formComponents.filter(
              (comp) => editFormOptions.editComponent.id !== comp.id
            );

            // Set a unique key for this component.
            BuilderUtils.uniquify(formComponents, event.data);
          }
        }
      }

      // Update the component.
      this.updateComponent(
        event.data.componentJson || event.data,
        event.changed
      );
    }
  });

  this.attachEditComponentControls(
    component,
    parent,
    isNew,
    original,
    ComponentClass
  );

  const dialogClose = () => {
    this.editForm.destroy(true);
    if (this.preview) {
      this.preview.destroy(true);
      this.preview = null;
    }
    if (isNew && !this.saved) {
      this.removeComponent(component, parent, original);
      this.highlightInvalidComponents();
    }
    // Clean up.
    this.removeEventListener(this.dialog, 'close', dialogClose);
    this.dialog = null;
  };
  this.addEventListener(this.dialog, 'close', dialogClose);

  // Called when we edit a component.
  this.emit('editComponent', component);
};

WebformBuilder.default.prototype.attachEditComponentControls = function (
  component,
  parent,
  isNew,
  original,
  ComponentClass
) {
  const cancelButtons = this.componentEdit.querySelectorAll(
    '[ref="cancelButton"]'
  );
  cancelButtons.forEach((cancelButton) => {
    this.editForm.addEventListener(cancelButton, 'click', (event) => {
      event.preventDefault();
      this.editForm.detach();
      this.emit('cancelComponent', component);

      this.dialog.close();
      this.highlightInvalidComponents();
    });
  });

  const removeButtons = this.componentEdit.querySelectorAll(
    '[ref="removeButton"]'
  );

  removeButtons.forEach((removeButton) => {
    this.editForm.addEventListener(removeButton, 'click', (event) => {
      event.preventDefault();
      // Since we are already removing the component, don't trigger another remove.
      this.saved = true;
      this.editForm.detach();
      this.removeComponent(component, parent, original);
      this.dialog.close();
      this.highlightInvalidComponents();
    });
  });

  const saveButtons = this.componentEdit.querySelectorAll('[ref="saveButton"]');
  saveButtons.forEach((saveButton) => {
    this.editForm.addEventListener(saveButton, 'click', (event) => {
      console.log(event);
      event.preventDefault();
      if (
        !this.editForm.checkValidity(
          this.editForm.data,
          true,
          this.editForm.data
        )
      ) {
        this.editForm.setPristine(false);
        this.editForm.showErrors();
        return false;
      }
      this.saved = true;
      this.saveComponent(component, parent, isNew, original);
    });
  });

  const previewButtons = this.componentEdit.querySelectorAll(
    '[ref="previewButton"]'
  );
  previewButtons.forEach((previewButton) => {
    this.editForm.addEventListener(previewButton, 'click', (event) => {
      event.preventDefault();
      this.showPreview = !this.showPreview;
      this.editForm.detach();
      this.setContent(
        this.componentEdit,
        this.renderTemplate('builderEditForm', {
          componentInfo: ComponentClass.builderInfo,
          editForm: this.editForm.render(),
          preview: this.preview ? this.preview.render() : false,
          showPreview: this.showPreview,
          helplinks: this.helplinks,
        })
      );
      this.editForm.attach(
        this.componentEdit.querySelector('[ref="editForm"]')
      );
      this.attachEditComponentControls(
        component,
        parent,
        isNew,
        original,
        ComponentClass
      );
    });
  });
};
WebformBuilder.default.prototype.addKeyBoardEvent = function () {
  console.log('ADDKEYB', this);

  this.refs['sidebar-component'].forEach((component) => {
    component.setAttribute('tabindex', '0');
    this.addEventListener(component, 'keydown', (event) => {
      if (event.keyCode === 13) {
        this.addNewComponent(component);
      }
    });
  });
  // if (this.componentEdit) {
  //   const _self = this;
  //   const cancelBtn = this.componentEdit.querySelector('[ref="cancelButton"]');
  //   cancelBtn.addEventListener('keydown', function (event) {
  //     console.log('inside new ev', _self.component);
  //     _self.dialog.close();
  //   });
  // }
  //const _form = this.refs.form;
  //const _element = document.createElement('div');
  //_element.classList.add('amit-form');
  // _element.style.height = '300px';
  // _form.prepend(_element);
};

WebformBuilder.default.prototype.attachComponent = function (
  element,
  component
) {
  // Add component to element for later reference.
  console.log('attachComponent Method', element);
  element.setAttribute('tabindex', '0');
  const btnElem = document.createElement('a');
  btnElem.setAttribute('class', 'moveDn');
  btnElem.textContent = 'Move';
  btnElem.setAttribute('tabindex', '0');
  element.appendChild(btnElem);
  btnElem.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      console.log(e);
      const thisParent = e.target.parentNode;
      const nextSibling = thisParent.nextElementSibling;
      const grandParent = thisParent.parentNode;
      if (nextSibling) {
        // If there is a next sibling, insert the parent element before the next sibling's next sibling
        grandParent.insertBefore(thisParent, nextSibling.nextElementSibling);
      } else {
        // If there is no next sibling, append the parent element to the grand parent
        grandParent.appendChild(thisParent);
      }
    }
  });
  element.formioComponent = component;

  component.loadRefs(element, {
    removeComponent: 'single',
    editComponent: 'single',
    moveComponent: 'single',
    copyComponent: 'single',
    pasteComponent: 'single',
    editJson: 'single',
  });
  if (component.component.showSidebar === false) {
    component.refs.copyComponent = '';
    component.refs.removeComponent = '';
    //component.refs.editComponent = '';
    component.refs.addButton = '';
    component.refs.editJson = '';
    component.refs.moveComponent = '';

    console.log('Element get', [element]);

    const componentHoverElem = element.querySelector('[data-noattach="true"]');
    element.classList.add('no-drag');
    element.style.cursor = 'auto';
    element.classList.add('essential-item');
    if (componentHoverElem) {
      //componentHoverElem.remove();
      const removeComElem = componentHoverElem.querySelector(
        '[ref="removeComponent"]'
      );
      const copyComponentElem = componentHoverElem.querySelector(
        '[ref="copyComponent"]'
      );
      const moveComponentElem = componentHoverElem.querySelector(
        '[ref="moveComponent"]'
      );
      const editComponentJSONElem =
        componentHoverElem.querySelector('[ref="editJson"]');
      removeComElem.remove();
      copyComponentElem.remove();
      editComponentJSONElem.remove();
      moveComponentElem.remove();
    }
  }

  if (component.refs.copyComponent) {
    this.attachTooltip(component.refs.copyComponent, this.t('Copy'));

    component.addEventListener(component.refs.copyComponent, 'click', () =>
      this.copyComponent(component)
    );
  }

  if (component.refs.pasteComponent) {
    const pasteToolTip = this.attachTooltip(
      component.refs.pasteComponent,
      this.t('Paste below')
    );

    component.addEventListener(component.refs.pasteComponent, 'click', () => {
      pasteToolTip.hide();
      this.pasteComponent(component);
    });
  }

  if (component.refs.moveComponent) {
    this.attachTooltip(component.refs.moveComponent, this.t('Move'));
    if (this.keyboardActionsEnabled) {
      component.addEventListener(component.refs.moveComponent, 'click', () => {
        this.moveComponent(component);
      });
    }
  }

  const parent = this.getParentElement(element);

  if (component.refs.editComponent) {
    this.attachTooltip(component.refs.editComponent, this.t('Edit'));

    component.addEventListener(component.refs.editComponent, 'click', () =>
      this.editComponent(
        component.schema,
        parent,
        false,
        false,
        component.component,
        { inDataGrid: component.isInDataGrid }
      )
    );
  }

  if (component.refs.editJson) {
    this.attachTooltip(component.refs.editJson, this.t('Edit JSON'));

    component.addEventListener(component.refs.editJson, 'click', () =>
      this.editComponent(
        component.schema,
        parent,
        false,
        true,
        component.component
      )
    );
  }

  if (component.refs.removeComponent) {
    this.attachTooltip(component.refs.removeComponent, this.t('Remove'));

    component.addEventListener(component.refs.removeComponent, 'click', () =>
      this.removeComponent(component.schema, parent, component.component)
    );
  }

  return element;
};

export default WebformBuilder;
