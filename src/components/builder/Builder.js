import { Form, FormBuilder } from '@formio/react';
import { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Card from 'react-bootstrap/Card';
import ReactJson from 'react-json-view';
import builderOptions from './builder-options/builderOptions';
import { Formio, FormEdit } from '@formio/react';
import TextFieldEdit from './builder-options/TexFieldEdit';

import './styles/Builder.css';
const Builder = () => {
  const [jsonSchema, setSchema] = useState({
    components: [
      {
        label: 'Form Title',
        tableView: true,
        key: 'formTitle',
        type: 'textfield',
        input: true,
      },
      {
        label:
          'Add a description to your form to set expectations for those filling it out.',
        tableView: true,
        key: 'formDescription',
        type: 'textarea',
        input: true,
      },
      {
        label: 'Confirmation Page What Happens Next',
        tableView: false,
        key: 'whnContent',
        type: 'content',
        html: '<p>The confirmation message will appear on a new page once the form has been submitted. Some useful things you can add to your confirmation page are:</p>',
        input: false,
      },
    ],
  });
  const onFormChange = (schema) => {
    setSchema({ ...schema, components: [...schema.components] });
  };
  console.log(
    'Formio Builder Obj:',
    Formio.Components.components.textarea.editForm()
  );
  const TextFieldComponent = Formio.Components.components.textfield;
  TextFieldComponent.editForm = function () {
    return {
      components: [TextFieldEdit],
    };
  };

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
              collapsed={true}></ReactJson>
          </Card.Body>
        </Card>
      </Tab>
    </Tabs>
  );
};
export default Builder;
