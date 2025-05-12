
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ImpressumMapping } from '@/components/ImpressumMapping';
import { ImpressumData } from '@/hooks/useImpressumScrape';

const meta = {
  title: 'Components/ImpressumMapping',
  component: ImpressumMapping,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
} satisfies Meta<typeof ImpressumMapping>;

export default meta;
type Story = StoryObj<typeof ImpressumMapping>;

export const Default: Story = {
  args: {
    data: {
      fields: {
        company: [
          { value: 'Example Company GmbH', method: 'regex', conf: 0.8 },
          { value: 'Example GmbH', method: 'heading', conf: 0.5 }
        ],
        address: [
          { value: 'Example Street 123, 12345 Berlin', method: 'regex', conf: 0.8 },
          { value: '12345 Berlin', method: 'postal-only', conf: 0.5 }
        ],
        phone: [
          { value: '+49 30 12345678', method: 'tel-link', conf: 0.9 },
          { value: '030 12345678', method: 'regex', conf: 0.7 }
        ],
        email: [
          { value: 'info@example.com', method: 'mailto', conf: 1.0 },
          { value: 'info@example.com (Mail)', method: 'regex', conf: 0.6 }
        ],
        ceos: [
          { value: 'John Doe', method: 'regex', conf: 0.7 },
          { value: 'Jane Smith', method: 'regex', conf: 0.7 }
        ],
      },
      source: 'https://example.com/impressum'
    },
    onSubmit: async (data) => {
      console.log('Submitted:', data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};

export const WithoutCEOs: Story = {
  args: {
    data: {
      fields: {
        company: [
          { value: 'Solo Company Ltd', method: 'jsonld', conf: 1.0 },
          { value: 'Solo Ltd', method: 'heading', conf: 0.5 }
        ],
        address: [
          { value: '123 Solo Street, London', method: 'address-tag', conf: 0.8 }
        ],
        phone: [
          { value: '+44 20 12345678', method: 'tel-link', conf: 1.0 }
        ],
        email: [
          { value: 'contact@solocompany.co.uk', method: 'mailto', conf: 1.0 }
        ],
        ceos: [],
      },
      source: 'https://solocompany.co.uk/imprint'
    },
    onSubmit: async (data) => {
      console.log('Submitted:', data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    data: {
      fields: {
        company: [
          { value: 'Example Company GmbH', method: 'regex', conf: 0.8 }
        ],
        address: [
          { value: 'Example Street 123, 12345 Berlin', method: 'regex', conf: 0.8 }
        ],
        phone: [
          { value: '+49 30 12345678', method: 'tel-link', conf: 0.9 }
        ],
        email: [
          { value: 'info@example.com', method: 'mailto', conf: 1.0 }
        ],
        ceos: [
          { value: 'John Doe', method: 'regex', conf: 0.7 },
          { value: 'Jane Smith', method: 'regex', conf: 0.7 }
        ],
      },
      source: 'https://example.com/impressum'
    },
    onSubmit: async (data) => {
      console.log('Submitted:', data);
      return new Promise(resolve => setTimeout(resolve, 2000));
    },
    isLoading: true,
  },
};

export const LowConfidence: Story = {
  args: {
    data: {
      fields: {
        company: [
          { value: 'Unclear Entity', method: 'bold', conf: 0.3 }
        ],
        address: [
          { value: 'Somewhere', method: 'regex', conf: 0.4 }
        ],
        phone: [
          { value: '12345', method: 'regex', conf: 0.3 }
        ],
        email: [
          { value: 'contact@unclear', method: 'regex', conf: 0.2 }
        ],
        ceos: [
          { value: 'Unknown Person', method: 'regex', conf: 0.3 }
        ],
      },
      source: 'https://unclear.com/about'
    },
    onSubmit: async (data) => {
      console.log('Submitted:', data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};

export const RefineFlow: Story = {
  args: {
    data: {
      fields: {
        company: [
          { value: 'tantum IT GmbH', method: 'jsonld', conf: 1.0 },
          { value: 'tantum IT', method: 'heading', conf: 0.5 },
          { value: 'tantum', method: 'bold', conf: 0.3 }
        ],
        address: [
          { value: 'Uhlandstraße 2, 70182 Stuttgart', method: 'regex', conf: 0.8 },
          { value: '70182 Stuttgart', method: 'postal-only', conf: 0.5 }
        ],
        phone: [
          { value: '+49 711 213571-0', method: 'tel-link', conf: 1.0 },
          { value: '0711 213571-0', method: 'regex', conf: 0.7 }
        ],
        email: [
          { value: 'info@tantum-it.de', method: 'mailto', conf: 1.0 },
          { value: 'info@tantum-it.de (Allgemeine Anfragen)', method: 'regex', conf: 0.6 }
        ],
        ceos: [
          { value: 'Daniel Häusser', method: 'regex', conf: 0.7 }
        ],
      },
      source: 'https://www.tantum-it.de/impressum-disclaimer/'
    },
    onSubmit: async (data) => {
      console.log('Submitted:', data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};
