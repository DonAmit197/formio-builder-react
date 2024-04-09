import { Form, FormBuilder } from '@formio/react';
import { useState, useEffect } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Card from 'react-bootstrap/Card';
import ReactJson from 'react-json-view';
import builderOptions from './builder-options/builderOptions';
import WebformBuilder from './WebFormBuilder';
import { Formio, FormEdit } from '@formio/react';

import TextFieldEdit from './builder-options/TexFieldEdit';

import './styles/Builder.css';

const _formiojs = require('formiojs');

console.log('FormioJS', _formiojs);

//console.log(_formiojs.Builders.builders.webform.prototype);
//console.log(WebformBuilder);

const Builder = () => {
  const [jsonSchema, setSchema] = useState({
    components: [
      {
        label: 'Form Title',
        tableView: true,
        key: 'formTitle',
        type: 'textfield',
        input: true,
        showSidebar: false,
      },
      {
        label:
          'Add a description to your form to set expectations for those filling it out.',
        tableView: true,
        key: 'formDescription',
        type: 'textarea',
        input: true,
        showSidebar: false,
      },
      {
        label: 'Confirmation Page What Happens Next',
        tableView: false,
        key: 'whnContent',
        type: 'content',
        html: '<p>The confirmation message will appear on a new page once the form has been submitted. Some useful things you can add to your confirmation page are:</p>',
        input: false,
        showSidebar: false,
      },
      {
        label: 'Submit',
        tableView: false,
        key: 'submit',
        type: 'button',
        input: true,
        showSidebar: false,
      },
    ],
  });
  const onFormChange = (schema) => {
    setSchema({ ...schema, components: [...schema.components] });
    console.log(schema);
  };
  // console.log(
  //   "Formio Builder Obj:",
  //   Formio.Components.components.textarea.editForm()
  // );

  const TextFieldComponent = Formio.Components.components.textfield;
  TextFieldComponent.editForm = function () {
    return {
      components: [TextFieldEdit],
    };
  };

  // const sideBarBtns = document.querySelectorAll('.formcomponent.drag-copy');
  // sideBarBtns.forEach((btn) => {
  //   //console.log(btn);
  //   btn.setAttribute('tabIndex', '0');
  //   btn.addEventListener('keydown', function (e) {

  //   });
  // });

  return (
    <Tabs id="builderTabs" className="mb-3">
      <Tab eventKey="builder" title="Edit">
        <FormBuilder
          form={jsonSchema}
          options={builderOptions}
          onChange={onFormChange}
        />
        {/* <FormEdit
            form={jsonSchema}
            options={builderOptions}
            saveText="SAve"
            saveForm={onFormChange}
          /> */}
      </Tab>
      <Tab eventKey="formRender" title="Use">
        <Card className="my-4">
          <Card.Body>
            <Card.Title className="text-center">Use</Card.Title>
            <Form form={jsonSchema} />
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="json-data" title="JSON Schema">
        <Card title="Form JSON Schema" className="my-4">
          <Card.Body>
            <Card.Title className="text-center">JSON Schema</Card.Title>
            <ReactJson
              src={jsonSchema}
              name={null}
              collapsed={true}
            ></ReactJson>
          </Card.Body>
        </Card>
      </Tab>
    </Tabs>
  );
};
export default Builder;
