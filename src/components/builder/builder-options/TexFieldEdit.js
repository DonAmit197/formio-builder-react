const TextFieldEdit = {
  key: 'tabs',
  type: 'tabs',

  components: [
    {
      key: 'display',
      label: 'Display',
      weight: 0,
      components: [
        {
          key: 'label',
          autofocus: true,
          input: true,
          label: 'Label',
          placeholder: 'Field Label',
          tooltip: 'The label for this field that will appear next to it.',
          type: 'textfield',
          validate: {
            required: true,
          },
          weight: 0,
        },
        {
          key: 'key',
          input: true,
          label: 'Property Key',
          tooltip: 'The name of this field in the API endpoint',
          type: 'textfield',
          validate: {
            pattern: '(\\w|\\w[\\w-.]*\\w)',
            patternMessage:
              'The property name must only contain alphanumeric characters, underscores, dots and dashes and should not be ended by dash or dot.',
            required: true,
          },
          weight: 20,
        },
        {
          data: {
            values: [
              {
                label: 'Top',
                value: 'top',
              },
              {
                label: 'Left (Left-aligned)',
                value: 'left-left',
              },
              {
                label: 'Left (Right-aligned)',
                value: 'left-right',
              },
              {
                label: 'Right (Left-aligned)',
                value: 'right-left',
              },
              {
                label: 'Right (Right-aligned)',
                value: 'right-right',
              },
              {
                label: 'Bottom ',
                value: 'bottom',
              },
            ],
          },
          dataSrc: 'values',
          defaultValue: 'Top',
          input: true,
          key: 'labelPosition',
          label: 'Label Position',
          tooltip: 'Position for the label for this field.',
          type: 'select',
          weight: 30,
        },
      ],
    },
  ],
};

export default TextFieldEdit;
