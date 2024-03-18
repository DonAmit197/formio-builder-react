const builderOptions = {
  builder: {
    basic: false,
    advanced: false,
    data: false,
    layout: false,
    premium: false,

    custom: {
      title: 'Fields',
      weight: 0,
      components: {
        //textarea: true,
        shortAnswer: {
          title: 'Short Answer',
          key: 'shortAnswer',
          icon: 'terminal',
          schema: {
            label: 'Short Answer',
            type: 'textfield',
            key: 'shortAnswer',
            input: true,
          },
        },

        longAnswer: {
          title: 'Long Answer',
          key: 'longAnswer',
          icon: 'terminal',
          schema: {
            label: 'Long Answer',
            type: 'textarea',
            key: 'longAnswer',
            inputFormat: 'plain',
            input: true,
            wysiwyg: false,
          },
        },
        number: true,
        checkbox: true,
        selectboxes: true,
        select: true,
        radio: true,
        button: true,
        email: true,
        url: true,
        phoneNumber: true,
        address: true,
        datetime: true,
        day: true,
        time: true,
        currency: true,
        datagrid: true,
        file: true,
      },
    },
    layouts: {
      title: 'Layout',
      weight: 2,
      components: {
        panel: true,
        columns: true,
        content: true,
        htmlelement: true,
      },
    },
  },
  editForm: {
    textarea: [
      {
        // key: 'api',
        // ignore: true,
      },
    ],
  },
  noDefaultSubmitButton: true,
};
export default builderOptions;
